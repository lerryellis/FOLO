import { supabase } from './supabase';
import type { Transaction } from './folo-data';

type TransactionRow = {
  id: string;
  amount: number;
  category_name: string;
  category_type: Transaction['categoryType'];
  notes: string | null;
  transaction_date: string;
  is_recurring?: boolean;
  recurring_end_date?: string | null;
};

async function synchroniseLinkedGoalProgress(userId: string, goalIds: string[]) {
  for (const goalId of goalIds) {
    const { data: goalTransactions, error: goalTransactionsError } = await supabase
      .from('goal_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('goal_id', goalId);

    if (goalTransactionsError) throw goalTransactionsError;

    const progress = (goalTransactions ?? []).reduce((total, entry) => total + Number(entry.amount || 0), 0);
    const { error: goalError } = await supabase
      .from('financial_goals')
      .update({ current_progress: progress })
      .eq('id', goalId)
      .eq('user_id', userId);

    if (goalError) throw goalError;
  }
}

function toTransaction(row: TransactionRow & { is_recurring?: boolean; recurring_end_date?: string | null }): Transaction {
  return {
    id: row.id,
    name: row.notes || row.category_name,
    category: row.category_name,
    categoryType: row.category_type,
    amountMinor: row.category_type === 'INCOME'
      ? Math.round(row.amount * 100)
      : -Math.round(row.amount * 100),
    date: row.transaction_date,
    note: row.notes || undefined,
    pending: false,
    isRecurring: row.is_recurring || undefined,
    recurringEndDate: row.recurring_end_date || undefined,
  };
}

/**
 * Get or create the current budget period for a user
 */
export async function getOrCreateBudgetPeriod(userId: string, date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Calculate start and end dates for the month
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  try {
    // Check if period already exists
    const { data: existingPeriod, error: fetchError } = await supabase
      .from('budget_periods')
      .select('id')
      .eq('user_id', userId)
      .eq('start_date', startDate)
      .eq('end_date', endDate)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingPeriod) {
      return existingPeriod.id;
    }

    // Create new period if it doesn't exist
    const { data: newPeriod, error: createError } = await supabase
      .from('budget_periods')
      .insert({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        starting_balance: 0,
      })
      .select('id')
      .single();

    if (createError) throw createError;
    return newPeriod.id;
  } catch (error) {
    console.error('Error managing budget period:', error);
    throw error;
  }
}

/**
 * Save a transaction to the database
 */
export async function saveTransaction(userId: string, transaction: Transaction) {
  try {
    const budgetPeriodId = await getOrCreateBudgetPeriod(userId, new Date(transaction.date));

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        budget_period_id: budgetPeriodId,
        category_type: transaction.categoryType,
        category_name: transaction.category,
        amount: Math.abs(transaction.amountMinor) / 100, // Convert from minor units to decimal
        transaction_date: transaction.date,
        notes: transaction.note || null,
        is_recurring: transaction.isRecurring || false,
        recurring_end_date: transaction.recurringEndDate || null,
      })
      .select()
      .single();

    if (error) {
      const errorMsg = error instanceof Error ? error.message : (error as any)?.message || JSON.stringify(error);
      throw new Error(`Failed to insert transaction: ${errorMsg}`);
    }

    if (!data) {
      throw new Error('No data returned from transaction insert');
    }

    return toTransaction(data as TransactionRow);
  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Error saving transaction:', msg);
    throw error;
  }
}

/**
 * Fetch all transactions for a user in a given month
 */
export async function fetchTransactions(userId: string, date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false });

  if (error) throw error;

  // Convert database format to app format
  return (data ?? []).map((row) => toTransaction(row as TransactionRow));
}

/**
 * Update a transaction
 */
export async function updateTransaction(userId: string, transactionId: string, updates: Partial<Transaction>) {
  try {
    const updateData: Record<string, string | number | boolean | null> = {};

    if (updates.amountMinor !== undefined) {
      updateData.amount = Math.abs(updates.amountMinor) / 100;
    }
    if (updates.date !== undefined) {
      updateData.transaction_date = updates.date;
    }
    if (updates.note !== undefined) {
      updateData.notes = updates.note || null;
    }
    if (updates.category !== undefined) {
      updateData.category_name = updates.category;
    }
    if (updates.isRecurring !== undefined) {
      updateData.is_recurring = updates.isRecurring;
    }
    if (updates.recurringEndDate !== undefined) {
      updateData.recurring_end_date = updates.recurringEndDate || null;
    }

    // If backdating, we need to find the correct budget period first
    if (updates.date !== undefined) {
      const newDate = new Date(updates.date);
      const monthStart = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      const monthEnd = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);

      const { data: budgetPeriod, error: budgetError } = await supabase
        .from('budget_periods')
        .select('id')
        .eq('user_id', userId)
        .gte('start_date', monthStart.toISOString().split('T')[0])
        .lte('end_date', monthEnd.toISOString().split('T')[0])
        .single();

      if (budgetError && budgetError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is ok if the period doesn't exist yet
        throw new Error(`Budget period lookup failed: ${budgetError.message}`);
      }

      // If budget period exists, update it; otherwise the transaction will still update
      if (budgetPeriod) {
        updateData.budget_period_id = budgetPeriod.id;
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`Failed to update transaction: ${errorMsg}. Check that the transaction exists and belongs to you.`);
    }

    if (!data) {
      throw new Error('Transaction update returned no data. Transaction may not exist or belong to another user.');
    }

    const { data: linkedGoalRows, error: linkedGoalsError } = await supabase
      .from('goal_transactions')
      .select('goal_id')
      .eq('user_id', userId)
      .eq('transaction_id', transactionId);

    if (linkedGoalsError) throw linkedGoalsError;

    if (linkedGoalRows && linkedGoalRows.length > 0) {
      const { error: linkUpdateError } = await supabase
        .from('goal_transactions')
        .update({
          amount: Math.abs(Number(data.amount)),
          transaction_date: data.transaction_date,
        })
        .eq('user_id', userId)
        .eq('transaction_id', transactionId);

      if (linkUpdateError) throw linkUpdateError;
      await synchroniseLinkedGoalProgress(userId, linkedGoalRows.map((row) => row.goal_id));
    }

    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Error updating transaction:', errorMsg);
    throw error;
  }
}

/**
 * Delete a transaction and unlink from any associated goals
 */
export async function deleteTransaction(userId: string, transactionId: string) {
  try {
    // Step 1: Find linked goals before deletion
    const { data: linkedGoalRows, error: linkedGoalsError } = await supabase
      .from('goal_transactions')
      .select('goal_id')
      .eq('user_id', userId)
      .eq('transaction_id', transactionId);

    if (linkedGoalsError) {
      const errorMsg = linkedGoalsError instanceof Error ? linkedGoalsError.message : JSON.stringify(linkedGoalsError);
      throw new Error(`Failed to check linked goals: ${errorMsg}`);
    }

    // Step 2: Remove goal links (cascading delete)
    if (linkedGoalRows && linkedGoalRows.length > 0) {
      const { error: unlinkError } = await supabase
        .from('goal_transactions')
        .delete()
        .eq('user_id', userId)
        .eq('transaction_id', transactionId);

      if (unlinkError) {
        const errorMsg = unlinkError instanceof Error ? unlinkError.message : JSON.stringify(unlinkError);
        throw new Error(`Failed to unlink from goals: ${errorMsg}`);
      }
    }

    // Step 3: Delete the transaction itself
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (deleteError) {
      const errorMsg = deleteError instanceof Error ? deleteError.message : JSON.stringify(deleteError);
      throw new Error(`Failed to delete transaction: ${errorMsg}. Transaction may not exist or belong to another user.`);
    }

    // Step 4: Update goal progress for any linked goals
    if (linkedGoalRows && linkedGoalRows.length > 0) {
      try {
        await synchroniseLinkedGoalProgress(userId, linkedGoalRows.map((row) => row.goal_id));
      } catch (progressError) {
        // Log but don't fail - transaction is already deleted
        console.warn('Warning: Failed to update goal progress after transaction delete:', progressError);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Error deleting transaction:', errorMsg);
    throw error;
  }
}

/**
 * Get user's profile (including currency preference)
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(
  userId: string,
  email: string,
  displayName: string,
  currencyCode: string
) {
  // `maybeSingle` treats an absent profile as normal, but preserves database
  // failures such as a missing relation or an RLS policy failure.
  const { data: existing, error: existingError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        currency_code: currencyCode,
        currency_symbol: getCurrencySymbol(currencyCode),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email,
      display_name: displayName,
      currency_code: currencyCode,
      currency_symbol: getCurrencySymbol(currencyCode),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete all transactions for a specific month
 */
export async function deleteTransactionsByMonth(userId: string, date: Date) {
  try {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (error) throw error;

    return { success: true, message: `All transactions for ${new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date)} deleted.` };
  } catch (error) {
    console.error('Error deleting transactions by month:', error);
    throw error;
  }
}

/**
 * Map currency code to symbol
 */
function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    GHS: '₵',
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
  };
  return symbols[code] || '$';
}

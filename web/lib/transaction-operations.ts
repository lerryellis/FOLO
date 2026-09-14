import { supabase } from './supabase';
import type { Transaction } from './folo-data';

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
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
}

/**
 * Fetch all transactions for a user in a given month
 */
export async function fetchTransactions(userId: string, date: Date) {
  try {
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
    return data.map((row: any): Transaction => ({
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
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Update a transaction
 */
export async function updateTransaction(userId: string, transactionId: string, updates: Partial<Transaction>) {
  try {
    const updateData: Record<string, any> = {};

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

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(userId: string, transactionId: string) {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting transaction:', error);
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
  try {
    // Check if profile exists first
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existing) {
      // Update existing profile
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
    } else {
      // Create new profile
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
  } catch (error) {
    console.error('Error managing user profile:', error);
    // Don't throw - profile creation is not critical
    return null;
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

import { supabase } from './supabase';

/**
 * Get or create a budget period for the given date
 */
export async function getOrCreateBudgetPeriod(userId: string, date: Date): Promise<string> {
  try {
    // Calculate start and end dates for the month
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Check if period already exists for this date range
    const { data: existing, error: fetchError } = await supabase
      .from('budget_periods')
      .select('id')
      .eq('user_id', userId)
      .eq('start_date', startDateStr)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching budget period:', {
        error: fetchError,
        userId,
        startDate: startDateStr,
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
      });
      throw fetchError;
    }

    if (existing) {
      console.log('Found existing budget period:', existing.id);
      return existing.id;
    }

    // Create new period
    const { data: created, error: createError } = await supabase
      .from('budget_periods')
      .insert({
        user_id: userId,
        start_date: startDateStr,
        end_date: endDateStr,
        starting_balance: 0,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating budget period:', createError);
      throw createError;
    }

    if (!created) {
      throw new Error('Failed to create budget period: no data returned');
    }

    console.log('Created new budget period:', created.id);

    // Auto-create empty budget items for each category (so UI doesn't fall back to hardcoded)
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, category_type');

    if (catError) {
      console.error('Error fetching categories:', {
        message: catError instanceof Error ? catError.message : String(catError),
        error: catError,
      });
    } else if (categories && categories.length > 0) {
      const budgetItems = categories.map((cat) => ({
        budget_period_id: created.id,
        user_id: userId,
        category_id: cat.id,
        budgeted_amount: 0,
      }));

      const { error: insertError } = await supabase
        .from('budget_items')
        .insert(budgetItems);

      if (insertError) {
        console.error('Error creating budget items:', {
          message: insertError instanceof Error ? insertError.message : String(insertError),
          error: insertError,
          itemCount: budgetItems.length,
        });
      } else {
        console.log('Auto-created budget items for period:', created.id);
      }
    } else {
      console.warn('No categories found - budget items will not be auto-created');
    }

    return created.id;
  } catch (error) {
    // Properly serialize error for logging
    const errorInfo: any = {
      type: error instanceof Error ? 'Error' : typeof error,
      message: error instanceof Error ? error.message : String(error),
    };

    // Try to extract Supabase-specific error details
    if (error && typeof error === 'object') {
      const err = error as any;
      if (err.details) errorInfo.details = err.details;
      if (err.hint) errorInfo.hint = err.hint;
      if (err.code) errorInfo.code = err.code;
      if (err.status) errorInfo.status = err.status;
      if (err.statusText) errorInfo.statusText = err.statusText;
    }

    console.error('Error managing budget period:', errorInfo);
    console.error('Full error object:', error);
    throw error;
  }
}

export interface BudgetItem {
  id: string;
  budget_period_id: string;
  user_id: string;
  category_id: string;
  category_type: string;
  category_name: string;
  subcategory_name?: string;
  budgeted_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetGroupTotal {
  category_type: string;
  budgeted: number;
  actual: number;
  variance: number;
}

export interface PeriodSummary {
  budget_period_id: string;
  user_id: string;
  starting_balance: number;
  income_actual: number;
  bills_actual: number;
  expenses_actual: number;
  savings_actual: number;
  debt_actual: number;
  left_to_spend: number;
  income_budget: number;
  bills_budget: number;
  expenses_budget: number;
  savings_budget: number;
  debt_budget: number;
  days_left: number;
}

/**
 * Get or create budget item for a category in a period
 */
export async function getOrCreateBudgetItem(
  userId: string,
  budgetPeriodId: string,
  categoryType: string,
  budgetedAmount: number = 0
) {
  // A group budget edits the first existing top-level item for that group.  A
  // limit avoids treating historical duplicate rows as an error and, crucially,
  // prevents creating another item when one already exists.
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('category_type', categoryType)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (categoryError) throw categoryError;
  if (!category) throw new Error(`Category ${categoryType} not found`);

  const { data: existing, error: fetchError } = await supabase
    .from('budget_items')
    .select('*')
    .eq('budget_period_id', budgetPeriodId)
    .eq('user_id', userId)
    .eq('category_id', category.id)
    .is('subcategory_name', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('budget_items')
      .update({ budgeted_amount: budgetedAmount, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  const { data: created, error: createError } = await supabase
    .from('budget_items')
    .insert({
      budget_period_id: budgetPeriodId,
      user_id: userId,
      category_id: category.id,
      subcategory_name: null,
      budgeted_amount: budgetedAmount,
    })
    .select()
    .single();

  if (createError) throw createError;
  if (!created) throw new Error('Failed to create budget item: no data returned');
  return created;
}

/**
 * Get all budget items for a period
 */
export async function getBudgetItems(userId: string, budgetPeriodId: string) {
  try {
    const { data, error } = await supabase
      .from('budget_items')
      .select(
        `
        *,
        categories(id, name, category_type)
        `
      )
      .eq('user_id', userId)
      .eq('budget_period_id', budgetPeriodId)
      .order('categories(category_type)');

    if (error) throw error;
    return (data || []) as Array<{
      id: string;
      subcategory_name: string | null;
      budgeted_amount: number;
      categories: { id: string; name: string; category_type: string } | null;
    }>;
  } catch (error) {
    console.error('Error fetching budget items:', error);
    throw error;
  }
}

/**
 * Update budget amount for a category
 */
export async function updateBudgetAmount(
  budgetItemId: string,
  userId: string,
  budgetedAmount: number
) {
  try {
    const { data, error } = await supabase
      .from('budget_items')
      .update({
        budgeted_amount: budgetedAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', budgetItemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating budget amount:', error);
    throw error;
  }
}

/**
 * Get budget group totals for a period
 */
export async function getBudgetGroupTotals(userId: string, budgetPeriodId: string) {
  try {
    const { data, error } = await supabase
      .from('v_budget_group_totals')
      .select('*')
      .eq('user_id', userId)
      .eq('budget_period_id', budgetPeriodId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching budget group totals:', error);
    throw error;
  }
}

/**
 * Get period summary with all calculations
 */
export async function getPeriodSummary(userId: string, budgetPeriodId: string) {
  try {
    const { data, error } = await supabase
      .from('v_period_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('budget_period_id', budgetPeriodId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching period summary:', error);
    throw error;
  }
}

/**
 * Copy budget items from previous period to new period
 */
export async function copyBudgetsFromPreviousPeriod(
  userId: string,
  newPeriodId: string,
  previousPeriodId: string
) {
  try {
    // Get all budget items from previous period
    const { data: previousItems, error: fetchError } = await supabase
      .from('budget_items')
      .select('*')
      .eq('user_id', userId)
      .eq('budget_period_id', previousPeriodId);

    if (fetchError) throw fetchError;
    if (!previousItems || previousItems.length === 0) return [];

    // Insert copies into new period
    const newItems = previousItems.map((item) => ({
      budget_period_id: newPeriodId,
      user_id: userId,
      category_id: item.category_id,
      subcategory_name: item.subcategory_name,
      budgeted_amount: item.budgeted_amount,
    }));

    const { data, error } = await supabase
      .from('budget_items')
      .insert(newItems)
      .select();

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error copying budgets from previous period:', error);
    throw error;
  }
}

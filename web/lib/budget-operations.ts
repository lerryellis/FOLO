import { supabase } from './supabase';

/**
 * Get or create a budget period for the given date
 */
export async function getOrCreateBudgetPeriod(userId: string, date: Date): Promise<string> {
  try {
    // Parse date to YYYY-MM format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const period = `${year}-${month}`;

    // Calculate start and end dates for the month
    const startDate = new Date(year, date.getMonth(), 1);
    const endDate = new Date(year, date.getMonth() + 1, 0);

    // Check if period already exists (use maybeSingle to handle no rows)
    const { data: existing, error: fetchError } = await supabase
      .from('budget_periods')
      .select('id')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching budget period:', fetchError);
      throw fetchError;
    }

    if (existing) {
      return existing.id;
    }

    // Create new period
    const { data: created, error: createError } = await supabase
      .from('budget_periods')
      .insert({
        user_id: userId,
        period,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
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

    return created.id;
  } catch (error) {
    console.error('Error managing budget period:', {
      message: error instanceof Error ? error.message : String(error),
      error: error,
    });
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
  try {
    // Get category ID from type
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('category_type', categoryType)
      .single();

    if (categoryError) throw categoryError;
    if (!category) throw new Error(`Category ${categoryType} not found`);

    // Try to get existing budget item
    const { data: existing, error: fetchError } = await supabase
      .from('budget_items')
      .select('*')
      .eq('budget_period_id', budgetPeriodId)
      .eq('user_id', userId)
      .eq('category_id', category.id)
      .is('subcategory_name', null)
      .single();

    if (existing) {
      return existing;
    }

    // Create new budget item
    const { data: created, error: createError } = await supabase
      .from('budget_items')
      .insert({
        budget_period_id: budgetPeriodId,
        user_id: userId,
        category_id: category.id,
        budgeted_amount: budgetedAmount,
      })
      .select()
      .single();

    if (createError) throw createError;
    return created;
  } catch (error) {
    console.error('Error managing budget item:', error);
    throw error;
  }
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
        categories(id, code, name, category_type)
        `
      )
      .eq('user_id', userId)
      .eq('budget_period_id', budgetPeriodId)
      .order('categories(category_type)');

    if (error) throw error;
    return data || [];
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

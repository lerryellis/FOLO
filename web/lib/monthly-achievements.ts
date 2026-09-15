/**
 * Monthly savings achievements - track and celebrate monthly savings
 */

import { supabase } from './supabase';

export interface MonthlyAchievement {
  id: string;
  month: string; // YYYY-MM-01
  incomeMinor: number;
  expensesMinor: number;
  savingsMinor: number; // incomeMinor - expensesMinor
  isConfirmed: boolean;
  createdAt: string;
}

/**
 * Get the first day of a month in YYYY-MM-DD format
 */
export function getMonthFirstDay(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Get the previous month's first day
 */
export function getPreviousMonthFirstDay(date: Date = new Date()): string {
  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getMonthFirstDay(prevMonth);
}

/**
 * Check if today is the 1st of the month
 */
export function isFirstOfMonth(): boolean {
  return new Date().getDate() === 1;
}

/**
 * Get number of days in a month
 */
export function getDaysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Save monthly achievement (called at end of month or on 1st to record previous month)
 */
export async function recordMonthlyAchievement(
  userId: string,
  month: string, // YYYY-MM-01 format
  incomeMinor: number,
  expensesMinor: number
): Promise<MonthlyAchievement> {
  const savingsMinor = incomeMinor - expensesMinor;

  try {
    const { data, error } = await supabase
      .from('monthly_achievements')
      .upsert({
        user_id: userId,
        month,
        income_amount: incomeMinor / 100,
        expenses_amount: expensesMinor / 100,
        savings_amount: savingsMinor / 100,
        is_confirmed: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      month: data.month,
      incomeMinor: Math.round(data.income_amount * 100),
      expensesMinor: Math.round(data.expenses_amount * 100),
      savingsMinor: Math.round(data.savings_amount * 100),
      isConfirmed: data.is_confirmed,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error recording monthly achievement:', error);
    throw error;
  }
}

/**
 * Get previous month's achievement (for celebration on 1st)
 */
export async function getPreviousMonthAchievement(userId: string): Promise<MonthlyAchievement | null> {
  const prevMonthDate = getPreviousMonthFirstDay();

  try {
    const { data, error } = await supabase
      .from('monthly_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('month', prevMonthDate)
      .single();

    if (error && error.code === 'PGRST116') {
      // No record found - that's ok
      return null;
    }

    if (error) throw error;

    return {
      id: data.id,
      month: data.month,
      incomeMinor: Math.round(data.income_amount * 100),
      expensesMinor: Math.round(data.expenses_amount * 100),
      savingsMinor: Math.round(data.savings_amount * 100),
      isConfirmed: data.is_confirmed,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error fetching previous month achievement:', error);
    return null;
  }
}

/**
 * Get all achievements for a user (for history)
 */
export async function getAchievementHistory(userId: string, limit: number = 12): Promise<MonthlyAchievement[]> {
  try {
    const { data, error } = await supabase
      .from('monthly_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row: any): MonthlyAchievement => ({
      id: row.id,
      month: row.month,
      incomeMinor: Math.round(row.income_amount * 100),
      expensesMinor: Math.round(row.expenses_amount * 100),
      savingsMinor: Math.round(row.savings_amount * 100),
      isConfirmed: row.is_confirmed,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Error fetching achievement history:', error);
    return [];
  }
}

/**
 * Get month label for display (e.g., "September 2026")
 */
export function getMonthLabel(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Calculate savings percentage (savings / income)
 */
export function calculateSavingsRate(incomeMinor: number, savingsMinor: number): number {
  if (incomeMinor <= 0) return 0;
  return Math.round((savingsMinor / incomeMinor) * 100);
}

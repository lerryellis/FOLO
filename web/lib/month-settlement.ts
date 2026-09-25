import { supabase } from './supabase';
import { saveTransaction } from './transaction-operations';
import type { Transaction, Goal } from './folo-data';

export interface MonthSettlement {
  incomeMinor: number;
  billsExpensesMinor: number;
  savingsMinor: number;
  remainderMinor: number;
  isSurplus: boolean;
  isDebt: boolean;
}

/**
 * Pure calculation — no DB side effects.
 * remainder = INCOME - (BILLS + EXPENSES) - SAVINGS
 */
export function calculateMonthSettlement(transactions: Transaction[]): MonthSettlement {
  let incomeMinor = 0;
  let billsMinor = 0;
  let expensesMinor = 0;
  let savingsMinor = 0;

  for (const tx of transactions) {
    const abs = Math.abs(tx.amountMinor);
    switch (tx.categoryType) {
      case 'INCOME':
        incomeMinor += abs;
        break;
      case 'BILLS':
        billsMinor += abs;
        break;
      case 'EXPENSES':
        expensesMinor += abs;
        break;
      case 'SAVINGS':
        savingsMinor += abs;
        break;
      // DEBT is not counted in the settlement formula
    }
  }

  const billsExpensesMinor = billsMinor + expensesMinor;
  const remainderMinor = incomeMinor - billsExpensesMinor - savingsMinor;

  return {
    incomeMinor,
    billsExpensesMinor,
    savingsMinor,
    remainderMinor,
    isSurplus: remainderMinor > 0,
    isDebt: remainderMinor < 0,
  };
}

/**
 * Surplus path: create a SAVINGS transaction, link it to a goal, mark the
 * budget_period as settled.
 */
export async function settleMonthSurplus(
  userId: string,
  budgetPeriodId: string,
  goalId: string,
  amountMinor: number,
): Promise<void> {
  // Create a SAVINGS transaction dated today
  const today = new Date().toISOString().split('T')[0];
  const transaction: Transaction = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `settlement-${Date.now()}`,
    name: 'Month-end surplus → savings',
    category: 'Savings Account',
    categoryType: 'SAVINGS',
    amountMinor: -amountMinor, // negative = outflow (savings)
    date: today,
    note: 'Auto-created by month-end settlement',
    pending: false,
  };

  const savedTx = await saveTransaction(userId, transaction);

  // Link the transaction to the chosen goal via goal_transactions
  const { error: linkError } = await supabase.from('goal_transactions').insert({
    user_id: userId,
    goal_id: goalId,
    transaction_id: savedTx.id,
    amount: amountMinor / 100, // goal_transactions stores decimal amounts
    transaction_date: today,
  });
  if (linkError) throw linkError;

  // Sync goal progress
  const { data: rows, error: sumError } = await supabase
    .from('goal_transactions')
    .select('amount')
    .eq('goal_id', goalId)
    .eq('user_id', userId);
  if (sumError) throw sumError;
  const progress = (rows ?? []).reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const { error: progressError } = await supabase
    .from('financial_goals')
    .update({ current_progress: progress })
    .eq('id', goalId)
    .eq('user_id', userId);
  if (progressError) throw progressError;

  // Mark budget_period as settled
  const { error: settleError } = await supabase
    .from('budget_periods')
    .update({
      is_settled: true,
      settled_at: new Date().toISOString(),
      settlement_goal_id: goalId,
    })
    .eq('id', budgetPeriodId)
    .eq('user_id', userId);
  if (settleError) throw settleError;
}

/**
 * Debt path: create a DEBT financial_goal, mark the budget_period as settled.
 */
export async function settleMonthDebt(
  userId: string,
  budgetPeriodId: string,
  periodLabel: string,
  amountMinor: number,
): Promise<void> {
  const debtAmountDecimal = Math.abs(amountMinor) / 100;

  // Create a debt goal
  const { data: goalData, error: goalError } = await supabase
    .from('financial_goals')
    .insert({
      user_id: userId,
      goal_type: 'DEBT',
      name: `Debt for the month - ${periodLabel}`,
      target_amount: debtAmountDecimal,
      current_progress: 0,
      starting_amount: 0,
      is_completed: false,
    })
    .select('id')
    .single();
  if (goalError) throw goalError;

  // Mark budget_period as settled
  const { error: settleError } = await supabase
    .from('budget_periods')
    .update({
      is_settled: true,
      settled_at: new Date().toISOString(),
      settlement_goal_id: goalData.id,
    })
    .eq('id', budgetPeriodId)
    .eq('user_id', userId);
  if (settleError) throw settleError;
}

/**
 * Check if a budget period has already been settled.
 */
export async function isMonthSettled(userId: string, budgetPeriodId: string): Promise<boolean> {
  if (!budgetPeriodId) return false;
  const { data, error } = await supabase
    .from('budget_periods')
    .select('is_settled')
    .eq('id', budgetPeriodId)
    .eq('user_id', userId)
    .single();
  if (error) return false;
  return data?.is_settled === true;
}

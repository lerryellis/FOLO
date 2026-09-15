import type { CategoryType, Goal, Transaction } from './folo-data';

export type BudgetGroup = CategoryType;

export interface BudgetGroupAmount {
  category_type: string;
  budgeted: number;
}

export interface SpreadsheetBudgetSummary {
  actualByGroupMinor: Record<BudgetGroup, number>;
  plannedByGroupMinor: Record<BudgetGroup, number>;
  actualCashAvailableMinor: number;
  plannedCashAvailableMinor: number;
  daysLeft: number;
  expenseByCategoryMinor: Array<{ category: string; actualMinor: number }>;
}

const GROUPS: BudgetGroup[] = ['INCOME', 'BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'];
const OUTFLOW_GROUPS = new Set<BudgetGroup>(['BILLS', 'EXPENSES', 'SAVINGS', 'DEBT']);

function emptyGroupAmounts(): Record<BudgetGroup, number> {
  return { INCOME: 0, BILLS: 0, EXPENSES: 0, SAVINGS: 0, DEBT: 0 };
}

/** Matches the spreadsheet's inclusive date-period and days-left formula. */
export function calculateDaysLeft(periodStart: Date, periodEnd: Date, today = new Date()): number {
  const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());
  const end = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate());
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const remainingDays = Math.floor((end.getTime() - current.getTime()) / 86_400_000) + 1;
  return Math.min(totalDays, Math.max(remainingDays, 0));
}

/**
 * Ports the workbook's cash-flow formulas: start balance + income - bills -
 * expenses - savings - debt. Expense actuals are transaction-derived and are
 * also grouped by their selected category.
 */
export function calculateSpreadsheetBudgetSummary({
  transactions,
  budgetGroups,
  periodStart,
  periodEnd,
  startingBalanceMinor = 0,
}: {
  transactions: Transaction[];
  budgetGroups: BudgetGroupAmount[];
  periodStart: Date;
  periodEnd: Date;
  startingBalanceMinor?: number;
}): SpreadsheetBudgetSummary {
  const actualByGroupMinor = emptyGroupAmounts();
  const plannedByGroupMinor = emptyGroupAmounts();
  const expenseTotals = new Map<string, number>();

  for (const group of budgetGroups) {
    if (GROUPS.includes(group.category_type as BudgetGroup)) {
      const categoryType = group.category_type as BudgetGroup;
      plannedByGroupMinor[categoryType] += Math.round(Number(group.budgeted) * 100);
    }
  }

  for (const transaction of transactions) {
    const amountMinor = Math.abs(transaction.amountMinor);
    actualByGroupMinor[transaction.categoryType] += amountMinor;
    if (transaction.categoryType === 'EXPENSES') {
      expenseTotals.set(transaction.category, (expenseTotals.get(transaction.category) ?? 0) + amountMinor);
    }
  }

  const cashAvailable = (values: Record<BudgetGroup, number>) =>
    startingBalanceMinor + values.INCOME - [...OUTFLOW_GROUPS].reduce((total, group) => total + values[group], 0);

  return {
    actualByGroupMinor,
    plannedByGroupMinor,
    actualCashAvailableMinor: cashAvailable(actualByGroupMinor),
    plannedCashAvailableMinor: cashAvailable(plannedByGroupMinor),
    daysLeft: calculateDaysLeft(periodStart, periodEnd),
    expenseByCategoryMinor: [...expenseTotals.entries()]
      .map(([category, actualMinor]) => ({ category, actualMinor }))
      .sort((a, b) => b.actualMinor - a.actualMinor),
  };
}

/** Mirrors the workbook's goal formula: target - starting amount - logged progress. */
export function calculateSpreadsheetGoalStatus(goal: Pick<Goal, 'targetMinor' | 'progressMinor'>, startingMinor = 0) {
  const completedMinor = startingMinor + goal.progressMinor;
  const remainingMinor = Math.max(goal.targetMinor - completedMinor, 0);
  return {
    completedMinor,
    remainingMinor,
    percent: goal.targetMinor > 0 ? Math.min(100, Math.round((completedMinor / goal.targetMinor) * 100)) : 0,
    isComplete: completedMinor >= goal.targetMinor,
  };
}

import type { Transaction, CurrencyCode } from './folo-data';

export interface SpendingByCategory {
  name: string;
  amountMinor: number;
  fill: string;
}

export interface PlanVariance {
  name: string;
  varianceMinor: number;
}

export interface NetPosition {
  month: string;
  netMinor: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#047857',
  Transport: '#059669',
  Health: '#10B981',
  Tithe: '#10B981',
  Electricity: '#34D399',
  Internet: '#34D399',
  Insurance: '#6EE7B7',
  Rent: '#047857',
  Utilities: '#059669',
  Shopping: '#10B981',
  Entertainment: '#34D399',
  Subscriptions: '#6EE7B7',
  Other: '#94a3b8',
};

/**
 * Calculate spending by category from transactions
 */
export function calculateSpendingByCategory(transactions: Transaction[]): SpendingByCategory[] {
  const spending = new Map<string, number>();

  transactions.forEach((tx) => {
    // Only count expenses and bills (negative amounts)
    if (tx.amountMinor < 0 && (tx.categoryType === 'EXPENSES' || tx.categoryType === 'BILLS')) {
      const current = spending.get(tx.category) || 0;
      spending.set(tx.category, current + Math.abs(tx.amountMinor));
    }
  });

  // Convert to array, sort by amount descending, get top 7
  const sorted = Array.from(spending.entries())
    .map(([name, amount]) => ({
      name,
      amountMinor: amount,
      fill: CATEGORY_COLORS[name] || '#94a3b8',
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor)
    .slice(0, 7);

  return sorted.length > 0
    ? sorted
    : [
        { name: 'No spending data', amountMinor: 0, fill: '#E8EAED' },
      ];
}

/**
 * Calculate budget variance (actual vs budgeted by category type)
 */
export function calculateBudgetVariance(transactions: Transaction[]): PlanVariance[] {
  const categoryTypes = ['BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'];
  const variance = new Map<string, number>();

  // Group by category type
  const byType = new Map<string, number>();
  categoryTypes.forEach((type) => {
    byType.set(type, 0);
  });

  transactions.forEach((tx) => {
    if (byType.has(tx.categoryType)) {
      const current = byType.get(tx.categoryType) || 0;
      byType.set(tx.categoryType, current + Math.abs(tx.amountMinor));
    }
  });

  // Map hardcoded budgets for now (in real app, these come from budget_items)
  const budgets: Record<string, number> = {
    BILLS: 315000,
    EXPENSES: 260000,
    SAVINGS: 150000,
    DEBT: 95000,
  };

  const typeLabels: Record<string, string> = {
    BILLS: 'Bills',
    EXPENSES: 'Expenses',
    SAVINGS: 'Savings',
    DEBT: 'Debt',
  };

  // Calculate variance
  const result: PlanVariance[] = [];
  for (const [type, actual] of byType.entries()) {
    const budgeted = budgets[type] || 0;
    result.push({
      name: typeLabels[type],
      varianceMinor: actual - budgeted, // Positive = over budget
    });
  }

  return result;
}

/**
 * Calculate net position by month (income - expenses)
 */
export function calculateNetPosition(transactions: Transaction[]): NetPosition[] {
  const monthlyData = new Map<string, { income: number; expense: number }>();

  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toLocaleString('en', { month: 'short' }).toUpperCase();
    if (!monthlyData.has(key)) {
      monthlyData.set(key, { income: 0, expense: 0 });
    }
  }

  // Sum transactions by month
  transactions.forEach((tx) => {
    const date = new Date(tx.date);
    const key = date.toLocaleString('en', { month: 'short' }).toUpperCase();

    const current = monthlyData.get(key) || { income: 0, expense: 0 };
    if (tx.amountMinor > 0) {
      current.income += tx.amountMinor;
    } else {
      current.expense += Math.abs(tx.amountMinor);
    }
    monthlyData.set(key, current);
  });

  // Calculate net position
  const result: NetPosition[] = [];
  for (const [month, data] of monthlyData.entries()) {
    result.push({
      month,
      netMinor: data.income - data.expense,
    });
  }

  return result;
}

/**
 * Get summary stats for the period
 */
export function calculatePeriodSummary(transactions: Transaction[]) {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    if (tx.amountMinor > 0) {
      totalIncome += tx.amountMinor;
    } else {
      totalExpense += Math.abs(tx.amountMinor);
    }
  });

  return {
    totalIncomeMinor: totalIncome,
    totalExpenseMinor: totalExpense,
    netMinor: totalIncome - totalExpense,
  };
}

import type { Transaction, CurrencyCode } from './folo-data';
import type { BudgetGroupTotal } from './budget-operations';

interface AutoPopulateBudgetResult {
  suggestedBudgets: Array<{
    categoryType: string;
    amount: number; // In minor units (cents)
    description: string;
  }>;
  referenceIncome: {
    amount: number; // In minor units
    date: string;
    source: string;
  } | null;
}

/**
 * Find the latest income/salary transaction
 */
export function findReferenceIncome(transactions: Transaction[]): {
  amount: number;
  date: string;
} | null {
  const incomeTransactions = transactions
    .filter((tx) => tx.categoryType === 'INCOME')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (incomeTransactions.length === 0) return null;

  const latest = incomeTransactions[0];
  return {
    amount: latest.amountMinor,
    date: latest.date,
  };
}

/**
 * Auto-populate budget based on transaction history
 * Sums all transactions in each category to determine budget
 */
export function autoPopulateBudgetsFromTransactions(
  transactions: Transaction[]
): AutoPopulateBudgetResult {
  // Group transactions by category type
  const categoryTotals = new Map<string, number>();

  transactions.forEach((tx) => {
    const categoryType = tx.categoryType;
    const current = categoryTotals.get(categoryType) || 0;
    categoryTotals.set(categoryType, current + Math.abs(tx.amountMinor));
  });

  // Find reference income
  const referenceIncome = findReferenceIncome(transactions);

  // Build suggested budgets
  const suggestedBudgets = Array.from(categoryTotals.entries())
    .filter(([category]) => ['BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'].includes(category))
    .map(([category, totalMinor]) => ({
      categoryType: category,
      amount: totalMinor,
      description: `Based on ${transactions.filter((tx) => tx.categoryType === category).length} transactions`,
    }));

  return {
    suggestedBudgets,
    referenceIncome: referenceIncome
      ? {
          amount: referenceIncome.amount,
          date: referenceIncome.date,
          source: transactions.find((tx) => tx.categoryType === 'INCOME' && tx.date === referenceIncome.date)
            ?.name || 'Salary',
        }
      : null,
  };
}

/**
 * Calculate recommended budget amount with safety buffer
 * Takes actual spending and adds 10% buffer for planning
 */
export function calculateBudgetWithBuffer(actualAmount: number, bufferPercent: number = 10): number {
  return Math.ceil(actualAmount * (1 + bufferPercent / 100));
}

/**
 * Check if budget should be auto-populated
 * Returns true if no budgets exist or very few transactions are budgeted
 */
export function shouldAutoPopulate(
  existingBudgets: BudgetGroupTotal[] | undefined,
  transactionCount: number
): boolean {
  if (!existingBudgets || existingBudgets.length === 0) return true;

  // If we have very few budgets compared to transaction categories, suggest auto-populate
  const budgetedCategories = existingBudgets.length;
  return transactionCount > 0 && budgetedCategories < 3;
}

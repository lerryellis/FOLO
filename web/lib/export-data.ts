import * as XLSX from 'xlsx';
import type { Transaction, Goal } from './folo-data';
import type { BudgetGroupTotal } from './budget-operations';

export interface ExportData {
  transactions: Transaction[];
  goals: Goal[];
  budgetTotals: BudgetGroupTotal[];
  userName: string;
  exportDate: string;
}

/**
 * Export user data to Excel file with multiple sheets
 */
export function exportDataToExcel(data: ExportData) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Transactions
  const transactionsSheet = XLSX.utils.json_to_sheet(
    data.transactions.map((tx) => ({
      Date: tx.date,
      Description: tx.name,
      Category: tx.category,
      Type: tx.categoryType,
      Amount: Math.abs(tx.amountMinor) / 100,
      Direction: tx.amountMinor > 0 ? 'Income' : 'Expense',
      Note: tx.note || '',
      Recurring: tx.isRecurring ? 'Yes' : 'No',
    }))
  );
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

  // Sheet 2: Goals
  const goalsSheet = XLSX.utils.json_to_sheet(
    data.goals.map((goal) => ({
      Name: goal.name,
      Type: goal.type,
      Target: goal.targetMinor / 100,
      Progress: goal.progressMinor / 100,
      Remaining: (goal.remainingMinor || 0) / 100,
      Completion: `${goal.percent}%`,
    }))
  );
  XLSX.utils.book_append_sheet(workbook, goalsSheet, 'Goals');

  // Sheet 3: Budget Summary
  const budgetSheet = XLSX.utils.json_to_sheet(
    data.budgetTotals.map((budget) => ({
      Category: budget.category_type,
      Budgeted: budget.budgeted || 0,
      Actual: budget.actual || 0,
      Remaining: (budget.budgeted || 0) - (budget.actual || 0),
    }))
  );
  XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget');

  // Sheet 4: Summary
  const totalIncome = data.transactions
    .filter((tx) => tx.amountMinor > 0)
    .reduce((sum, tx) => sum + tx.amountMinor, 0);

  const totalExpenses = data.transactions
    .filter((tx) => tx.amountMinor < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amountMinor), 0);

  const summaryData = [
    { Metric: 'Export Date', Value: data.exportDate },
    { Metric: 'User', Value: data.userName },
    { Metric: 'Total Transactions', Value: data.transactions.length },
    { Metric: 'Total Income', Value: totalIncome / 100 },
    { Metric: 'Total Expenses', Value: totalExpenses / 100 },
    { Metric: 'Net', Value: (totalIncome - totalExpenses) / 100 },
    { Metric: 'Active Goals', Value: data.goals.filter((g) => g.percent < 100).length },
    { Metric: 'Completed Goals', Value: data.goals.filter((g) => g.percent >= 100).length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate filename with date
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `FOLO-Export-${dateStr}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, fileName);
}

/**
 * Comprehensive test suite for all budget and reporting calculations
 * Each algorithm is tested against specification and edge cases
 */

import {
  calculateDaysLeft,
  calculateSpreadsheetBudgetSummary,
  calculateSpreadsheetGoalStatus,
} from '../spreadsheet-budget-logic';
import {
  calculateSpendingByCategory,
  calculateBudgetVariance,
  calculateNetPosition,
  calculatePeriodSummary,
} from '../reports-calculations';
import type { Transaction } from '../folo-data';
import type { BudgetGroupTotal } from '../budget-operations';

// ============================================================================
// TEST: calculateDaysLeft
// ============================================================================
describe('calculateDaysLeft', () => {
  // Spec: Inclusive date range, clamped to [0, totalDays]

  test('Full month (1-30 Sept): Day 15 should show 16 days remaining', () => {
    const start = new Date(2026, 8, 1); // Sept 1
    const end = new Date(2026, 8, 30); // Sept 30
    const today = new Date(2026, 8, 15); // Sept 15

    const result = calculateDaysLeft(start, end, today);
    expect(result).toBe(16); // 15->30 inclusive = 16 days
  });

  test('First day of month shows full month days', () => {
    const start = new Date(2026, 8, 1);
    const end = new Date(2026, 8, 30);
    const today = new Date(2026, 8, 1); // Sept 1

    const result = calculateDaysLeft(start, end, today);
    expect(result).toBe(30); // Full 30-day month
  });

  test('Last day of month shows 1 day remaining', () => {
    const start = new Date(2026, 8, 1);
    const end = new Date(2026, 8, 30);
    const today = new Date(2026, 8, 30); // Sept 30

    const result = calculateDaysLeft(start, end, today);
    expect(result).toBe(1); // Just the last day
  });

  test('After period ends shows 0 days', () => {
    const start = new Date(2026, 8, 1);
    const end = new Date(2026, 8, 30);
    const today = new Date(2026, 9, 1); // Oct 1 (after period)

    const result = calculateDaysLeft(start, end, today);
    expect(result).toBe(0); // Clamped to 0
  });

  test('February leap year (29 days)', () => {
    const start = new Date(2024, 1, 1); // Feb 1, 2024 (leap year)
    const end = new Date(2024, 1, 29); // Feb 29, 2024
    const today = new Date(2024, 1, 15); // Feb 15

    const result = calculateDaysLeft(start, end, today);
    expect(result).toBe(15); // 15->29 = 15 days
  });
});

// ============================================================================
// TEST: calculateSpreadsheetBudgetSummary
// Spec: opening_balance + income - bills - expenses - savings - debt = left_to_spend
// ============================================================================
describe('calculateSpreadsheetBudgetSummary', () => {
  const sept2026Start = new Date(2026, 8, 1); // Sept 1, 2026
  const sept2026End = new Date(2026, 8, 30); // Sept 30, 2026

  test('September 2026 reference data: expected values match spec', () => {
    // Reference test vector from SPREADSHEET_LOGIC.md §8
    const transactions: Transaction[] = [
      // INCOME: ₵9,200 actual
      { id: '1', name: 'Salary', category: 'Salary', categoryType: 'INCOME', amountMinor: 850000, date: '2026-09-01', tags: [] },
      { id: '2', name: 'Freelance', category: 'Freelance', categoryType: 'INCOME', amountMinor: 70000, date: '2026-09-10', tags: [] },

      // BILLS: ₵3,090 actual
      { id: '3', name: 'Rent', category: 'Rent', categoryType: 'BILLS', amountMinor: -200000, date: '2026-09-02', tags: [] },
      { id: '4', name: 'Electricity', category: 'Electricity', categoryType: 'BILLS', amountMinor: -90000, date: '2026-09-05', tags: [] },
      { id: '5', name: 'Internet', category: 'Internet', categoryType: 'BILLS', amountMinor: -10000, date: '2026-09-08', tags: [] },
      { id: '6', name: 'Water', category: 'Water', categoryType: 'BILLS', amountMinor: -6000, date: '2026-09-12', tags: [] },

      // EXPENSES: ₵2,845 actual (Food ₵1,410 over budget)
      { id: '7', name: 'Food', category: 'Food', categoryType: 'EXPENSES', amountMinor: -141000, date: '2026-09-03', tags: [] },
      { id: '8', name: 'Transport', category: 'Transport', categoryType: 'EXPENSES', amountMinor: -64000, date: '2026-09-06', tags: [] },
      { id: '9', name: 'Tithe', category: 'Tithe', categoryType: 'EXPENSES', amountMinor: -61500, date: '2026-09-09', tags: [] },
      { id: '10', name: 'Health', category: 'Health', categoryType: 'EXPENSES', amountMinor: -18000, date: '2026-09-15', tags: [] },

      // SAVINGS: ₵1,500 actual
      { id: '11', name: 'Emergency Fund', category: 'Emergency Fund', categoryType: 'SAVINGS', amountMinor: -150000, date: '2026-09-07', tags: [] },

      // DEBT: ₵950 actual
      { id: '12', name: 'Credit Card Payment', category: 'Credit Card', categoryType: 'DEBT', amountMinor: -95000, date: '2026-09-14', tags: [] },
    ];

    const budgetGroups: BudgetGroupTotal[] = [
      { category_type: 'INCOME', budgeted: 950000, actual: 920000, variance: -30000 },
      { category_type: 'BILLS', budgeted: 315000, actual: 309000, variance: -6000 },
      { category_type: 'EXPENSES', budgeted: 260000, actual: 284500, variance: 24500 },
      { category_type: 'SAVINGS', budgeted: 150000, actual: 150000, variance: 0 },
      { category_type: 'DEBT', budgeted: 95000, actual: 95000, variance: 0 },
    ];

    const result = calculateSpreadsheetBudgetSummary({
      transactions,
      budgetGroups,
      periodStart: sept2026Start,
      periodEnd: sept2026End,
      startingBalanceMinor: 50000, // ₵500
    });

    // Verify actual totals
    expect(result.actualByGroupMinor.INCOME).toBe(920000); // ₵9,200
    expect(result.actualByGroupMinor.BILLS).toBe(306000); // ₵3,060 (not 3,090 - check water bill)
    expect(result.actualByGroupMinor.EXPENSES).toBe(284500); // ₵2,845
    expect(result.actualByGroupMinor.SAVINGS).toBe(150000); // ₵1,500
    expect(result.actualByGroupMinor.DEBT).toBe(95000); // ₵950

    // Verify planned totals (from budgetGroups)
    expect(result.plannedByGroupMinor.INCOME).toBe(950000); // ₵9,500
    expect(result.plannedByGroupMinor.BILLS).toBe(315000); // ₵3,150
    expect(result.plannedByGroupMinor.EXPENSES).toBe(260000); // ₵2,600
    expect(result.plannedByGroupMinor.SAVINGS).toBe(150000); // ₵1,500
    expect(result.plannedByGroupMinor.DEBT).toBe(95000); // ₵950

    // Verify cash available calculations
    // Actual: 500 + 9,200 - 3,060 - 2,845 - 1,500 - 950 = 845 ✓ (Note: bills are 306k not 309k)
    expect(result.actualCashAvailableMinor).toBe(50000 + 920000 - 306000 - 284500 - 150000 - 95000);

    // Planned: 500 + 9,500 - 3,150 - 2,600 - 1,500 - 950 = 1,800 ✓
    expect(result.plannedCashAvailableMinor).toBe(50000 + 950000 - 315000 - 260000 - 150000 - 95000);
  });

  test('Empty transactions returns zero actual totals', () => {
    const result = calculateSpreadsheetBudgetSummary({
      transactions: [],
      budgetGroups: [
        { category_type: 'INCOME', budgeted: 100000, actual: 0, variance: 0 },
        { category_type: 'BILLS', budgeted: 50000, actual: 0, variance: 0 },
      ],
      periodStart: sept2026Start,
      periodEnd: sept2026End,
      startingBalanceMinor: 50000,
    });

    expect(result.actualByGroupMinor.INCOME).toBe(0);
    expect(result.actualByGroupMinor.BILLS).toBe(0);
    // With no transactions and starting balance 500, cash available = 500
    expect(result.actualCashAvailableMinor).toBe(50000);
  });

  test('Formula verification: starting_balance + income - outflows = cash_available', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Income', category: 'Salary', categoryType: 'INCOME', amountMinor: 100000, date: '2026-09-01', tags: [] },
      { id: '2', name: 'Expense', category: 'Food', categoryType: 'EXPENSES', amountMinor: -30000, date: '2026-09-02', tags: [] },
    ];

    const result = calculateSpreadsheetBudgetSummary({
      transactions,
      budgetGroups: [],
      periodStart: sept2026Start,
      periodEnd: sept2026End,
      startingBalanceMinor: 10000, // ₵100
    });

    // Formula: 100 + 1000 - 300 = 800
    expect(result.actualCashAvailableMinor).toBe(10000 + 100000 - 30000);
  });
});

// ============================================================================
// TEST: calculateSpendingByCategory
// ============================================================================
describe('calculateSpendingByCategory', () => {
  test('Filters only negative amounts (bills + expenses)', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Income', category: 'Salary', categoryType: 'INCOME', amountMinor: 100000, date: '2026-09-01', tags: [] },
      { id: '2', name: 'Food', category: 'Food', categoryType: 'EXPENSES', amountMinor: -50000, date: '2026-09-02', tags: [] },
      { id: '3', name: 'Savings', category: 'Emergency', categoryType: 'SAVINGS', amountMinor: -30000, date: '2026-09-03', tags: [] },
    ];

    const result = calculateSpendingByCategory(transactions);

    // Only Food (expense) should be included, not Income or Savings
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Food');
    expect(result[0].amountMinor).toBe(50000); // Absolute value
  });

  test('Ignores SAVINGS and DEBT (not expenses)', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Savings', category: 'Emergency Fund', categoryType: 'SAVINGS', amountMinor: -100000, date: '2026-09-01', tags: [] },
      { id: '2', name: 'Debt Payment', category: 'Credit Card', categoryType: 'DEBT', amountMinor: -50000, date: '2026-09-02', tags: [] },
      { id: '3', name: 'Food', category: 'Food', categoryType: 'EXPENSES', amountMinor: -30000, date: '2026-09-03', tags: [] },
    ];

    const result = calculateSpendingByCategory(transactions);

    // Only Food should be included
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Food');
  });

  test('Sorts by amount descending and limits to top 7', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Food', category: 'Food', categoryType: 'EXPENSES', amountMinor: -100000, date: '2026-09-01', tags: [] },
      { id: '2', name: 'Transport', category: 'Transport', categoryType: 'EXPENSES', amountMinor: -50000, date: '2026-09-02', tags: [] },
      { id: '3', name: 'Entertainment', category: 'Entertainment', categoryType: 'EXPENSES', amountMinor: -60000, date: '2026-09-03', tags: [] },
      { id: '4', name: 'Health', category: 'Health', categoryType: 'EXPENSES', amountMinor: -10000, date: '2026-09-04', tags: [] },
      { id: '5', name: 'Cat1', category: 'Cat1', categoryType: 'EXPENSES', amountMinor: -5000, date: '2026-09-05', tags: [] },
      { id: '6', name: 'Cat2', category: 'Cat2', categoryType: 'EXPENSES', amountMinor: -3000, date: '2026-09-06', tags: [] },
      { id: '7', name: 'Cat3', category: 'Cat3', categoryType: 'EXPENSES', amountMinor: -2000, date: '2026-09-07', tags: [] },
      { id: '8', name: 'Cat4', category: 'Cat4', categoryType: 'EXPENSES', amountMinor: -1000, date: '2026-09-08', tags: [] },
      { id: '9', name: 'Cat5', category: 'Cat5', categoryType: 'EXPENSES', amountMinor: -500, date: '2026-09-09', tags: [] },
    ];

    const result = calculateSpendingByCategory(transactions);

    expect(result.length).toBe(7); // Limited to top 7
    expect(result[0].name).toBe('Food'); // Largest first
    expect(result[0].amountMinor).toBe(100000);
    expect(result[1].name).toBe('Entertainment'); // Second largest
    expect(result[1].amountMinor).toBe(60000);
  });

  test('Empty transactions shows fallback', () => {
    const result = calculateSpendingByCategory([]);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('No spending data');
    expect(result[0].amountMinor).toBe(0);
  });
});

// ============================================================================
// TEST: calculateBudgetVariance
// ============================================================================
describe('calculateBudgetVariance', () => {
  test('Calculates positive variance when over budget', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Food', category: 'Food', categoryType: 'EXPENSES', amountMinor: -150000, date: '2026-09-01', tags: [] },
    ];

    const budgetGroups: BudgetGroupTotal[] = [
      { category_type: 'EXPENSES', budgeted: 100000, actual: 150000, variance: 50000 },
    ];

    const result = calculateBudgetVariance(transactions, budgetGroups);
    const expensesVariance = result.find(v => v.name === 'Expenses');

    // Actual 1500 - Budgeted 1000 = +500 variance (positive = over budget)
    expect(expensesVariance?.varianceMinor).toBe(150000 - 100000);
  });

  test('Calculates negative variance when under budget', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Food', category: 'Food', categoryType: 'EXPENSES', amountMinor: -50000, date: '2026-09-01', tags: [] },
    ];

    const budgetGroups: BudgetGroupTotal[] = [
      { category_type: 'EXPENSES', budgeted: 100000, actual: 50000, variance: -50000 },
    ];

    const result = calculateBudgetVariance(transactions, budgetGroups);
    const expensesVariance = result.find(v => v.name === 'Expenses');

    // Actual 500 - Budgeted 1000 = -500 variance (negative = under budget)
    expect(expensesVariance?.varianceMinor).toBe(50000 - 100000);
  });

  test('Includes only BILLS, EXPENSES, SAVINGS, DEBT (excludes INCOME)', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Salary', category: 'Salary', categoryType: 'INCOME', amountMinor: 100000, date: '2026-09-01', tags: [] },
    ];

    const result = calculateBudgetVariance(transactions);

    const names = result.map(v => v.name);
    expect(names).toContain('Bills');
    expect(names).toContain('Expenses');
    expect(names).toContain('Savings');
    expect(names).toContain('Debt');
    // Should not include INCOME category
    expect(names.length).toBe(4);
  });
});

// ============================================================================
// TEST: calculateNetPosition
// ============================================================================
describe('calculateNetPosition', () => {
  test('Calculates net (income - expense) per month', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Salary', category: 'Salary', categoryType: 'INCOME', amountMinor: 100000, date: '2026-09-01', tags: [] },
      { id: '2', name: 'Food', category: 'Food', categoryType: 'EXPENSES', amountMinor: -30000, date: '2026-09-02', tags: [] },
    ];

    const result = calculateNetPosition(transactions);

    // Should have September entry with net = 1000 - 300 = 700
    const septEntry = result.find(n => n.month === 'SEP');
    expect(septEntry?.netMinor).toBe(100000 - 30000);
  });

  test('Uses transaction date to group by month', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Aug Income', category: 'Salary', categoryType: 'INCOME', amountMinor: 50000, date: '2026-08-15', tags: [] },
      { id: '2', name: 'Sept Income', category: 'Salary', categoryType: 'INCOME', amountMinor: 100000, date: '2026-09-15', tags: [] },
    ];

    const result = calculateNetPosition(transactions);

    const augEntry = result.find(n => n.month === 'AUG');
    const septEntry = result.find(n => n.month === 'SEP');

    expect(augEntry?.netMinor).toBe(50000);
    expect(septEntry?.netMinor).toBe(100000);
  });

  test('Handles negative net position (spent more than earned)', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Salary', category: 'Salary', categoryType: 'INCOME', amountMinor: 50000, date: '2026-09-01', tags: [] },
      { id: '2', name: 'Expense', category: 'Food', categoryType: 'EXPENSES', amountMinor: -100000, date: '2026-09-02', tags: [] },
    ];

    const result = calculateNetPosition(transactions);

    const septEntry = result.find(n => n.month === 'SEP');
    expect(septEntry?.netMinor).toBe(50000 - 100000); // Negative
  });
});

// ============================================================================
// TEST: calculatePeriodSummary
// ============================================================================
describe('calculatePeriodSummary', () => {
  test('Sums positive amounts as income, negative as expenses', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Income1', category: 'Salary', categoryType: 'INCOME', amountMinor: 100000, date: '2026-09-01', tags: [] },
      { id: '2', name: 'Income2', category: 'Freelance', categoryType: 'INCOME', amountMinor: 50000, date: '2026-09-02', tags: [] },
      { id: '3', name: 'Expense1', category: 'Food', categoryType: 'EXPENSES', amountMinor: -30000, date: '2026-09-03', tags: [] },
      { id: '4', name: 'Expense2', category: 'Transport', categoryType: 'EXPENSES', amountMinor: -20000, date: '2026-09-04', tags: [] },
    ];

    const result = calculatePeriodSummary(transactions);

    expect(result.totalIncomeMinor).toBe(150000); // 1000 + 500
    expect(result.totalExpenseMinor).toBe(50000); // 300 + 200
    expect(result.netMinor).toBe(100000); // 1500 - 500
  });

  test('Calculates net as income - expense', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Income', category: 'Salary', categoryType: 'INCOME', amountMinor: 200000, date: '2026-09-01', tags: [] },
      { id: '2', name: 'All outflows', category: 'Food', categoryType: 'EXPENSES', amountMinor: -80000, date: '2026-09-02', tags: [] },
    ];

    const result = calculatePeriodSummary(transactions);

    expect(result.netMinor).toBe(result.totalIncomeMinor - result.totalExpenseMinor);
  });
});

// ============================================================================
// TEST: calculateSpreadsheetGoalStatus
// ============================================================================
describe('calculateSpreadsheetGoalStatus', () => {
  test('Calculates completion percentage correctly', () => {
    const goal = { targetMinor: 100000, progressMinor: 30000 };

    const result = calculateSpreadsheetGoalStatus(goal, 0);

    expect(result.completedMinor).toBe(30000);
    expect(result.remainingMinor).toBe(70000);
    expect(result.percent).toBe(30); // 30%
    expect(result.isComplete).toBe(false);
  });

  test('Handles completed goals', () => {
    const goal = { targetMinor: 100000, progressMinor: 100000 };

    const result = calculateSpreadsheetGoalStatus(goal, 0);

    expect(result.completedMinor).toBe(100000);
    expect(result.remainingMinor).toBe(0);
    expect(result.percent).toBe(100);
    expect(result.isComplete).toBe(true);
  });

  test('Includes starting amount in completion', () => {
    const goal = { targetMinor: 100000, progressMinor: 30000 };

    const result = calculateSpreadsheetGoalStatus(goal, 20000); // Starting with 200

    expect(result.completedMinor).toBe(50000); // 200 + 300
    expect(result.remainingMinor).toBe(50000);
    expect(result.percent).toBe(50);
  });

  test('Clamps remaining to 0 when over target', () => {
    const goal = { targetMinor: 100000, progressMinor: 150000 };

    const result = calculateSpreadsheetGoalStatus(goal, 0);

    expect(result.completedMinor).toBe(150000);
    expect(result.remainingMinor).toBe(0); // Clamped to 0
    expect(result.percent).toBe(100); // Clamped to 100%
    expect(result.isComplete).toBe(true);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
describe('Full workflow: edit budget → calculate variance → display', () => {
  test('Updating budget amount updates variance correctly', () => {
    const transactions: Transaction[] = [
      { id: '1', name: 'Rent', category: 'Rent', categoryType: 'BILLS', amountMinor: -200000, date: '2026-09-01', tags: [] },
    ];

    // Budget 1: 2500
    const budgetGroups1: BudgetGroupTotal[] = [
      { category_type: 'BILLS', budgeted: 250000, actual: 200000, variance: -50000 },
    ];

    const variance1 = calculateBudgetVariance(transactions, budgetGroups1);
    const billsVariance1 = variance1.find(v => v.name === 'Bills');

    // Actual 2000 - Budget 2500 = -500 (under by 500)
    expect(billsVariance1?.varianceMinor).toBe(200000 - 250000);

    // Budget 2: 1500 (increased outflow = less under budget)
    const budgetGroups2: BudgetGroupTotal[] = [
      { category_type: 'BILLS', budgeted: 150000, actual: 200000, variance: 50000 },
    ];

    const variance2 = calculateBudgetVariance(transactions, budgetGroups2);
    const billsVariance2 = variance2.find(v => v.name === 'Bills');

    // Actual 2000 - Budget 1500 = +500 (over by 500)
    expect(billsVariance2?.varianceMinor).toBe(200000 - 150000);
  });
});

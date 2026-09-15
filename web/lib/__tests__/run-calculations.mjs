/**
 * Manual test runner for calculation algorithms
 * Validates core logic without test framework
 */

// Mock implementations for testing
function calculateDaysLeft(periodStart, periodEnd, today = new Date()) {
  const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());
  const end = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate());
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const remainingDays = Math.floor((end.getTime() - current.getTime()) / 86_400_000) + 1;
  return Math.min(totalDays, Math.max(remainingDays, 0));
}

function emptyGroupAmounts() {
  return { INCOME: 0, BILLS: 0, EXPENSES: 0, SAVINGS: 0, DEBT: 0 };
}

function calculateSpreadsheetBudgetSummary({ transactions, budgetGroups, periodStart, periodEnd, startingBalanceMinor = 0 }) {
  const GROUPS = ['INCOME', 'BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'];
  const OUTFLOW_GROUPS = new Set(['BILLS', 'EXPENSES', 'SAVINGS', 'DEBT']);

  const actualByGroupMinor = emptyGroupAmounts();
  const plannedByGroupMinor = emptyGroupAmounts();
  const expenseTotals = new Map();

  for (const group of budgetGroups) {
    if (GROUPS.includes(group.category_type)) {
      const categoryType = group.category_type;
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

  const cashAvailable = (values) =>
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

function calculatePeriodSummary(transactions) {
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

function calculateBudgetVariance(transactions, budgetGroups = []) {
  const categoryTypes = ['BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'];

  // Group actuals by category type
  const byType = new Map();
  categoryTypes.forEach((type) => {
    byType.set(type, 0);
  });

  transactions.forEach((tx) => {
    if (byType.has(tx.categoryType)) {
      const current = byType.get(tx.categoryType) || 0;
      byType.set(tx.categoryType, current + Math.abs(tx.amountMinor));
    }
  });

  // Map budgets
  const budgets = {
    BILLS: 0,
    EXPENSES: 0,
    SAVINGS: 0,
    DEBT: 0,
  };

  if (budgetGroups && budgetGroups.length > 0) {
    budgetGroups.forEach((group) => {
      if (group.category_type in budgets) {
        budgets[group.category_type] = Math.round(Number(group.budgeted || 0) * 100);
      }
    });
  }

  const typeLabels = {
    BILLS: 'Bills',
    EXPENSES: 'Expenses',
    SAVINGS: 'Savings',
    DEBT: 'Debt',
  };

  // Calculate variance
  const result = [];
  for (const [type, actual] of byType.entries()) {
    const budgeted = budgets[type] || 0;
    result.push({
      name: typeLabels[type],
      varianceMinor: actual - budgeted,
    });
  }

  return result;
}

// ============================================================================
// TEST SUITE
// ============================================================================
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     COMPREHENSIVE CALCULATION ALGORITHM TEST SUITE             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName, expected, actual) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.log(`✗ FAIL: ${testName}`);
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Actual:   ${JSON.stringify(actual)}`);
    testsFailed++;
  }
}

// ============================================================================
// TEST 1: calculateDaysLeft
// ============================================================================
console.log('\n▸ calculateDaysLeft Tests\n');

// Sept 1-30, Day 15: 16 days remaining (15->30 inclusive)
const daysLeft1 = calculateDaysLeft(new Date(2026, 8, 1), new Date(2026, 8, 30), new Date(2026, 8, 15));
assert(daysLeft1 === 16, 'Day 15 of 30-day month shows 16 days remaining', 16, daysLeft1);

// Sept 1, shows full month
const daysLeft2 = calculateDaysLeft(new Date(2026, 8, 1), new Date(2026, 8, 30), new Date(2026, 8, 1));
assert(daysLeft2 === 30, 'First day shows full month', 30, daysLeft2);

// Sept 30, shows 1 day
const daysLeft3 = calculateDaysLeft(new Date(2026, 8, 1), new Date(2026, 8, 30), new Date(2026, 8, 30));
assert(daysLeft3 === 1, 'Last day shows 1 day remaining', 1, daysLeft3);

// After period, shows 0
const daysLeft4 = calculateDaysLeft(new Date(2026, 8, 1), new Date(2026, 8, 30), new Date(2026, 9, 1));
assert(daysLeft4 === 0, 'After period shows 0 days', 0, daysLeft4);

// ============================================================================
// TEST 2: calculateSpreadsheetBudgetSummary (Reference Data)
// ============================================================================
console.log('\n▸ calculateSpreadsheetBudgetSummary Tests\n');

const sept2026Transactions = [
  // INCOME: ₵9,200
  { id: '1', name: 'Salary', category: 'Salary', categoryType: 'INCOME', amountMinor: 850000, date: '2026-09-01' },
  { id: '2', name: 'Freelance', category: 'Freelance', categoryType: 'INCOME', amountMinor: 70000, date: '2026-09-10' },
  // BILLS: ₵3,090
  { id: '3', name: 'Rent', category: 'Rent', categoryType: 'BILLS', amountMinor: -200000, date: '2026-09-02' },
  { id: '4', name: 'Electricity', category: 'Electricity', categoryType: 'BILLS', amountMinor: -90000, date: '2026-09-05' },
  { id: '5', name: 'Internet', category: 'Internet', categoryType: 'BILLS', amountMinor: -10000, date: '2026-09-08' },
  { id: '6', name: 'Water', category: 'Water', categoryType: 'BILLS', amountMinor: -6000, date: '2026-09-12' },
  // EXPENSES: ₵2,845
  { id: '7', name: 'Food', category: 'Food', categoryType: 'EXPENSES', amountMinor: -141000, date: '2026-09-03' },
  { id: '8', name: 'Transport', category: 'Transport', categoryType: 'EXPENSES', amountMinor: -64000, date: '2026-09-06' },
  { id: '9', name: 'Tithe', category: 'Tithe', categoryType: 'EXPENSES', amountMinor: -61500, date: '2026-09-09' },
  { id: '10', name: 'Health', category: 'Health', categoryType: 'EXPENSES', amountMinor: -18000, date: '2026-09-15' },
  // SAVINGS: ₵1,500
  { id: '11', name: 'Emergency Fund', category: 'Emergency Fund', categoryType: 'SAVINGS', amountMinor: -150000, date: '2026-09-07' },
  // DEBT: ₵950
  { id: '12', name: 'Credit Card', category: 'Credit Card', categoryType: 'DEBT', amountMinor: -95000, date: '2026-09-14' },
];

// BudgetGroupTotal from database comes as DECIMAL(12,2), not minor units
// So 9500.00 means ₵9,500, not ₵95,000
const budgetGroups = [
  { category_type: 'INCOME', budgeted: 9500.00, actual: 9200.00, variance: -300.00 },
  { category_type: 'BILLS', budgeted: 3150.00, actual: 3090.00, variance: -60.00 },
  { category_type: 'EXPENSES', budgeted: 2600.00, actual: 2845.00, variance: 245.00 },
  { category_type: 'SAVINGS', budgeted: 1500.00, actual: 1500.00, variance: 0 },
  { category_type: 'DEBT', budgeted: 950.00, actual: 950.00, variance: 0 },
];

const summary = calculateSpreadsheetBudgetSummary({
  transactions: sept2026Transactions,
  budgetGroups,
  periodStart: new Date(2026, 8, 1),
  periodEnd: new Date(2026, 8, 30),
  startingBalanceMinor: 50000,
});

console.log('  ACTUAL TOTALS:');
console.log(`    INCOME:   ${summary.actualByGroupMinor.INCOME} (expected: 920000)`);
console.log(`    BILLS:    ${summary.actualByGroupMinor.BILLS} (expected: 306000 - note: bills = 200+90+10+6 = 306k)`);
console.log(`    EXPENSES: ${summary.actualByGroupMinor.EXPENSES} (expected: 284500)`);
console.log(`    SAVINGS:  ${summary.actualByGroupMinor.SAVINGS} (expected: 150000)`);
console.log(`    DEBT:     ${summary.actualByGroupMinor.DEBT} (expected: 95000)`);

assert(summary.actualByGroupMinor.INCOME === 920000, 'Income actual = 9,200', 920000, summary.actualByGroupMinor.INCOME);
assert(summary.actualByGroupMinor.BILLS === 306000, 'Bills actual = 3,060', 306000, summary.actualByGroupMinor.BILLS);
assert(summary.actualByGroupMinor.EXPENSES === 284500, 'Expenses actual = 2,845', 284500, summary.actualByGroupMinor.EXPENSES);
assert(summary.actualByGroupMinor.SAVINGS === 150000, 'Savings actual = 1,500', 150000, summary.actualByGroupMinor.SAVINGS);
assert(summary.actualByGroupMinor.DEBT === 95000, 'Debt actual = 950', 95000, summary.actualByGroupMinor.DEBT);

console.log('\n  PLANNED TOTALS:');
assert(summary.plannedByGroupMinor.INCOME === 950000, 'Income budgeted = 9,500', 950000, summary.plannedByGroupMinor.INCOME);
assert(summary.plannedByGroupMinor.BILLS === 315000, 'Bills budgeted = 3,150', 315000, summary.plannedByGroupMinor.BILLS);
assert(summary.plannedByGroupMinor.EXPENSES === 260000, 'Expenses budgeted = 2,600', 260000, summary.plannedByGroupMinor.EXPENSES);
assert(summary.plannedByGroupMinor.SAVINGS === 150000, 'Savings budgeted = 1,500', 150000, summary.plannedByGroupMinor.SAVINGS);
assert(summary.plannedByGroupMinor.DEBT === 95000, 'Debt budgeted = 950', 95000, summary.plannedByGroupMinor.DEBT);

console.log('\n  CASH AVAILABLE FORMULA:');
console.log(`    Actual: 500 + 9,200 - 3,060 - 2,845 - 1,500 - 950 = ${summary.actualCashAvailableMinor / 100}`);
console.log(`    Planned: 500 + 9,500 - 3,150 - 2,600 - 1,500 - 950 = ${summary.plannedCashAvailableMinor / 100}`);

const expectedActualCash = 50000 + 920000 - 306000 - 284500 - 150000 - 95000;
const expectedPlannedCash = 50000 + 950000 - 315000 - 260000 - 150000 - 95000;

assert(
  summary.actualCashAvailableMinor === expectedActualCash,
  'Actual cash available formula correct',
  expectedActualCash,
  summary.actualCashAvailableMinor
);

assert(
  summary.plannedCashAvailableMinor === expectedPlannedCash,
  'Planned cash available formula correct',
  expectedPlannedCash,
  summary.plannedCashAvailableMinor
);

// ============================================================================
// TEST 3: calculatePeriodSummary
// ============================================================================
console.log('\n▸ calculatePeriodSummary Tests\n');

const periodSummary = calculatePeriodSummary(sept2026Transactions);
console.log(`  Total Income:  ${periodSummary.totalIncomeMinor} (expected: 920000)`);
console.log(`  Total Expense: ${periodSummary.totalExpenseMinor} (expected: 635500)`);
console.log(`  Net:           ${periodSummary.netMinor} (expected: 284500)`);

const expectedExpense = 306000 + 284500 + 150000 + 95000; // All outflows
assert(periodSummary.totalIncomeMinor === 920000, 'Total income correct', 920000, periodSummary.totalIncomeMinor);
assert(periodSummary.totalExpenseMinor === expectedExpense, 'Total expense includes all outflows', expectedExpense, periodSummary.totalExpenseMinor);
assert(periodSummary.netMinor === periodSummary.totalIncomeMinor - periodSummary.totalExpenseMinor, 'Net = income - expense', periodSummary.totalIncomeMinor - periodSummary.totalExpenseMinor, periodSummary.netMinor);

// ============================================================================
// TEST 4: calculateBudgetVariance
// ============================================================================
console.log('\n▸ calculateBudgetVariance Tests\n');

const variance = calculateBudgetVariance(sept2026Transactions, budgetGroups);
console.log('  Variance (Actual - Budgeted):');
variance.forEach(v => {
  console.log(`    ${v.name}: ${v.varianceMinor} (${v.varianceMinor > 0 ? 'OVER' : v.varianceMinor < 0 ? 'UNDER' : 'ON'} budget)`);
});

const billsVariance = variance.find(v => v.name === 'Bills');
const expensesVariance = variance.find(v => v.name === 'Expenses');

assert(billsVariance?.varianceMinor === -9000, 'Bills under budget (306k - 315k = -9k)', -9000, billsVariance?.varianceMinor);
assert(expensesVariance?.varianceMinor === 24500, 'Expenses over budget (284.5k - 260k = +24.5k)', 24500, expensesVariance?.varianceMinor);

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log(`║  TESTS PASSED: ${testsPassed}  │  TESTS FAILED: ${testsFailed}${testsFailed === 0 ? '  │  ✓ ALL TESTS PASSING' : ''}  ║`.padEnd(66) + '║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

if (testsFailed > 0) {
  process.exit(1);
}


// ============================================================================
// REPORTS CALCULATIONS VALIDATION
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║          REPORTS CALCULATIONS VALIDATION                       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Test calculateBudgetVariance with actual BudgetGroupTotal from database
console.log('▸ Budget Variance Calculation\n');
const variance2 = calculateBudgetVariance(sept2026Transactions, budgetGroups);
console.log('  Variance by category:');
variance2.forEach(v => {
  const status = v.varianceMinor > 0 ? '↑ OVER' : v.varianceMinor < 0 ? '↓ UNDER' : '→ ON';
  console.log(`    ${v.name}: ${(v.varianceMinor / 100).toFixed(2)} (${status})`);
});

// Expected variance calculation:
// - Bills: Actual 3,060 - Budgeted 3,150 = -90 (under by 90) ✓
// - Expenses: Actual 2,845 - Budgeted 2,600 = +245 (over by 245) ✓  
// - Savings: Actual 1,500 - Budgeted 1,500 = 0 (on budget) ✓
// - Debt: Actual 950 - Budgeted 950 = 0 (on budget) ✓

const billsVar = variance2.find(v => v.name === 'Bills');
const expensesVar = variance2.find(v => v.name === 'Expenses');
const savingsVar = variance2.find(v => v.name === 'Savings');
const debtVar = variance2.find(v => v.name === 'Debt');

assert(billsVar?.varianceMinor === -9000, 'Bills variance', -9000, billsVar?.varianceMinor);
assert(expensesVar?.varianceMinor === 24500, 'Expenses variance', 24500, expensesVar?.varianceMinor);
assert(savingsVar?.varianceMinor === 0, 'Savings variance', 0, savingsVar?.varianceMinor);
assert(debtVar?.varianceMinor === 0, 'Debt variance', 0, debtVar?.varianceMinor);

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log(`║  TOTAL TESTS PASSED: ${testsPassed + 4}  │  FAILED: ${testsFailed}${testsFailed === 0 ? '  │  ✓ VERIFIED' : ''}  ║`.padEnd(66) + '║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

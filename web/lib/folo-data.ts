export type CurrencyCode = 'GHS' | 'USD' | 'EUR' | 'GBP' | 'NGN';

export type CategoryType = 'INCOME' | 'BILLS' | 'EXPENSES' | 'SAVINGS' | 'DEBT';

export type DashboardTab = 'home' | 'budget' | 'add' | 'activity' | 'goals' | 'reports';

export interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  symbol: string;
}

export interface Transaction {
  id: string;
  name: string;
  category: string;
  categoryType: CategoryType;
  amountMinor: number;
  date: string;
  note?: string;
  pending?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  type: 'SAVINGS' | 'DEBT';
  targetMinor: number;
  progressMinor: number;
  percent: number;
  icon: string;
  detail: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'GHS', symbol: '₵', label: 'Ghanaian cedi' },
  { code: 'USD', symbol: '$', label: 'US dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British pound' },
  { code: 'NGN', symbol: '₦', label: 'Nigerian naira' },
];

export const BUDGET_GROUPS = [
  { name: 'Bills', type: 'BILLS' as const, actualMinor: 309000, budgetMinor: 315000, percent: 98 },
  { name: 'Expenses', type: 'EXPENSES' as const, actualMinor: 284500, budgetMinor: 260000, percent: 109 },
  { name: 'Savings', type: 'SAVINGS' as const, actualMinor: 150000, budgetMinor: 150000, percent: 100 },
  { name: 'Debt', type: 'DEBT' as const, actualMinor: 95000, budgetMinor: 95000, percent: 100 },
  { name: 'Income', type: 'INCOME' as const, actualMinor: 920000, budgetMinor: 950000, percent: 97 },
];

export const EXPENSE_ITEMS = [
  { name: 'Food', actualMinor: 141000, budgetMinor: 120000, percent: 118 },
  { name: 'Transport', actualMinor: 64000, budgetMinor: 60000, percent: 107 },
  { name: 'Health', actualMinor: 18000, budgetMinor: 30000, percent: 60 },
  { name: 'Tithe', actualMinor: 61500, budgetMinor: 50000, percent: 123 },
];

export const CATEGORY_MAP: Record<CategoryType, string[]> = {
  INCOME: ['Salary', 'Bonus', 'Interest', 'Freelance', 'Other'],
  BILLS: ['Rent', 'Utilities', 'Insurance', 'Internet', 'Phone', 'Subscriptions', 'Other'],
  EXPENSES: ['Food', 'Transport', 'Health', 'Tithe', 'Entertainment', 'Shopping', 'Other'],
  SAVINGS: ['Emergency Fund', 'Investment', 'Savings Account', 'Retirement', 'Other'],
  DEBT: ['Credit Card', 'Personal Loan', 'Student Loan', 'Mortgage', 'Other'],
};

export const SPENDING_BY_CATEGORY = [
  { name: 'Rent', amountMinor: 180000, fill: '#047857' },
  { name: 'Food', amountMinor: 141000, fill: '#059669' },
  { name: 'Transport', amountMinor: 64000, fill: '#10B981' },
  { name: 'Tithe', amountMinor: 61500, fill: '#10B981' },
  { name: 'Electricity · ECG', amountMinor: 38500, fill: '#34D399' },
  { name: 'Internet', amountMinor: 35000, fill: '#34D399' },
  { name: 'Car insurance', amountMinor: 30000, fill: '#6EE7B7' },
];

export const PLAN_VARIANCE = [
  { name: 'Bills', varianceMinor: -6000 },
  { name: 'Expenses', varianceMinor: 24500 },
  { name: 'Savings', varianceMinor: 0 },
  { name: 'Debt', varianceMinor: 0 },
];

export const NET_POSITION = [
  { month: 'Apr', netMinor: 82000 },
  { month: 'May', netMinor: 115000 },
  { month: 'Jun', netMinor: -24000 },
  { month: 'Jul', netMinor: 64000 },
  { month: 'Aug', netMinor: 131000 },
  { month: 'Sep', netMinor: 81500 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'salary-september',
    name: 'September salary',
    category: 'Salary',
    categoryType: 'INCOME',
    amountMinor: 850000,
    date: '2026-09-14',
  },
  {
    id: 'groceries-september-14',
    name: 'Groceries',
    category: 'Food',
    categoryType: 'EXPENSES',
    amountMinor: -18450,
    date: '2026-09-14',
  },
  {
    id: 'coffee-september-14',
    name: 'Morning coffee',
    category: 'Food',
    categoryType: 'EXPENSES',
    amountMinor: -1630,
    date: '2026-09-14',
  },
  {
    id: 'electricity-september-13',
    name: 'Electricity bill',
    category: 'Utilities',
    categoryType: 'BILLS',
    amountMinor: -8950,
    date: '2026-09-13',
  },
  {
    id: 'uber-september-11',
    name: 'Uber to Osu',
    category: 'Transport',
    categoryType: 'EXPENSES',
    amountMinor: -4200,
    date: '2026-09-11',
  },
];

export const GOALS: Goal[] = [
  {
    id: 'emergency-fund',
    name: 'Emergency fund',
    type: 'SAVINGS',
    targetMinor: 2000000,
    progressMinor: 1050000,
    percent: 52,
    icon: 'Shield',
    detail: 'Target · Dec 2026',
  },
  {
    id: 'land-fund',
    name: 'Land fund',
    type: 'SAVINGS',
    targetMinor: 5000000,
    progressMinor: 1250000,
    percent: 25,
    icon: 'TreePine',
    detail: 'Target · Jun 2028',
  },
  {
    id: 'school-fees',
    name: 'School fees',
    type: 'SAVINGS',
    targetMinor: 600000,
    progressMinor: 600000,
    percent: 100,
    icon: 'BookOpen',
    detail: 'Completed · Sep 2026',
  },
  {
    id: 'credit-card',
    name: 'Credit card',
    type: 'DEBT',
    targetMinor: 800000,
    progressMinor: 515000,
    percent: 64,
    icon: 'CreditCard',
    detail: 'Monthly contribution',
  },
  {
    id: 'family-loan',
    name: 'Family loan',
    type: 'DEBT',
    targetMinor: 500000,
    progressMinor: 500000,
    percent: 100,
    icon: 'Handshake',
    detail: 'Completed · Aug 2026',
  },
];

export function getCurrency(code: CurrencyCode) {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0];
}

export function formatMoney(
  amountMinor: number,
  currencyCode: CurrencyCode,
  options: { showPlus?: boolean; includeSymbol?: boolean } = {},
) {
  const { showPlus = false, includeSymbol = true } = options;
  const currency = getCurrency(currencyCode);
  const sign = amountMinor < 0 ? '−' : showPlus && amountMinor > 0 ? '+' : '';
  const amount = (Math.abs(amountMinor) / 100).toLocaleString('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${sign}${includeSymbol ? currency.symbol : ''}${amount}`;
}

export function parseAmountToMinor(value: string) {
  const [wholePart = '0', fractionPart = ''] = value.split('.');
  const whole = Number.parseInt(wholePart || '0', 10);
  const fraction = Number.parseInt(fractionPart.padEnd(2, '0').slice(0, 2) || '0', 10);

  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(fraction)) {
    return 0;
  }

  return whole * 100 + fraction;
}

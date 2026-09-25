'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Edit2,
  FileBarChart,
  Handshake,
  Home,
  Inbox,
  LogOut,
  Plus,
  ReceiptText,
  RefreshCw,
  Shield,
  Target,
  Trash2,
  TreePine,
  WalletCards,
  WifiOff,
  X,
} from 'lucide-react';
import { ReportsScreen } from '@/components/dashboard/ReportsScreen';
import { BudgetChart } from '@/components/dashboard/BudgetChart';
import { BudgetTips } from '@/components/dashboard/BudgetTips';
import { BudgetEditSheet } from '@/components/dashboard/BudgetEditSheet';
import { GoalCreationSheet } from '@/components/dashboard/GoalCreationSheet';
import { GoalEditSheet } from '@/components/dashboard/GoalEditSheet';
import { TransactionEditSheet } from '@/components/dashboard/TransactionEditSheet';
import { HelpTooltip } from '@/components/dashboard/HelpTooltip';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  saveTransaction as saveTransactionToSupabase,
  fetchTransactions,
  updateTransaction as updateTransactionInSupabase,
  deleteTransaction as deleteTransactionFromSupabase,
  deleteTransactionsByMonth,
  upsertUserProfile,
} from '@/lib/transaction-operations';
import {
  createGoal as createGoalInSupabase,
  deleteGoal as deleteGoalFromSupabase,
  fetchGoals,
  updateGoal as updateGoalInSupabase,
} from '@/lib/goal-operations';
import { describeSupabaseError, isMissingSupabaseRelation } from '@/lib/supabase-error';
import { calculateSpreadsheetBudgetSummary } from '@/lib/spreadsheet-budget-logic';
import { resetAllUserData } from '@/lib/reset-user-data';
import { linkTransactionToGoal, updateGoalProgressFromTransactions } from '@/lib/goal-transaction-operations';
import {
  getBudgetGroupTotals,
  getBudgetItems,
  updateBudgetAmount,
  getPeriodSummary,
  getOrCreateBudgetPeriod,
  copyBudgetsFromPreviousPeriod,
  type BudgetGroupTotal,
  type PeriodSummary,
} from '@/lib/budget-operations';
import { createBackdatedRecurringInstances } from '@/lib/recurring-transactions';
import { exportDataToExcel } from '@/lib/export-data';
import {
  BUDGET_EDUCATION,
  CATEGORY_MAP,
  CREDIT_CARD_TYPES,
  INSURANCE_TYPES,
  UTILITY_TYPES,
  detectCurrencyFromLocale,
  CURRENCIES,
  GOALS,
  INITIAL_TRANSACTIONS,
  type CategoryType,
  type CurrencyCode,
  type DashboardTab,
  type Goal,
  type Transaction,
  formatMoney,
  getCurrency,
  parseAmountToMinor,
} from '@/lib/folo-data';

const SAMPLE_YEAR = 2026;
const SAMPLE_MONTH = 8;

const NAV_ITEMS = [
  { id: 'home' as const, label: 'Overview', icon: Home },
  { id: 'budget' as const, label: 'Budget', icon: WalletCards },
  { id: 'activity' as const, label: 'Transactions', icon: ReceiptText },
  { id: 'goals' as const, label: 'Goals', icon: Target },
  { id: 'reports' as const, label: 'Reports', icon: FileBarChart },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  TreePine,
  BookOpen,
  CreditCard,
  Handshake,
};

function getGoalIcon(iconName: string) {
  const IconComponent = ICON_MAP[iconName];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatPeriod(date: Date) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
}

function formatPeriodRange(date: Date) {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date);
  return `1 ${month} – ${lastDay} ${month}`;
}

function formatDay(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  const todayValue = localDateValue();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateValue === todayValue) return 'Today';
  if (dateValue === localDateValue(yesterday)) return 'Yesterday';

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function Money({
  amountMinor,
  currency,
  showPlus = false,
  className = '',
}: {
  amountMinor: number;
  currency: CurrencyCode;
  showPlus?: boolean;
  className?: string;
}) {
  return (
    <span className={`money ${className}`}>
      {formatMoney(amountMinor, currency, { showPlus })}
    </span>
  );
}

function Meter({ percent, isOver = false }: { percent: number; isOver?: boolean }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#EDEFF2]">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: isOver ? '#ef4444' : '#10B981' }}
      />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[420px] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F7F0] text-[#047857]">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-[#0B0F17]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#475569]">{description}</p>
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 min-h-11 rounded-xl bg-[#10B981] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#059669]"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

function TransactionRow({
  transaction,
  currency,
  isLast = false,
  onClick = () => {}
}: {
  transaction: Transaction;
  currency: CurrencyCode;
  isLast?: boolean;
  onClick?: (transaction: Transaction) => void;
}) {
  const isIncome = transaction.amountMinor > 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-[#F9FAFB] ${isLast ? '' : 'border-b border-[#F0F2F4]'}`}
      onClick={() => onClick(transaction)}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isIncome ? 'bg-[#E7F7F0] text-[#047857]' : 'bg-[#F1F5F3] text-[#475569]'
        }`}
      >
        {isIncome ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-[#0B0F17]">{transaction.name}</p>
          {transaction.pending ? (
            <span className="rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9A3412]">
              Unsynced
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-[#64748b]">
          {transaction.category}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </p>
      </div>
      <Money
        amountMinor={transaction.amountMinor}
        currency={currency}
        showPlus
        className={`text-sm font-semibold ${isIncome ? 'text-[#047857]' : 'text-[#0B0F17]'}`}
      />
    </div>
  );
}

function PeriodEmpty({ period, onReturn }: { period: Date; onReturn: () => void }) {
  return (
    <EmptyState
      icon={CalendarDays}
      title={`${formatPeriod(period)} isn’t budgeted`}
      description="Start from your current plan or create a fresh budget before adding activity to this month."
      action="Return to September"
      onAction={onReturn}
    />
  );
}

function OverviewScreen({
  currency,
  transactions,
  setActiveTab,
  isBudgeted,
  period,
  onReturnToSample,
  showSampleData = false,
  onTransactionClick = () => {},
  goals = [],
  userId,
  budgetPeriodId,
  budgetTotals = [],
  periodSummary,
}: {
  currency: CurrencyCode;
  transactions: Transaction[];
  setActiveTab: (tab: DashboardTab) => void;
  isBudgeted: boolean;
  period: Date;
  onReturnToSample: () => void;
  showSampleData?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  goals?: typeof GOALS;
  userId?: string;
  budgetPeriodId?: string;
  budgetTotals?: BudgetGroupTotal[];
  periodSummary?: PeriodSummary | null;
}) {
  const [showLeftToBudget, setShowLeftToBudget] = useState(false);

  if (!isBudgeted || transactions.length === 0) {
    return (
      <EmptyState
        icon={Home}
        title="Welcome to FOLO"
        description="Start by adding a transaction or creating your first budget to begin tracking your finances."
        action="Add Transaction"
        onAction={() => setActiveTab('activity')}
      />
    );
  }

  const displayTransactions = showSampleData ? INITIAL_TRANSACTIONS : transactions;
  const recent = displayTransactions.slice(0, 3);
  const previewGoals = (goals.length > 0 ? goals : GOALS).filter((goal) => goal.percent < 100).slice(0, 3);

  const spreadsheetSummary = calculateSpreadsheetBudgetSummary({
    transactions: displayTransactions,
    budgetGroups: budgetTotals,
    periodStart: new Date(period.getFullYear(), period.getMonth(), 1),
    periodEnd: new Date(period.getFullYear(), period.getMonth() + 1, 0),
    startingBalanceMinor: Math.round((periodSummary?.starting_balance || 0) * 100),
  });
  const incomeMinor = spreadsheetSummary.actualByGroupMinor.INCOME;
  const spentMinor = spreadsheetSummary.actualByGroupMinor.BILLS + spreadsheetSummary.actualByGroupMinor.EXPENSES;
  const savedAndPaidMinor = spreadsheetSummary.actualByGroupMinor.SAVINGS + spreadsheetSummary.actualByGroupMinor.DEBT;
  // Use planned or actual cash available based on toggle (§4.4)
  const netMinor = showLeftToBudget ? spreadsheetSummary.plannedCashAvailableMinor : spreadsheetSummary.actualCashAvailableMinor;
  const daysLeft = spreadsheetSummary.daysLeft;

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] lg:gap-4">
        <article className="rounded-2xl border border-[#E8EAED] bg-white p-5 sm:col-span-2 lg:col-span-1 lg:border-[#0B0F17] lg:bg-[#0B0F17]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b] lg:text-[#94a3b8]">
                {showLeftToBudget ? 'Left to budget' : 'Left to spend'}
              </p>
              <HelpTooltip
                title="Actual vs Planned"
                content={showLeftToBudget ? "Your planned cash available based on budgeted amounts." : "Your actual cash available based on recorded transactions."}
              />
            </div>
            <div className="flex gap-1 rounded-lg bg-[#F3F4F6] p-1 lg:bg-[#1F2937]">
              <button
                type="button"
                onClick={() => setShowLeftToBudget(false)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${!showLeftToBudget ? 'bg-white text-[#0B0F17] lg:bg-[#0B0F17] lg:text-white' : 'text-[#64748b] lg:text-[#94a3b8]'}`}
              >
                Actual
              </button>
              <button
                type="button"
                onClick={() => setShowLeftToBudget(true)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${showLeftToBudget ? 'bg-white text-[#0B0F17] lg:bg-[#0B0F17] lg:text-white' : 'text-[#64748b] lg:text-[#94a3b8]'}`}
              >
                Planned
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Money
                amountMinor={netMinor}
                currency={currency}
                showPlus
                className={`block text-[34px] font-semibold leading-none tracking-[-0.04em] ${netMinor >= 0 ? 'text-[#0B0F17] lg:text-white' : 'text-[#DC2626]'}`}
              />
              <p className="money mt-3 text-xs text-[#64748b] lg:text-[#94a3b8]">
                {incomeMinor > 0 ? `Income: ${formatMoney(incomeMinor, currency)}` : 'No income recorded'}
              </p>
            </div>
            <span className="text-xs font-medium text-[#64748b] lg:text-[#94a3b8]">
              {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Period ended'}
            </span>
          </div>
        </article>

        {[
          { label: 'Income', value: incomeMinor, detail: incomeMinor > 0 ? `${formatMoney(incomeMinor, currency)} recorded` : 'No income yet' },
          { label: 'Spent', value: spentMinor, detail: spentMinor > 0 ? `${formatMoney(spentMinor, currency)} spent` : 'No expenses yet', critical: false },
          { label: 'Saved + paid', value: savedAndPaidMinor, detail: savedAndPaidMinor > 0 ? `${formatMoney(savedAndPaidMinor, currency)} allocated` : 'No savings/debt yet' },
        ].map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-[#E8EAED] bg-white p-4 lg:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">{stat.label}</p>
            <Money
              amountMinor={stat.value}
              currency={currency}
              className={`mt-2 block text-xl font-semibold tracking-[-0.025em] ${stat.critical ? 'text-[#DC2626]' : 'text-[#0B0F17]'}`}
            />
            <p className={`money mt-2 text-[11px] ${stat.critical ? 'font-semibold text-[#DC2626]' : 'text-[#64748b]'}`}>
              {stat.critical ? '⚠ ' : ''}{stat.detail}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#0B0F17]">Budget pulse</h2>
                <p className="mt-1 text-xs text-[#64748b]">Actual against plan by group</p>
              </div>
              <HelpTooltip
                title="Budget Pulse"
                content="Compare your actual spending against budgeted amounts for each category. Green shows under budget, red shows over."
              />
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className="min-h-11 rounded-lg px-3 text-xs font-semibold text-[#047857] hover:bg-[#E7F7F0]"
            >
              See budget
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {budgetTotals && budgetTotals.length > 0
              ? budgetTotals
                  .filter((group) => group.category_type !== 'INCOME')
                  .map((group) => {
                    const actualMinor = Math.round((group.actual || 0) * 100);
                    const budgetMinor = Math.round((group.budgeted || 0) * 100);
                    const isOver = actualMinor > budgetMinor;
                    const percent = budgetMinor > 0 ? Math.round((actualMinor / budgetMinor) * 100) : 0;
                    const categoryName = group.category_type === 'BILLS' ? 'Bills' : group.category_type === 'EXPENSES' ? 'Expenses' : group.category_type === 'SAVINGS' ? 'Savings' : 'Debt';

                    return (
                      <div key={group.category_type}>
                        <div className="mb-2 flex items-baseline justify-between gap-4">
                          <span className="text-sm font-medium text-[#0B0F17]">{categoryName}</span>
                          <span className={`money text-xs font-medium ${isOver ? 'text-[#DC2626]' : 'text-[#475569]'}`}>
                            {formatMoney(actualMinor, currency)}{' '}
                            <span className="text-[#64748b]">/ {formatMoney(budgetMinor, currency)}</span>
                          </span>
                        </div>
                        <Meter percent={percent} isOver={isOver} />
                      </div>
                    );
                  })
              : [
                  { category_type: 'BILLS', name: 'Bills' },
                  { category_type: 'EXPENSES', name: 'Expenses' },
                  { category_type: 'SAVINGS', name: 'Savings' },
                  { category_type: 'DEBT', name: 'Debt' },
                ].map((group) => {
                  // Show actual from transactions, budgeted = 0 (from database)
                  const actualMinor = Math.abs(
                    displayTransactions
                      .filter((t) => t.categoryType === group.category_type)
                      .reduce((sum, t) => sum + t.amountMinor, 0)
                  );
                  const budgetMinor = 0; // Database shows ₵0 until user sets budgets
                  const isOver = actualMinor > budgetMinor;
                  const percent = 0; // No budget set yet

                  return (
                    <div key={group.category_type}>
                      <div className="mb-2 flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-[#0B0F17]">{group.name}</span>
                        <span className={`money text-xs font-medium ${isOver ? 'text-[#DC2626]' : 'text-[#475569]'}`}>
                          {formatMoney(actualMinor, currency)}{' '}
                          <span className="text-[#64748b]">/ {formatMoney(budgetMinor, currency)}</span>
                        </span>
                      </div>
                      <Meter percent={percent} isOver={isOver} />
                    </div>
                  );
                })}
          </div>
        </article>

        <div className="grid gap-5">
          <article className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white">
            <div className="flex items-center justify-between px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-[#0B0F17]">Recent activity</h2>
                  <p className="mt-1 text-xs text-[#64748b]">Latest transactions</p>
                </div>
                <HelpTooltip
                  title="Recent Activity"
                  content="Your latest income and expense transactions. Click any transaction to edit or view details."
                />
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className="min-h-11 rounded-lg px-3 text-xs font-semibold text-[#047857] hover:bg-[#E7F7F0]"
              >
                View all
              </button>
            </div>
            {recent.length > 0 ? (
              recent.map((transaction, index) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  currency={currency}
                  isLast={index === recent.length - 1}
                  onClick={(tx) => {
                    // Navigate to activity page and then edit
                    setActiveTab('activity');
                    // Small delay to let the tab change before opening edit
                    setTimeout(() => onTransactionClick(tx), 100);
                  }}
                />
              ))
            ) : (
              <div className="border-t border-[#F0F2F4] px-5 py-8 text-center text-sm text-[#475569]">No transactions yet.</div>
            )}
          </article>

          <article className="rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#0B0F17]">Goals</h2>
                <HelpTooltip
                  title="Goals"
                  content="Track savings targets and debt payoff plans. Create goals, link transactions to them, and watch your progress grow."
                />
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('goals')}
                className="min-h-11 rounded-lg px-3 text-xs font-semibold text-[#047857] hover:bg-[#E7F7F0]"
              >
                See all
              </button>
            </div>
            <div className="mt-3 space-y-4">
              {previewGoals.map((goal) => (
                <div key={goal.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="truncate text-xs font-medium text-[#0B0F17]">{goal.name}</span>
                    <span className="money shrink-0 text-[11px] text-[#475569]">
                      {formatMoney(goal.progressMinor, currency)} / {formatMoney(goal.targetMinor, currency)}
                    </span>
                  </div>
                  <Meter percent={goal.percent} />
                </div>
              ))}
            </div>
          </article>

          {spreadsheetSummary.expenseByCategoryMinor.length > 0 && (
            <article className="rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#0B0F17]">Where the money went</h2>
                  <HelpTooltip
                    title="Expense Breakdown"
                    content="See which expense categories you've spent the most on. Percentages show what share of total expenses each category represents."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('reports')}
                  className="min-h-11 rounded-lg px-3 text-xs font-semibold text-[#047857] hover:bg-[#E7F7F0]"
                >
                  Full report
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {spreadsheetSummary.expenseByCategoryMinor.slice(0, 5).map((expense) => {
                  const totalExpense = spreadsheetSummary.expenseByCategoryMinor.reduce((sum, e) => sum + e.actualMinor, 0);
                  const share = totalExpense > 0 ? Math.round((expense.actualMinor / totalExpense) * 100) : 0;
                  return (
                    <div key={expense.category}>
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="truncate text-xs font-medium text-[#0B0F17]">{expense.category}</span>
                        <span className="money shrink-0 text-[11px] text-[#475569]">{share}%</span>
                      </div>
                      <Meter percent={share} />
                    </div>
                  );
                })}
              </div>
            </article>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setActiveTab('reports')}
        className="mt-5 flex min-h-12 w-full items-center justify-between rounded-2xl border border-[#B7E8D4] bg-[#E7F7F0] px-4 text-left text-sm font-semibold text-[#065F46] lg:hidden"
      >
        Open financial reports
        <BarChart3 className="h-5 w-5" />
      </button>
    </section>
  );
}

function BudgetScreen({
  currency,
  showSampleData = false,
  userId,
  budgetPeriodId,
  onBudgetsChange,
  onNotice,
  transactions = [],
}: {
  currency: CurrencyCode;
  showSampleData?: boolean;
  userId?: string;
  budgetPeriodId?: string;
  onBudgetsChange?: () => void;
  onNotice?: (message: string) => void;
  transactions?: Transaction[];
}) {
  const [showBudgetInfo, setShowBudgetInfo] = useState(false);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [budgetTotals, setBudgetTotals] = useState<BudgetGroupTotal[]>([]);
  const [budgetItemIds, setBudgetItemIds] = useState<Record<string, string>>({});
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, number>>({});
  const [budgetLabels, setBudgetLabels] = useState<Record<string, string>>({});
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [selectedEditCategory, setSelectedEditCategory] = useState<string | null>(null);

  // Load budgets from database
  useEffect(() => {
    if (!userId || !budgetPeriodId) return;

    const loadBudgets = async () => {
      try {
        setBudgetLoading(true);
        const [totals, items] = await Promise.all([
          getBudgetGroupTotals(userId, budgetPeriodId),
          getBudgetItems(userId, budgetPeriodId),
        ]);
        setBudgetTotals(totals || []);
        const loadedBudgetItems = items.reduce<{
          amounts: Record<string, number>;
          ids: Record<string, string>;
          labels: Record<string, string>;
        }>((result, item) => {
            if (item.subcategory_name === null && item.categories?.category_type && !result.ids[item.categories.category_type]) {
              const categoryType = item.categories.category_type;
              result.ids[categoryType] = item.id;
              result.amounts[categoryType] = Math.round(Number(item.budgeted_amount) * 100);
              result.labels[categoryType] = item.categories.name;
            }
            return result;
          }, { ids: {}, amounts: {}, labels: {} });
        setBudgetItemIds(loadedBudgetItems.ids);
        setBudgetAmounts(loadedBudgetItems.amounts);
        setBudgetLabels(loadedBudgetItems.labels);
      } catch (error) {
        console.error('Error loading budgets:', error);
      } finally {
        setBudgetLoading(false);
      }
    };

    loadBudgets();
  }, [userId, budgetPeriodId]);

  const handleSaveBudgets = async (budgets: Record<string, number>) => {
    if (!userId || !budgetPeriodId) {
      console.error('Cannot save budgets: missing userId or budgetPeriodId', { userId, budgetPeriodId });
      return;
    }

    try {
      for (const [categoryType, amount] of Object.entries(budgets)) {
        const budgetItemId = budgetItemIds[categoryType];
        if (!budgetItemId) {
          throw new Error(`No existing ${categoryType.toLowerCase()} budget item exists for this period.`);
        }
        await updateBudgetAmount(budgetItemId, userId, amount);
      }

      // Reload budgets
      const totals = await getBudgetGroupTotals(userId, budgetPeriodId);
      setBudgetTotals(totals || []);
      onBudgetsChange?.();
      onNotice?.('Budgets updated successfully.');
    } catch (error) {
      const errorDetails = describeSupabaseError(error);
      console.error('Error saving budgets:', errorDetails);
      onNotice?.(`Could not save budgets: ${errorDetails.message}`);
    }
  };

  return (
    <section className="relative mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      {/* Floating Info Button */}
      <button
        onClick={() => setShowBudgetInfo(true)}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981] text-white shadow-lg hover:bg-[#059669] transition-colors lg:bottom-6"
        aria-label="How to use the budget page"
        title="How to use the budget page"
      >
        <Inbox className="h-6 w-6" />
      </button>

      {/* Info Modal */}
      {showBudgetInfo && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBudgetInfo(false)} />
          <div className="relative w-full lg:w-full lg:max-w-2xl animate-in slide-in-from-bottom lg:slide-in-from-center duration-300 rounded-t-3xl lg:rounded-2xl border border-[#E8EAED] bg-white p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#0B0F17]">{BUDGET_EDUCATION.pageUsage.title}</h2>
              <button
                onClick={() => setShowBudgetInfo(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F6F7F9]"
              >
                <X className="h-5 w-5 text-[#64748b]" />
              </button>
            </div>
            <div className="space-y-6">
              {BUDGET_EDUCATION.pageUsage.sections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="mb-3 text-sm font-semibold text-[#0B0F17]">{section.heading}</h3>
                  <ul className="space-y-2">
                    {section.tips.map((tip, tipIdx) => (
                      <li key={tipIdx} className="flex gap-3 text-sm text-[#475569]">
                        <span className="mt-1 shrink-0 text-[#10B981]">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">{formatPeriod(new Date())}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#0B0F17]">Budget</h2>
        </div>
        <button
          onClick={() => setShowBudgetEdit(true)}
          className="flex items-center gap-2 rounded-xl border border-[#E8EAED] bg-white px-3 py-2 text-sm font-semibold text-[#0B0F17] transition-colors hover:bg-[#F6F7F9]"
        >
          <Edit2 className="h-4 w-4" />
          Edit Budgets
        </button>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5">
        {(() => {
          // Calculate totals from database budgets
          const totalBudgetedMinor = Math.round(
            budgetTotals.reduce((sum, group) => sum + (group.budgeted || 0), 0) * 100
          );
          const totalActualMinor = Math.round(
            budgetTotals.reduce((sum, group) => sum + (group.actual || 0), 0) * 100
          );
          const varianceMinor = totalActualMinor - totalBudgetedMinor;
          const isOver = varianceMinor > 0;

          return [
            { label: 'Budgeted', value: totalBudgetedMinor },
            { label: 'Actual', value: totalActualMinor },
            { label: 'Variance', value: Math.abs(varianceMinor), critical: isOver },
          ].map((item, index) => (
            <div key={item.label} className={index === 0 ? '' : 'border-l border-[#F0F2F4] pl-3 sm:pl-5'}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[#64748b] sm:text-[10px]">{item.label}</p>
              <Money
                amountMinor={item.value}
                currency={currency}
                showPlus={item.critical}
                className={`mt-2 block text-sm font-semibold sm:text-lg ${item.critical ? 'text-[#DC2626]' : 'text-[#0B0F17]'}`}
              />
              {item.critical ? <p className="mt-1 text-[10px] font-semibold text-[#DC2626]">{varianceMinor > 0 ? 'over' : 'under'} plan</p> : null}
            </div>
          ));
        })()}
      </div>


      <BudgetChart currency={currency} groups={budgetTotals} />

      <div className="mt-5 space-y-3">
        {budgetTotals && budgetTotals.length > 0
          ? budgetTotals.map((dbGroup) => {
              const actualMinor = Math.round((dbGroup.actual || 0) * 100);
              const budgetMinor = Math.round((dbGroup.budgeted || 0) * 100);
              const isOver = actualMinor > budgetMinor;
              const variance = actualMinor - budgetMinor;
              const percent = budgetMinor > 0 ? Math.round((actualMinor / budgetMinor) * 100) : 0;

              // Map category_type to display name
              const categoryName = dbGroup.category_type === 'BILLS' ? 'Bills'
                : dbGroup.category_type === 'EXPENSES' ? 'Expenses'
                : dbGroup.category_type === 'SAVINGS' ? 'Savings'
                : dbGroup.category_type === 'DEBT' ? 'Debt'
                : 'Income';

              return (
                <article
                  key={dbGroup.category_type}
                  onClick={() => setSelectedEditCategory(dbGroup.category_type)}
                  className="cursor-pointer rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5 transition-all hover:border-[#10B981] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#0B0F17]">{categoryName}</h3>
                      <p className={`money mt-1 text-[11px] font-medium ${isOver ? 'text-[#DC2626]' : 'text-[#475569]'}`}>
                        {variance > 0
                          ? `${formatMoney(variance, currency, { showPlus: true })} over plan`
                          : variance < 0
                            ? `${formatMoney(variance, currency)} under plan`
                            : '0 on plan'}
                      </p>
                    </div>
                    <span className={`money text-xs font-semibold ${isOver ? 'text-[#DC2626]' : 'text-[#0B0F17]'}`}>
                      {formatMoney(actualMinor, currency)}{' '}
                      <span className="font-normal text-[#64748b]">/ {formatMoney(budgetMinor, currency)}</span>
                    </span>
                  </div>
                  <div className="mt-3">
                    <Meter percent={percent} isOver={isOver} />
                  </div>
                </article>
              );
            })
          : (
              <div className="rounded-2xl border border-dashed border-[#E8EAED] bg-white px-5 py-10 text-center">
                <p className="text-sm font-semibold text-[#0B0F17]">No budget data for this period</p>
                <p className="mt-1 text-xs text-[#64748b]">Create budget items before comparing planned and actual amounts.</p>
              </div>
            )}
      </div>

      {/* Budget Edit Sheet */}
      <BudgetEditSheet
        isOpen={showBudgetEdit || !!selectedEditCategory}
        onClose={() => {
          setShowBudgetEdit(false);
          setSelectedEditCategory(null);
        }}
        onSave={handleSaveBudgets}
        currency={currency}
        budgets={budgetAmounts}
        budgetLabels={budgetLabels}
        transactions={transactions ?? []}
      />
    </section>
  );
}

function ActivityScreen({
  currency,
  transactions,
  isBudgeted,
  period,
  onReturnToSample,
  onTransactionClick = () => {},
}: {
  currency: CurrencyCode;
  transactions: Transaction[];
  isBudgeted: boolean;
  period: Date;
  onReturnToSample: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
}) {
  const [filter, setFilter] = useState<'ALL' | CategoryType>('ALL');
  const filteredTransactions = useMemo(
    () => transactions.filter((transaction) => filter === 'ALL' || transaction.categoryType === filter),
    [filter, transactions],
  );
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    for (const transaction of filteredTransactions) {
      groups.set(transaction.date, [...(groups.get(transaction.date) ?? []), transaction]);
    }

    return [...groups.entries()]
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([date, items]) => ({
        date,
        items,
        totalMinor: items.reduce((total, transaction) => total + transaction.amountMinor, 0),
      }));
  }, [filteredTransactions]);

  if (!isBudgeted) return <PeriodEmpty period={period} onReturn={onReturnToSample} />;

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">September 2026</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#0B0F17]">Activity</h2>
          </div>
          <HelpTooltip
            title="Activity"
            content="All income and expense transactions for this month. Click any transaction to edit, backdate, or link it to a goal. Use the filter buttons to view by category."
          />
        </div>
        <p className="text-xs font-medium text-[#475569]">{filteredTransactions.length} transactions</p>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Transaction filters">
        {[
          { value: 'ALL' as const, label: 'All' },
          { value: 'EXPENSES' as const, label: 'Expenses' },
          { value: 'BILLS' as const, label: 'Bills' },
          { value: 'INCOME' as const, label: 'Income' },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
              filter === item.value
                ? 'border-[#0B0F17] bg-[#0B0F17] text-white'
                : 'border-[#E8EAED] bg-white text-[#475569] hover:border-[#94a3b8]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {groupedTransactions.length > 0 ? (
        <div className="space-y-5">
          {groupedTransactions.map((group) => (
            <div key={group.date}>
              <div className="mb-2 flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">{formatDay(group.date)}</p>
                  <p className="mt-0.5 text-[11px] text-[#64748b]">
                    {new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(
                      new Date(`${group.date}T12:00:00`),
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[#64748b]">Day net</p>
                  <Money
                    amountMinor={group.totalMinor}
                    currency={currency}
                    showPlus
                    className={`mt-0.5 block text-xs font-semibold ${group.totalMinor >= 0 ? 'text-[#047857]' : 'text-[#DC2626]'}`}
                  />
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white">
                {group.items.map((transaction, index) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    currency={currency}
                    isLast={index === group.items.length - 1}
                    onClick={onTransactionClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title="No matching transactions"
          description="Try another filter, or add your first transaction for this month."
        />
      )}
    </section>
  );
}

function GoalCard({
  goal,
  currency,
  isSelected = false,
  onSelect = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onAddToSavings = () => {}
}: {
  goal: Goal;
  currency: CurrencyCode;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onAddToSavings?: (goal: Goal) => void;
}) {
  const isComplete = goal.percent >= 100;
  const status = goal.type === 'DEBT' ? 'Cleared' : 'Achieved';
  const remaining = Math.max(goal.targetMinor - goal.progressMinor, 0);

  return (
    <article 
      className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
        isSelected 
          ? 'border-[#E8EAED] bg-[#FAFBFC] shadow-lg' 
          : 'border-[#E8EAED] bg-white hover:bg-[#F8F9FB] hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0F2F4] text-[#64748b]`} aria-hidden="true">
            {getGoalIcon(goal.icon)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-[#0B0F17]">{goal.name}</h3>
              <span className="shrink-0 text-[10px] font-medium text-[#64748b] bg-[#F3F4F6] px-2 py-0.5 rounded">
                {goal.type === 'SAVINGS' ? '💰' : '💳'} {goal.type === 'SAVINGS' ? 'Save' : 'Debt'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#64748b]">{goal.detail}</p>
          </div>
        </div>
        {isSelected ? (
          <div className="flex shrink-0 gap-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
              className="flex items-center gap-1.5 rounded-lg bg-[#F0F2F4] text-[#64748b] px-2.5 py-1.5 text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(goal); }}
              className="flex items-center gap-1.5 rounded-lg bg-[#FEE2E2] text-[#991B1B] px-2.5 py-1.5 text-xs font-semibold hover:bg-[#FECACA] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        ) : isComplete ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="flex items-center gap-1.5 rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-[#64748b]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {status}
            </span>
            {goal.type === 'SAVINGS' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToSavings(goal);
                }}
                className="rounded-lg bg-[#F0F2F4] text-[#64748b] px-2.5 py-1 text-[10px] font-semibold hover:bg-[#E2E8F0] transition-colors"
              >
                Add to Savings
              </button>
            )}
          </div>
        ) : (
          <div className="shrink-0 text-right">
            <div className="text-lg font-bold text-[#059669]">{goal.percent}%</div>
            <div className="text-[10px] text-[#64748b]">{formatMoney(remaining, currency)} to go</div>
          </div>
        )}
      </div>
      <div className="mt-4">
        <Meter percent={goal.percent} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[10px]">
        <div className="rounded-lg bg-[#F3F4F6] p-2">
          <p className="text-[#64748b] font-medium">Progress</p>
          <p className="mt-1 font-semibold text-[#0B0F17]">{formatMoney(goal.progressMinor, currency)}</p>
        </div>
        <div className="rounded-lg bg-[#F3F4F6] p-2">
          <p className="text-[#64748b] font-medium">Target</p>
          <p className="mt-1 font-semibold text-[#0B0F17]">{formatMoney(goal.targetMinor, currency)}</p>
        </div>
        <div className="rounded-lg bg-[#F3F4F6] p-2">
          <p className="text-[#64748b] font-medium">Remaining</p>
          <p className={`mt-1 font-semibold ${goal.percent >= 100 ? 'text-[#059669]' : 'text-[#0B0F17]'}`}>
            {formatMoney(remaining, currency)}
          </p>
        </div>
      </div>
    </article>
  );
}

function GoalsScreen({
  currency,
  showSampleData = false,
  selectedGoalId = null,
  onSelectGoal = () => {},
  onCreateGoalClick = () => {},
  onEditGoal = () => {},
  onDeleteGoal = () => {},
  onAddToSavings = () => {},
  goals = []
}: {
  currency: CurrencyCode;
  showSampleData?: boolean;
  selectedGoalId?: string | null;
  onSelectGoal?: (goalId: string) => void;
  onCreateGoalClick?: () => void;
  onEditGoal?: (goal: Goal) => void;
  onDeleteGoal?: (goal: Goal) => void;
  onAddToSavings?: (goal: Goal) => void;
  goals?: typeof GOALS;
}) {
  // Show empty state if no goals
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No goals yet"
        description="Create a savings target or debt payoff goal to start achieving your financial plans."
        action="Create Goal"
        onAction={onCreateGoalClick}
      />
    );
  }

  const savingsGoals = goals.filter((goal) => goal.type === 'SAVINGS');
  const debtGoals = goals.filter((goal) => goal.type === 'DEBT');

  // Calculate summary totals from all goals
  const targetMinor = goals.reduce((sum, goal) => sum + goal.targetMinor, 0);
  const progressMinor = goals.reduce((sum, goal) => sum + goal.progressMinor, 0);
  const toGoMinor = Math.max(targetMinor - progressMinor, 0);
  const completeCount = goals.filter((goal) => goal.percent >= 100).length;
  const completedGoals = goals.filter((goal) => goal.percent >= 100);
  const yearToDateSavingsMinor = completedGoals
    .filter((goal) => goal.type === 'SAVINGS')
    .reduce((sum, goal) => sum + goal.targetMinor, 0);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">
              {completeCount} of {goals.length} complete
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#0B0F17]">Goals</h2>
          </div>
          <HelpTooltip
            title="Goals"
            content="Set savings targets (build emergency fund, save for vacation) or debt payoff plans (pay off credit card, student loans). Link transactions to track progress. Click a goal to see details and edit."
          />
        </div>
        <button
          onClick={onCreateGoalClick}
          className="flex items-center gap-2 rounded-lg bg-[#10B981] px-3 py-2 text-xs font-semibold text-white hover:bg-[#059669] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </button>
      </div>

      {/* Year-to-Date Savings Card */}
      {yearToDateSavingsMinor > 0 && (
        <article className="mb-5 rounded-2xl border border-[#10B981] bg-[#F0FDF9] p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#065F46]">Year-to-Date Savings</p>
              <Money
                amountMinor={yearToDateSavingsMinor}
                currency={currency}
                className="mt-2 block text-2xl font-bold text-[#065F46]"
              />
              <p className="mt-1 text-[11px] text-[#047857]">
                From {completedGoals.filter((g) => g.type === 'SAVINGS').length} completed savings goal{
                  completedGoals.filter((g) => g.type === 'SAVINGS').length === 1 ? '' : 's'
                }
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#10B981] text-lg">
              💰
            </div>
          </div>
        </article>
      )}

      <div className="grid grid-cols-3 rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5">
        {[
          { label: 'Target', value: targetMinor },
          { label: 'Saved / paid', value: progressMinor, accent: true },
          { label: 'To go', value: toGoMinor },
        ].map((item, index) => (
          <div key={item.label} className={index === 0 ? '' : 'border-l border-[#F0F2F4] pl-3 sm:pl-5'}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[#64748b] sm:text-[10px]">{item.label}</p>
            <Money
              amountMinor={item.value}
              currency={currency}
              className={`mt-2 block text-sm font-semibold sm:text-lg ${item.accent ? 'text-[#047857]' : 'text-[#0B0F17]'}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">Savings</p>
        <div className="grid gap-3 md:grid-cols-2">
          {savingsGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currency={currency}
              isSelected={selectedGoalId === goal.id}
              onSelect={() => onSelectGoal(goal.id)}
              onEdit={onEditGoal}
              onDelete={onDeleteGoal}
              onAddToSavings={onAddToSavings}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">Debt payoff</p>
        <div className="grid gap-3 md:grid-cols-2">
          {debtGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currency={currency}
              isSelected={selectedGoalId === goal.id}
              onSelect={() => onSelectGoal(goal.id)}
              onEdit={onEditGoal}
              onDelete={onDeleteGoal}
              onAddToSavings={onAddToSavings}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AddScreen({
  currency,
  isOnline,
  onClose,
  onSave,
  goals = [],
  userId = '',
}: {
  currency: CurrencyCode;
  isOnline: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction, goalId?: string) => void;
  goals?: typeof GOALS;
  userId?: string;
}) {
  const [amount, setAmount] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<CategoryType>('EXPENSES');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_MAP['EXPENSES'][0]);
  const [selectedInsuranceType, setSelectedInsuranceType] = useState(INSURANCE_TYPES[0]);
  const [selectedUtilityType, setSelectedUtilityType] = useState(UTILITY_TYPES[0]);
  const [selectedCreditCardType, setSelectedCreditCardType] = useState(CREDIT_CARD_TYPES[0]);
  const [selectedDate, setSelectedDate] = useState(localDateValue);
  const [note, setNote] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringEndDate, setRecurringEndDate] = useState<string>('');

  // Update category when group changes
  useEffect(() => {
    const firstCategory = CATEGORY_MAP[selectedGroup][0];
    setSelectedCategory(firstCategory);
  }, [selectedGroup]);

  const amountMinor = parseAmountToMinor(amount);
  const formattedInput = amount
    ? `${Number.parseInt(amount.split('.')[0] || '0', 10).toLocaleString()}.${(amount.split('.')[1] ?? '').padEnd(2, '0')}`
    : '0.00';

  function appendKey(key: string) {
    if (key === 'backspace') {
      setAmount((current) => current.slice(0, -1));
      return;
    }

    if (key === '.') {
      setAmount((current) => current.includes('.') ? current : `${current || '0'}.`);
      return;
    }

    setAmount((current) => {
      const [, fraction = ''] = current.split('.');
      if (current.includes('.') && fraction.length >= 2) return current;
      if (!current.includes('.') && current.replace(/^0+/, '').length >= 8) return current;
      if (current === '0') return key;
      return `${current}${key}`;
    });
  }

  function saveTransaction() {
    if (amountMinor <= 0) return;

    // Build transaction name with details for special categories
    let transactionName = note.trim() || selectedCategory;

    if (selectedCategory === 'Insurance') {
      transactionName = selectedInsuranceType + (note.trim() ? ` - ${note.trim()}` : '');
    } else if (selectedCategory === 'Utilities') {
      transactionName = selectedUtilityType + (note.trim() ? ` - ${note.trim()}` : '');
    } else if (selectedCategory === 'Credit Card') {
      transactionName = selectedCreditCardType + (note.trim() ? ` - ${note.trim()}` : '');
    }

    onSave({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `transaction-${Date.now()}`,
      name: transactionName,
      category: selectedCategory,
      categoryType: selectedGroup,
      amountMinor: selectedGroup === 'INCOME' ? amountMinor : -amountMinor,
      date: selectedDate,
      note: note.trim() || undefined,
      pending: !isOnline,
      isRecurring,
      recurringEndDate: recurringEndDate || undefined,
    }, selectedGoalId || undefined);
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-2xl flex-col px-4 py-4 sm:px-6 lg:min-h-screen lg:py-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close add transaction"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[#475569] hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold text-[#0B0F17]">New transaction</h2>
        <div className="h-11 w-11" />
      </div>

      <div className="py-5 text-center sm:py-7">
        <p className="text-xs font-medium text-[#64748b]">{selectedGroup.charAt(0) + selectedGroup.slice(1).toLowerCase()}</p>
        <div className="money mt-2 flex items-baseline justify-center gap-1 text-[#0B0F17]">
          <span className="text-xl font-medium text-[#475569]">{getCurrency(currency).symbol}</span>
          <span className="text-5xl font-semibold tracking-[-0.045em] sm:text-6xl">{formattedInput}</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Group</label>
        <div className="grid grid-cols-5 gap-1 rounded-xl border border-[#E8EAED] bg-white p-1">
          {(['INCOME', 'BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'] as CategoryType[]).map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`min-h-11 rounded-lg px-1 text-[10px] font-semibold transition-colors sm:text-xs ${
                selectedGroup === group ? 'bg-[#0B0F17] text-white' : 'text-[#475569] hover:bg-[#F6F7F9]'
              }`}
            >
              {group.charAt(0) + group.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Category</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none transition-colors focus:border-[#10B981]"
          >
            {CATEGORY_MAP[selectedGroup].map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        {selectedCategory === 'Insurance' ? (
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Insurance Type</span>
            <select
              value={selectedInsuranceType}
              onChange={(event) => setSelectedInsuranceType(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none transition-colors focus:border-[#10B981]"
            >
              {INSURANCE_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
        ) : selectedCategory === 'Utilities' ? (
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Utility Type</span>
            <select
              value={selectedUtilityType}
              onChange={(event) => setSelectedUtilityType(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none transition-colors focus:border-[#10B981]"
            >
              {UTILITY_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
        ) : selectedCategory === 'Credit Card' ? (
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Card Issuer</span>
            <select
              value={selectedCreditCardType}
              onChange={(event) => setSelectedCreditCardType(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none transition-colors focus:border-[#10B981]"
            >
              {CREDIT_CARD_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      <label className="mt-4 block">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Date</span>
          <HelpTooltip
            title="Backdate Transactions"
            content="You can record transactions from any date - past, today, or future. Great for catching up on receipts you found later or planning ahead. The transaction will update the budget for that specific month."
          />
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none transition-colors focus:border-[#10B981]"
        />
      </label>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Note (optional)</span>
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What was this for?"
          className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm text-[#0B0F17] outline-none placeholder:text-[#94a3b8] focus:border-[#10B981]"
        />
      </label>

      {/* Goal Linking - Only for SAVINGS and DEBT */}
      {(selectedGroup === 'SAVINGS' || selectedGroup === 'DEBT') && goals.length > 0 && (
        <label className="mt-3 block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Link to {selectedGroup === 'SAVINGS' ? 'Savings' : 'Debt'} Goal (optional)</span>
          <select
            value={selectedGoalId}
            onChange={(event) => setSelectedGoalId(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none transition-colors focus:border-[#10B981]"
          >
            <option value="">— No goal —</option>
            {goals
              .filter((goal) => {
                // Only show active goals matching the transaction type
                if (goal.percent >= 100) return false; // Skip completed goals
                if (selectedGroup === 'SAVINGS') return goal.type === 'SAVINGS';
                if (selectedGroup === 'DEBT') return goal.type === 'DEBT';
                return false;
              })
              .map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name} ({goal.percent}%)
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-[#64748b]">💡 This transaction will {selectedGroup === 'SAVINGS' ? 'add to' : 'reduce'} your goal progress</p>
        </label>
      )}

      {/* Recurring Transaction Toggle */}
      <label className="mt-3 flex items-center gap-3 rounded-xl border border-[#E8EAED] bg-white p-3">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-5 w-5 rounded-md cursor-pointer accent-[#10B981]"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="block text-sm font-semibold text-[#0B0F17]">
              Repeat Monthly
            </span>
            <HelpTooltip
              title="Repeat Monthly"
              content="For recurring expenses like salary, rent, or subscriptions. Each month, a new transaction is created automatically on the same date. Set an end date to stop it, or leave blank to repeat forever."
            />
          </div>
          <p className="text-xs text-[#64748b]">
            {isRecurring ? '📅 This will repeat every month' : '🔄 One-time transaction'}
          </p>
        </div>
      </label>

      {/* Recurring End Date (show only if recurring) */}
      {isRecurring && (
        <label className="mt-3 block">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
            Stop Repeating On <span className="text-xs text-[#64748b] font-normal">(optional)</span>
          </span>
          <input
            type="date"
            value={recurringEndDate}
            onChange={(e) => setRecurringEndDate(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none transition-colors focus:border-[#10B981]"
          />
          <p className="mt-1 text-xs text-[#64748b]">
            Leave blank to repeat forever, or set an end date
          </p>
        </label>
      )}

      <div className="mt-auto pt-5">
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => appendKey(key)}
              aria-label={key === 'backspace' ? 'Delete last digit' : key}
              className="money min-h-[54px] rounded-xl border border-[#E8EAED] bg-white text-lg font-semibold text-[#0B0F17] transition-transform active:scale-[0.98] sm:min-h-[58px]"
            >
              {key === 'backspace' ? '⌫' : key}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={saveTransaction}
          disabled={amountMinor <= 0}
          className="mt-3 min-h-[54px] w-full rounded-xl bg-[#10B981] text-sm font-semibold text-white transition-colors hover:bg-[#059669] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
        >
          Save transaction
        </button>
      </div>
    </section>
  );
}


function SampleDataToggle({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-2 rounded-xl border border-[#E8EAED] bg-white px-3 py-2 text-xs font-semibold text-[#0B0F17] transition-colors hover:bg-[#F6F7F9] active:scale-[0.98]"
      title={enabled ? "Clear sample data" : "Load sample data for testing"}
    >
      {enabled ? (
        <>
          <span>✓ Sample Data</span>
          <X className="h-3.5 w-3.5" />
        </>
      ) : (
        <>
          <span>Load Sample</span>
          <Plus className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  );
}

function CurrencySelector({ currency, onChange }: { currency: CurrencyCode; onChange: (currency: CurrencyCode) => void }) {
  return (
    <label className="relative">
      <span className="sr-only">Display currency</span>
      <select
        value={currency}
        onChange={(event) => onChange(event.target.value as CurrencyCode)}
        className="min-h-10 appearance-none rounded-xl border border-[#E8EAED] bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#0B0F17] outline-none transition-colors hover:border-[#94a3b8] focus:border-[#10B981]"
      >
        {CURRENCIES.map((option) => (
          <option key={option.code} value={option.code}>{option.symbol} {option.code}</option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-[#64748b]" />
    </label>
  );
}

function SyncStatus({ isOnline, unsyncedCount }: { isOnline: boolean; unsyncedCount: number }) {
  if (isOnline && unsyncedCount === 0) return null;

  return (
    <div
      className={`flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold ${
        isOnline ? 'bg-[#FFF7ED] text-[#9A3412]' : 'bg-[#FEF2F2] text-[#B91C1C]'
      }`}
      role="status"
    >
      {isOnline ? <RefreshCw className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">
        {isOnline ? `${unsyncedCount} change${unsyncedCount === 1 ? '' : 's'} waiting to sync` : 'Offline · changes stay on this device'}
      </span>
      <span className="sm:hidden">{isOnline ? `${unsyncedCount} unsynced` : 'Offline'}</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      return detectCurrencyFromLocale();
    } catch {
      return 'USD';
    }
  });
  const [period, setPeriod] = useState(() => new Date(SAMPLE_YEAR, SAMPLE_MONTH, 1));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [notice, setNotice] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showSampleData, setShowSampleData] = useState(false);
  const [isGoalCreationOpen, setIsGoalCreationOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [goals, setGoals] = useState<typeof GOALS>([]);
  const [showDeleteMonthConfirm, setShowDeleteMonthConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [budgetPeriodId, setBudgetPeriodId] = useState<string>('');
  const [budgetTotals, setBudgetTotals] = useState<BudgetGroupTotal[]>([]);
  const [periodSummary, setPeriodSummary] = useState<PeriodSummary | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, router, user]);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(window.navigator.onLine);
    const hydrateClientPreferences = () => {
      const storedCurrency = window.localStorage.getItem('folo-currency') as CurrencyCode | null;
      if (storedCurrency && CURRENCIES.some((option) => option.code === storedCurrency)) setCurrency(storedCurrency);
      updateOnlineStatus();
    };

    // Keyboard shortcut to reset data (Cmd/Ctrl + Shift + R)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (confirm('🗑️  Clear all data from Supabase? This cannot be undone.')) {
          handleResetAllData();
        }
      }
    };

    const hydrationTimer = window.setTimeout(hydrateClientPreferences, 0);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Load transactions and goals from Supabase when user/period changes
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Ensure user profile exists
        await upsertUserProfile(user.id, user.email || '', user.email?.split('@')[0] || 'FOLO user', currency);

        // Load transactions from database
        const dbTransactions = await fetchTransactions(user.id, period);
        setTransactions(dbTransactions);

        // Load goals from database
        const dbGoals = await fetchGoals(user.id);
        setGoals(dbGoals);

        // Load budget period and totals
        const periodId = await getOrCreateBudgetPeriod(user.id, period);
        setBudgetPeriodId(periodId);

        let totals = await getBudgetGroupTotals(user.id, periodId);

        // If new period has no budgets, copy from previous period
        if (!totals || totals.length === 0) {
          const previousMonth = new Date(period.getFullYear(), period.getMonth() - 1, 1);
          try {
            const previousPeriodId = await getOrCreateBudgetPeriod(user.id, previousMonth);
            await copyBudgetsFromPreviousPeriod(user.id, periodId, previousPeriodId);
            // Reload totals after copying
            totals = await getBudgetGroupTotals(user.id, periodId);
          } catch (error) {
            console.error('Error copying budgets from previous period:', error);
            // Continue without copied budgets - user can set them manually
          }
        }

        setBudgetTotals(totals || []);

        const summary = await getPeriodSummary(user.id, periodId);
        setPeriodSummary(summary || null);
      } catch (error) {
        if (isMissingSupabaseRelation(error)) {
          setNotice('Database setup is incomplete. Apply supabase_schema.sql, then reload FOLO.');
          setShowSampleData(false);
          return;
        }

        const errorMsg = describeSupabaseError(error);
        console.error('Failed to load data:', {
          message: errorMsg,
          error: error instanceof Error ? error.message : String(error),
          details: error,
        });
        setNotice(`Error loading data: ${errorMsg || 'Unknown error'}`);
        setShowSampleData(false);
      }
    };

    loadData();
  }, [user, period, currency]);

  function updateCurrency(nextCurrency: CurrencyCode) {
    setCurrency(nextCurrency);
    window.localStorage.setItem('folo-currency', nextCurrency);
  }

  function movePeriod(amount: number) {
    setPeriod((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function returnToSamplePeriod() {
    setPeriod(new Date(SAMPLE_YEAR, SAMPLE_MONTH, 1));
  }

  async function refreshBudgetTotals() {
    if (!user || !budgetPeriodId) return;
    try {
      const totals = await getBudgetGroupTotals(user.id, budgetPeriodId);
      setBudgetTotals(totals || []);
    } catch (error) {
      console.error('Failed to refresh budget totals:', error);
    }
  }

  async function saveTransaction(transaction: Transaction, goalId?: string) {
    try {
      // Save to Supabase first
      const savedTransaction = await saveTransactionToSupabase(user!.id, transaction);

      // If recurring and backdated, create instances for all intermediate months
      let backdatedCount = 0;
      if (transaction.isRecurring) {
        try {
          const result = await createBackdatedRecurringInstances(user!.id, transaction);
          backdatedCount = result.created;
        } catch (backdateError) {
          console.warn('Warning: Failed to create backdated recurring instances:', backdateError);
          // Don't fail the whole save, just warn the user
          if (backdateError instanceof Error && backdateError.message) {
            setNotice(`Transaction saved, but could not create previous months: ${backdateError.message}`);
            return;
          }
        }
      }

      // Link to goal if selected
      if (goalId) {
        await linkTransactionToGoal(user!.id, goalId, savedTransaction.id);

        // Reload goals to update progress
        const updatedGoals = await fetchGoals(user!.id);
        setGoals(updatedGoals);
      }

      // Update local state
      setTransactions((current) => [savedTransaction, ...current]);

      // Refresh budget totals so category actuals stay up to date
      await refreshBudgetTotals();

      // Build notice message
      let notice = goalId ? 'Transaction saved and linked to goal!' : 'Transaction saved successfully.';
      if (backdatedCount > 0) {
        notice += ` Also created ${backdatedCount} recurring instance${backdatedCount === 1 ? '' : 's'} for previous months.`;
        // Navigate to the transaction's month so user can see it immediately
        const txMonth = new Date(transaction.date);
        setPeriod(new Date(txMonth.getFullYear(), txMonth.getMonth(), 1));
      }
      setNotice(notice);
      setActiveTab('activity');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Failed to save transaction:', errorMsg, error);
      setNotice(`Failed to save transaction: ${errorMsg || 'Unknown error'}. Please try again.`);
    }
  }

  async function handleUpdateTransaction(updatedTransaction: Transaction, linkedGoalId?: string) {
    try {
      await updateTransactionInSupabase(user!.id, updatedTransaction.id, updatedTransaction);
      setTransactions((current) =>
        current.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );

      // Link to goal if specified
      if (linkedGoalId) {
        await linkTransactionToGoal(user!.id, linkedGoalId, updatedTransaction.id);
      }

      setEditingTransaction(null);

      // Reload goals and budget totals so progress and category actuals stay current
      const [updatedGoals] = await Promise.all([
        fetchGoals(user!.id),
        refreshBudgetTotals(),
      ]);
      setGoals(updatedGoals);

      setNotice('Transaction updated successfully.');
    } catch (error) {
      console.error('Failed to update transaction:', error);
      setNotice('Failed to update transaction. Please try again.');
    }
  }

  async function handleDeleteTransaction(transactionId: string) {
    try {
      await deleteTransactionFromSupabase(user!.id, transactionId);
      setTransactions((current) => current.filter((t) => t.id !== transactionId));
      setEditingTransaction(null);

      // Reload goals and budget totals so progress and category actuals stay current
      const [updatedGoals] = await Promise.all([
        fetchGoals(user!.id),
        refreshBudgetTotals(),
      ]);
      setGoals(updatedGoals);

      setNotice('Transaction deleted successfully.');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      setNotice('Failed to delete transaction. Please try again.');
    }
  }

  async function handleUpdateGoal(goalId: string, changes: Pick<Goal, 'name' | 'type' | 'targetMinor'>) {
    try {
      const updatedGoal = await updateGoalInSupabase(user!.id, goalId, changes);
      setGoals((current) => current.map((goal) => (goal.id === goalId ? updatedGoal : goal)));
      setEditingGoal(null);
      setNotice('Goal updated successfully.');
    } catch (error) {
      console.error('Failed to update goal:', error);
      setNotice('Failed to update goal. Please try again.');
    }
  }

  async function handleDeleteGoal(goal: Goal) {
    if (!window.confirm(`Delete “${goal.name}”? This cannot be undone.`)) return;

    try {
      await deleteGoalFromSupabase(user!.id, goal.id);
      setGoals((current) => current.filter((item) => item.id !== goal.id));
      setSelectedGoalId((current) => (current === goal.id ? null : current));
      setEditingGoal(null);
      setNotice('Goal deleted successfully.');
    } catch (error) {
      console.error('Failed to delete goal:', error);
      setNotice('Failed to delete goal. Please try again.');
    }
  }

  async function handleAddToSavings(goal: Goal) {
    if (!user) return;

    try {
      // Create a SAVINGS transaction for the goal amount
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        name: `Savings from: ${goal.name}`,
        category: 'General',
        categoryType: 'SAVINGS',
        amountMinor: goal.targetMinor,
        date: new Date().toISOString().split('T')[0],
        note: `Completed goal: ${goal.name}`,
        pending: false,
      };

      // Save transaction to database
      const savedTx = await saveTransactionToSupabase(user.id, transaction);

      // Link transaction to goal
      await linkTransactionToGoal(user.id, goal.id, savedTx.id);

      // Update goal progress
      await updateGoalProgressFromTransactions(user.id, goal.id);

      // Refresh transactions and goals
      const updatedTransactions = await fetchTransactions(user.id, new Date());
      setTransactions(updatedTransactions);

      const updatedGoals = await fetchGoals(user.id);
      setGoals(updatedGoals);

      setNotice(`✅ Added ${formatMoney(goal.targetMinor, currency)} to savings from “${goal.name}”`);
    } catch (error) {
      console.error('Failed to add to savings:', error);
      setNotice('Failed to record savings. Please try again.');
    }
  }

  async function handleResetAllData() {
    try {
      setNotice('Clearing all data...');
      const results = await resetAllUserData(user!.id);
      console.log('Reset results:', results);

      // Reload data
      setTransactions([]);
      setGoals([]);
      setNotice('✅ All data cleared. Dashboard reset.');
    } catch (error) {
      console.error('Failed to reset data:', error);
      setNotice('❌ Failed to clear data. Please try again.');
    }
  }

  async function handleDeleteMonthData() {
    try {
      setNotice('Deleting all transactions for this month...');
      await deleteTransactionsByMonth(user!.id, period);

      // Reload transactions
      const dbTransactions = await fetchTransactions(user!.id, period);
      setTransactions(dbTransactions);

      // Reload goals in case deleted transactions affected progress
      const updatedGoals = await fetchGoals(user!.id);
      setGoals(updatedGoals);

      setNotice(`✅ All transactions for ${formatPeriod(period)} deleted.`);
      setShowDeleteMonthConfirm(false);
    } catch (error) {
      console.error('Failed to delete month data:', error);
      setNotice('❌ Failed to delete month data. Please try again.');
      setShowDeleteMonthConfirm(false);
    }
  }

  async function handleSignOut() {
    const result = await signOut();
    if (!result.error) router.push('/login');
  }

  function handleExportData() {
    try {
      const userName = user?.email?.split('@')[0] || 'User';
      const exportDate = new Date().toLocaleString();

      exportDataToExcel({
        transactions,
        goals,
        budgetTotals,
        userName,
        exportDate,
      });

      setNotice('✅ Data exported successfully!');
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Failed to export data:', error);
      setNotice('Failed to export data. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9]">
        <div className="text-center" role="status">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#B7E8D4] border-b-[#10B981]" />
          <p className="mt-3 text-sm font-medium text-[#475569]">Loading FOLO…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleTransactionClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const isBudgeted = period.getFullYear() === SAMPLE_YEAR && period.getMonth() === SAMPLE_MONTH;
  const userInitial = user.email?.charAt(0).toUpperCase() || 'F';
  const activeTitle = NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? 'Add transaction';

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#0B0F17]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-[#E8EAED] bg-white px-3 py-5 lg:flex">
        <div className="flex items-center gap-2.5 px-2 pb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#10B981] text-white">
            <BarChart3 className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold tracking-[-0.025em]">FOLO</span>
        </div>

        <nav className="space-y-1" aria-label="Dashboard navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#F1F5F3] font-semibold text-[#0B0F17]' : 'text-[#475569] hover:bg-[#F6F7F9]'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#F0F2F4] pt-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-[#F6F7F9] transition-colors"
              aria-label="User profile menu"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B0F17] text-xs font-semibold text-white">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-semibold">{user.email?.split('@')[0] || 'FOLO user'}</p>
                <p className="mt-0.5 text-[10px] font-medium text-[#64748b]">{getCurrency(currency).symbol} · {currency}</p>
              </div>
            </button>

            {showProfileMenu && (
              <>
                <div className="absolute inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-2 z-50 w-full rounded-xl border border-[#E8EAED] bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportData();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[#047857] hover:bg-[#E7F7F0] transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Export Data to Excel
                  </button>
                  <div className="border-t border-[#F0F2F4]" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowDeleteAllConfirm(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete All Data
                  </button>
                  <div className="border-t border-[#F0F2F4]" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[#475569] hover:bg-[#F6F7F9] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[240px]">
        {activeTab !== 'add' ? (
          <header className="sticky top-0 z-20 border-b border-[#E8EAED] bg-white/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-3 px-3 sm:px-5 lg:px-8">
              <div className="flex min-w-0 items-center gap-1 sm:gap-3">
                <h1 className="hidden text-base font-semibold tracking-[-0.02em] lg:block">{activeTitle}</h1>
                <button
                  type="button"
                  onClick={() => movePeriod(-1)}
                  aria-label="Previous month"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#475569] hover:bg-[#F6F7F9]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0B0F17]">{formatPeriod(period)}</p>
                  <p className="hidden text-[10px] font-medium text-[#64748b] sm:block">{formatPeriodRange(period)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => movePeriod(1)}
                  aria-label="Next month"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#475569] hover:bg-[#F6F7F9]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteMonthConfirm(true)}
                  aria-label="Delete all transactions for this month"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#475569] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-colors"
                  title="Delete all transactions for this month"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <SyncStatus isOnline={isOnline} unsyncedCount={unsyncedCount} />
                <SampleDataToggle enabled={showSampleData} onChange={setShowSampleData} />
                <CurrencySelector currency={currency} onChange={updateCurrency} />
                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="hidden min-h-10 items-center gap-2 rounded-xl bg-[#10B981] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#059669] lg:flex"
                >
                  <Plus className="h-4 w-4" />
                  Add transaction
                </button>
                <div className="relative lg:hidden">
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B0F17] text-xs font-semibold text-white hover:bg-[#1F2937] transition-colors"
                    aria-label="User profile menu"
                  >
                    {userInitial}
                  </button>

                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <div className="absolute top-full right-0 mt-2 z-50 min-w-[200px] rounded-xl border border-[#E8EAED] bg-white shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            handleExportData();
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[#047857] hover:bg-[#E7F7F0] transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Export Data to Excel
                        </button>
                        <div className="border-t border-[#F0F2F4]" />
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowDeleteAllConfirm(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete All Data
                        </button>
                        <div className="border-t border-[#F0F2F4]" />
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleSignOut();
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[#475569] hover:bg-[#F6F7F9] transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>
        ) : null}

        <main className={activeTab === 'add' ? '' : 'pb-24 lg:pb-0'}>
          {activeTab === 'home' ? (
            <OverviewScreen
              currency={currency}
              transactions={transactions}
              setActiveTab={setActiveTab}
              isBudgeted={isBudgeted}
              period={period}
              onReturnToSample={returnToSamplePeriod}
              onTransactionClick={handleTransactionClick}
              goals={goals}
              userId={user.id}
              budgetPeriodId={budgetPeriodId}
              budgetTotals={budgetTotals}
              periodSummary={periodSummary}
            />
          ) : null}
          {activeTab === 'budget' ? (
            <BudgetScreen
              currency={currency}
              showSampleData={showSampleData}
              userId={user.id}
              budgetPeriodId={budgetPeriodId}
              onNotice={setNotice}
              transactions={transactions}
            />
          ) : null}
          {activeTab === 'activity' ? (
            <ActivityScreen
              currency={currency}
              transactions={transactions}
              isBudgeted={isBudgeted}
              period={period}
              onReturnToSample={returnToSamplePeriod}
              onTransactionClick={handleTransactionClick}
            />
          ) : null}
          {activeTab === 'goals' ? <GoalsScreen currency={currency} showSampleData={showSampleData} selectedGoalId={selectedGoalId} onSelectGoal={setSelectedGoalId} onCreateGoalClick={() => setIsGoalCreationOpen(true)} onEditGoal={setEditingGoal} onDeleteGoal={handleDeleteGoal} onAddToSavings={handleAddToSavings} goals={goals} /> : null}
          {activeTab === 'reports' ? (
            transactions.length > 0 ? <ReportsScreen currency={currency} showSampleData={showSampleData} transactions={transactions} budgetGroups={budgetTotals} /> : <PeriodEmpty period={period} onReturn={returnToSamplePeriod} />
          ) : null}
          {activeTab === 'add' ? (
            <AddScreen
              currency={currency}
              isOnline={isOnline}
              onClose={() => setActiveTab('home')}
              onSave={saveTransaction}
              goals={goals}
              userId={user.id}
            />
          ) : null}
        </main>
      </div>

      {activeTab !== 'add' ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#E8EAED] bg-white px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 lg:hidden" aria-label="Mobile navigation">
          {[
            { id: 'home' as const, label: 'Home', icon: Home },
            { id: 'budget' as const, label: 'Budget', icon: WalletCards },
            { id: 'add' as const, label: 'Add', icon: Plus },
            { id: 'activity' as const, label: 'Activity', icon: ReceiptText },
            { id: 'goals' as const, label: 'Goals', icon: Target },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAdd = item.id === 'add';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium"
              >
                <span
                  className={`flex items-center justify-center ${
                    isAdd ? 'h-10 w-10 -translate-y-2 rounded-xl bg-[#10B981] text-white shadow-[0_6px_18px_rgba(16,185,129,0.3)]' : ''
                  }`}
                >
                  <Icon className={isAdd ? 'h-5 w-5' : `h-5 w-5 ${isActive ? 'text-[#0B0F17]' : 'text-[#64748b]'}`} />
                </span>
                <span className={`${isAdd ? '-mt-2' : ''} ${isActive ? 'font-semibold text-[#0B0F17]' : 'text-[#64748b]'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      ) : null}

      {notice ? (
        <div className="fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl bg-[#0B0F17] px-4 py-3 text-sm text-white shadow-xl lg:bottom-6" role="status">
          {isOnline ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6EE7B7]" /> : <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-[#FCA5A5]" />}
          <span>{notice}</span>
        </div>
      ) : null}

      <TransactionEditSheet
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
        currency={currency}
        availableGoals={goals.map((g) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          targetMinor: g.targetMinor,
          progressMinor: g.progressMinor,
          percent: g.percent,
        }))}
      />

      <GoalCreationSheet
        isOpen={isGoalCreationOpen}
        onClose={() => setIsGoalCreationOpen(false)}
        onCreateGoal={async (goal) => {
          try {
            const newGoal = await createGoalInSupabase(user!.id, goal);
            setGoals((current) => [newGoal, ...current]);
            setIsGoalCreationOpen(false);
            setNotice(`Goal "${newGoal.name}" created successfully!`);
          } catch (error) {
            console.error('Failed to create goal:', error);
            setNotice('Failed to create goal. Please try again.');
          }
        }}
        currency={currency}
      />

      <GoalEditSheet
        goal={editingGoal}
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        onUpdate={handleUpdateGoal}
        onDelete={handleDeleteGoal}
        currency={currency}
      />

      {/* Delete Month Confirmation */}
      {showDeleteMonthConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl border border-[#E8EAED] bg-white p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-[#0B0F17]">Delete All Transactions?</h3>
            <p className="mt-2 text-sm text-[#64748b]">
              This will permanently delete all transactions recorded in <strong>{formatPeriod(period)}</strong>. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteMonthConfirm(false)}
                className="flex-1 rounded-xl border border-[#E8EAED] py-2 font-semibold text-[#0B0F17] hover:bg-[#F6F7F9]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMonthData}
                className="flex-1 rounded-xl bg-[#ef4444] py-2 font-semibold text-white hover:bg-[#dc2626]"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl border border-[#E8EAED] bg-white p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-[#0B0F17]">Delete All Data for This Profile?</h3>
            <p className="mt-2 text-sm text-[#64748b]">
              This will permanently delete <strong>all transactions, budgets, and goals</strong> for your profile. Everything will be reset to zero and ready for fresh manual input. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 rounded-xl border border-[#E8EAED] py-2 font-semibold text-[#0B0F17] hover:bg-[#F6F7F9]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteAllConfirm(false);
                  handleResetAllData();
                }}
                className="flex-1 rounded-xl bg-[#ef4444] py-2 font-semibold text-white hover:bg-[#dc2626]"
              >
                Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
import { GoalCreationSheet } from '@/components/dashboard/GoalCreationSheet';
import { TransactionEditSheet } from '@/components/dashboard/TransactionEditSheet';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  saveTransaction as saveTransactionToSupabase,
  fetchTransactions,
  updateTransaction as updateTransactionInSupabase,
  deleteTransaction as deleteTransactionFromSupabase,
  upsertUserProfile,
} from '@/lib/transaction-operations';
import {
  createGoal as createGoalInSupabase,
  fetchGoals,
} from '@/lib/goal-operations';
import { resetAllUserData } from '@/lib/reset-user-data';
import {
  BUDGET_GROUPS,
  CATEGORY_MAP,
  CREDIT_CARD_TYPES,
  INSURANCE_TYPES,
  UTILITY_TYPES,
  detectCurrencyFromLocale,
  CURRENCIES,
  EXPENSE_ITEMS,
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
  onTouchStart = () => {},
  onTouchEnd = () => {}
}: {
  transaction: Transaction;
  currency: CurrencyCode;
  isLast?: boolean;
  onTouchStart?: (id: string) => void;
  onTouchEnd?: (transaction: Transaction) => void;
}) {
  const isIncome = transaction.amountMinor > 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-[#F9FAFB] ${isLast ? '' : 'border-b border-[#F0F2F4]'}`}
      onTouchStart={() => onTouchStart(transaction.id)}
      onTouchEnd={() => onTouchEnd(transaction)}
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
  onTransactionTouchStart = () => {},
  onTransactionTouchEnd = () => {},
  goals = [],
}: {
  currency: CurrencyCode;
  transactions: Transaction[];
  setActiveTab: (tab: DashboardTab) => void;
  isBudgeted: boolean;
  period: Date;
  onReturnToSample: () => void;
  showSampleData?: boolean;
  onTransactionTouchStart?: (id: string) => void;
  onTransactionTouchEnd?: (transaction: Transaction) => void;
  goals?: typeof GOALS;
}) {
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

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] lg:gap-4">
        <article className="rounded-2xl border border-[#E8EAED] bg-white p-5 sm:col-span-2 lg:col-span-1 lg:border-[#0B0F17] lg:bg-[#0B0F17]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b] lg:text-[#94a3b8]">Left to spend</p>
            <span className="text-xs font-medium text-[#64748b] lg:text-[#94a3b8]">16 days left</span>
          </div>
          <Money
            amountMinor={transactions.reduce((sum, t) => sum + (t.categoryType === 'INCOME' ? t.amountMinor : -t.amountMinor), 0)}
            currency={currency}
            className="mt-3 block text-[34px] font-semibold leading-none tracking-[-0.04em] text-[#0B0F17] lg:text-white"
          />
          <p className="money mt-3 text-xs text-[#64748b] lg:text-[#94a3b8]">
            planned {formatMoney(180_000, currency)} · {formatMoney(48_500, currency)} under
          </p>
        </article>

        {[
          { label: 'Income', value: 920_000, detail: `of ${formatMoney(950_000, currency)} expected` },
          { label: 'Spent', value: 593_500, detail: `${formatMoney(18_500, currency)} over budget`, critical: true },
          { label: 'Saved + paid', value: 245_000, detail: `${formatMoney(150_000, currency)} saved · ${formatMoney(95_000, currency)} debt` },
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
            <div>
              <h2 className="text-sm font-semibold text-[#0B0F17]">Budget pulse</h2>
              <p className="mt-1 text-xs text-[#64748b]">Actual against plan by group</p>
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
            {BUDGET_GROUPS.filter((group) => group.type !== 'INCOME').map((group) => {
              const isOver = group.actualMinor > group.budgetMinor;
              return (
                <div key={group.type}>
                  <div className="mb-2 flex items-baseline justify-between gap-4">
                    <span className="text-sm font-medium text-[#0B0F17]">{group.name}</span>
                    <span className={`money text-xs font-medium ${isOver ? 'text-[#DC2626]' : 'text-[#475569]'}`}>
                      {formatMoney(group.actualMinor, currency)}{' '}
                      <span className="text-[#64748b]">/ {formatMoney(group.budgetMinor, currency)}</span>
                    </span>
                  </div>
                  <Meter percent={group.percent} isOver={isOver} />
                </div>
              );
            })}
          </div>
        </article>

        <div className="grid gap-5">
          <article className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white">
            <div className="flex items-center justify-between px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-sm font-semibold text-[#0B0F17]">Recent activity</h2>
                <p className="mt-1 text-xs text-[#64748b]">Latest transactions</p>
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
                  onTouchStart={onTransactionTouchStart}
                  onTouchEnd={onTransactionTouchEnd}
                />
              ))
            ) : (
              <div className="border-t border-[#F0F2F4] px-5 py-8 text-center text-sm text-[#475569]">No transactions yet.</div>
            )}
          </article>

          <article className="rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0B0F17]">Goals</h2>
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
}: {
  currency: CurrencyCode;
  showSampleData?: boolean;
}) {
  if (!showSampleData) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0B0F17]">Master Your Budget</h2>
          <p className="mt-2 text-sm text-[#64748b]">Learn how to create powerful budgets and take control of your money</p>
        </div>
        <BudgetTips />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">{formatPeriod(new Date())}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#0B0F17]">Budget</h2>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5">
        {[
          { label: 'Budgeted', value: 820000 },
          { label: 'Actual', value: 838500 },
          { label: 'Variance', value: 18500, critical: true },
        ].map((item, index) => (
          <div key={item.label} className={index === 0 ? '' : 'border-l border-[#F0F2F4] pl-3 sm:pl-5'}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.07em] text-[#64748b] sm:text-[10px]">{item.label}</p>
            <Money
              amountMinor={item.value}
              currency={currency}
              showPlus={item.critical}
              className={`mt-2 block text-sm font-semibold sm:text-lg ${item.critical ? 'text-[#DC2626]' : 'text-[#0B0F17]'}`}
            />
            {item.critical ? <p className="mt-1 text-[10px] font-semibold text-[#DC2626]">over plan</p> : null}
          </div>
        ))}
      </div>


      <BudgetChart currency={currency} />

      <div className="mt-5 space-y-3">
        {BUDGET_GROUPS.map((group) => {
          const isOver = group.actualMinor > group.budgetMinor;
          const variance = group.actualMinor - group.budgetMinor;
          return (
            <article key={group.type} className="rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0B0F17]">{group.name}</h3>
                  <p className={`money mt-1 text-[11px] font-medium ${isOver ? 'text-[#DC2626]' : 'text-[#475569]'}`}>
                    {variance > 0
                      ? `${formatMoney(variance, currency, { showPlus: true })} over plan`
                      : variance < 0
                        ? `${formatMoney(variance, currency)} under plan`
                        : '0 on plan'}
                  </p>
                </div>
                <span className={`money text-xs font-semibold ${isOver ? 'text-[#DC2626]' : 'text-[#0B0F17]'}`}>
                  {formatMoney(group.actualMinor, currency)}{' '}
                  <span className="font-normal text-[#64748b]">/ {formatMoney(group.budgetMinor, currency)}</span>
                </span>
              </div>
              <div className="mt-3">
                <Meter percent={group.percent} isOver={isOver} />
              </div>

              {group.type === 'EXPENSES' ? (
                <div className="mt-5 border-t border-[#F0F2F4] pt-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Expense categories</p>
                  <div className="space-y-4">
                    {EXPENSE_ITEMS.map((item) => {
                      const itemOver = item.actualMinor > item.budgetMinor;
                      return (
                        <div key={item.name}>
                          <div className="mb-2 flex items-baseline justify-between gap-3">
                            <span className="text-xs font-medium text-[#475569]">{item.name}</span>
                            <span className={`money text-[11px] ${itemOver ? 'font-semibold text-[#DC2626]' : 'text-[#475569]'}`}>
                              {formatMoney(item.actualMinor, currency)} / {formatMoney(item.budgetMinor, currency)}
                            </span>
                          </div>
                          <Meter percent={item.percent} isOver={itemOver} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ActivityScreen({
  currency,
  transactions,
  isBudgeted,
  period,
  onReturnToSample,
  onTransactionTouchStart = () => {},
  onTransactionTouchEnd = () => {},
}: {
  currency: CurrencyCode;
  transactions: Transaction[];
  isBudgeted: boolean;
  period: Date;
  onReturnToSample: () => void;
  onTransactionTouchStart?: (id: string) => void;
  onTransactionTouchEnd?: (transaction: Transaction) => void;
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
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">September 2026</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#0B0F17]">Activity</h2>
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
                    onTouchStart={onTransactionTouchStart}
                    onTouchEnd={onTransactionTouchEnd}
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
  onSelect = () => {} 
}: { 
  goal: Goal; 
  currency: CurrencyCode;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const isComplete = goal.percent >= 100;
  const status = goal.type === 'DEBT' ? 'Cleared' : 'Achieved';
  const remaining = Math.max(goal.targetMinor - goal.progressMinor, 0);

  return (
    <article 
      className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
        isSelected 
          ? 'border-[#10B981] bg-[#F0FDF9] shadow-lg' 
          : 'border-[#E8EAED] bg-white hover:border-[#10B981] hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isSelected ? 'bg-[#10B981] text-white' : 'bg-[#F1F5F3] text-[#10B981]'
          }`} aria-hidden="true">
            {getGoalIcon(goal.icon)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[#0B0F17]">{goal.name}</h3>
            <p className="mt-1 text-xs text-[#64748b]">{goal.detail}</p>
          </div>
        </div>
        {isSelected ? (
          <div className="flex shrink-0 gap-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); alert('Edit coming soon'); }}
              className="flex items-center gap-1.5 rounded-lg bg-[#10B981] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#059669] transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); alert('Delete coming soon'); }}
              className="flex items-center gap-1.5 rounded-lg bg-[#ef4444] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#dc2626] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        ) : isComplete ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#E7F7F0] px-2.5 py-1 text-[11px] font-semibold text-[#065F46]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {status}
          </span>
        ) : (
          <span className="money shrink-0 text-xs font-semibold text-[#475569]">{goal.percent}%</span>
        )}
      </div>
      <div className="mt-4">
        <Meter percent={goal.percent} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 text-[11px]">
        <span className="money font-medium text-[#475569]">
          {formatMoney(goal.progressMinor, currency)} / {formatMoney(goal.targetMinor, currency)}
        </span>
        <span className={`money ${isComplete ? 'font-semibold text-[#065F46]' : 'text-[#64748b]'}`}>
          {isComplete ? status : `${formatMoney(remaining, currency)} to go`}
        </span>
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
  goals = []
}: {
  currency: CurrencyCode;
  showSampleData?: boolean;
  selectedGoalId?: string | null;
  onSelectGoal?: (goalId: string) => void;
  onCreateGoalClick?: () => void;
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

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">2 of 5 complete</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#0B0F17]">Goals</h2>
      </div>

      <div className="grid grid-cols-3 rounded-2xl border border-[#E8EAED] bg-white p-4 sm:p-5">
        {[
          { label: 'Target', value: 8900000 },
          { label: 'Saved / paid', value: 3915000, accent: true },
          { label: 'To go', value: 4985000 },
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
}: {
  currency: CurrencyCode;
  isOnline: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}) {
  const [amount, setAmount] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<CategoryType>('EXPENSES');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_MAP['EXPENSES'][0]);
  const [selectedInsuranceType, setSelectedInsuranceType] = useState(INSURANCE_TYPES[0]);
  const [selectedUtilityType, setSelectedUtilityType] = useState(UTILITY_TYPES[0]);
  const [selectedCreditCardType, setSelectedCreditCardType] = useState(CREDIT_CARD_TYPES[0]);
  const [selectedDate, setSelectedDate] = useState(localDateValue);
  const [note, setNote] = useState('');

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

    onSave({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `transaction-${Date.now()}`,
      name: (selectedCategory === 'Insurance' ? `${selectedInsuranceType} - ${note.trim()}` : selectedCategory === 'Utilities' ? `${selectedUtilityType} - ${note.trim()}` : selectedCategory === 'Credit Card' ? `${selectedCreditCardType} - ${note.trim()}` : note.trim()) || selectedCategory,
      category: selectedCategory,
      categoryType: selectedGroup,
      amountMinor: selectedGroup === 'INCOME' ? amountMinor : -amountMinor,
      date: selectedDate,
      note: note.trim() || undefined,
      pending: !isOnline,
    });
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
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Date</span>
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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [touchStart, setTouchStart] = useState<{ id: string; time: number } | null>(null);
  const [goals, setGoals] = useState<typeof GOALS>([]);

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
      } catch (error) {
        console.error('Failed to load data:', error);
        // Show sample data on error
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

  async function saveTransaction(transaction: Transaction) {
    try {
      // Save to Supabase first
      await saveTransactionToSupabase(user!.id, transaction);

      // Update local state
      setTransactions((current) => [transaction, ...current]);
      setNotice('Transaction saved successfully.');
      setActiveTab('activity');
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setNotice('Failed to save transaction. Please try again.');
    }
  }

  async function handleUpdateTransaction(updatedTransaction: Transaction) {
    try {
      await updateTransactionInSupabase(user!.id, updatedTransaction.id, updatedTransaction);
      setTransactions((current) =>
        current.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );
      setEditingTransaction(null);
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
      setNotice('Transaction deleted successfully.');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      setNotice('Failed to delete transaction. Please try again.');
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

  async function handleSignOut() {
    const result = await signOut();
    if (!result.error) router.push('/login');
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

  const handleTransactionTouchStart = (transactionId: string) => {
    setTouchStart({ id: transactionId, time: Date.now() });
  };

  const handleTransactionTouchEnd = (transaction: Transaction) => {
    if (!touchStart) return;
    const duration = Date.now() - touchStart.time;

    // Long-press: > 500ms
    if (duration > 500) {
      setEditingTransaction(transaction);
    }
    setTouchStart(null);
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
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B0F17] text-xs font-semibold text-white">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{user.email?.split('@')[0] || 'FOLO user'}</p>
              <p className="mt-0.5 text-[10px] font-medium text-[#64748b]">{getCurrency(currency).symbol} · {currency}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-[#64748b] hover:bg-[#F6F7F9] hover:text-[#0B0F17]"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B0F17] text-xs font-semibold text-white lg:hidden">
                  {userInitial}
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
              onTransactionTouchStart={handleTransactionTouchStart}
              onTransactionTouchEnd={handleTransactionTouchEnd}
              goals={goals}
            />
          ) : null}
          {activeTab === 'budget' ? (
            <BudgetScreen currency={currency} showSampleData={showSampleData} />
          ) : null}
          {activeTab === 'activity' ? (
            <ActivityScreen
              currency={currency}
              transactions={transactions}
              isBudgeted={isBudgeted}
              period={period}
              onReturnToSample={returnToSamplePeriod}
              onTransactionTouchStart={handleTransactionTouchStart}
              onTransactionTouchEnd={handleTransactionTouchEnd}
            />
          ) : null}
          {activeTab === 'goals' ? <GoalsScreen currency={currency} showSampleData={showSampleData} selectedGoalId={selectedGoalId} onSelectGoal={setSelectedGoalId} onCreateGoalClick={() => setIsGoalCreationOpen(true)} goals={goals} /> : null}
          {activeTab === 'reports' ? (
            showSampleData ? <ReportsScreen currency={currency} showSampleData={showSampleData} /> : <PeriodEmpty period={period} onReturn={returnToSamplePeriod} />
          ) : null}
          {activeTab === 'add' ? (
            <AddScreen
              currency={currency}
              isOnline={isOnline}
              onClose={() => setActiveTab('home')}
              onSave={saveTransaction}
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
    </div>
  );
}

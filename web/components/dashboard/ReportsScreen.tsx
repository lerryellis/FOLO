'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, FileBarChart, Grid3x3, List } from 'lucide-react';
import type { CurrencyCode, Transaction } from '@/lib/folo-data';
import { formatMoney, getCurrency } from '@/lib/folo-data';
import {
  calculateSpendingByCategory,
  calculateBudgetVariance,
  calculateNetPosition,
  calculatePeriodSummary,
} from '@/lib/reports-calculations';
import { HelpTooltip } from './HelpTooltip';
import { CircularBudgetChart } from './CircularBudgetChart';

import type { BudgetGroupTotal } from '@/lib/budget-operations';

interface ReportsScreenProps {
  currency: CurrencyCode;
  showSampleData?: boolean;
  transactions?: Transaction[];
  budgetGroups?: BudgetGroupTotal[];
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <section className="mx-auto flex min-h-96 w-full max-w-4xl items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0FDF9]">
          <Icon className="h-8 w-8 text-[#10B981]" />
        </div>
        <h2 className="text-lg font-semibold text-[#0B0F17]">{title}</h2>
        <p className="mt-2 text-sm text-[#64748b]">{description}</p>
      </div>
    </section>
  );
}

interface NetDotProps {
  cx?: number;
  cy?: number;
  payload?: { netMinor: number };
}

function NetDot({ cx = 0, cy = 0, payload }: NetDotProps) {
  const isNegative = (payload?.netMinor ?? 0) < 0;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#FFFFFF"
      stroke={isNegative ? '#ef4444' : '#10B981'}
      strokeWidth={2}
    />
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeIsPositive?: boolean;
  helpTitle?: string;
  helpContent?: string;
}

function StatCard({ label, value, change, changeIsPositive, helpTitle, helpContent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-[#E8EAED] bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-[#64748b]">{label}</p>
          <p className="mt-2 text-lg font-semibold text-[#0B0F17]">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${changeIsPositive ? 'text-[#10B981]' : 'text-[#ef4444]'}`}>
              {changeIsPositive ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        {helpTitle && helpContent && (
          <HelpTooltip title={helpTitle} content={helpContent} />
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, helpTitle, helpContent }: { title: string; subtitle: string; helpTitle?: string; helpContent?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-[#0B0F17]">{title}</h3>
        <p className="mt-1 text-xs text-[#64748b]">{subtitle}</p>
      </div>
      {helpTitle && helpContent && (
        <HelpTooltip title={helpTitle} content={helpContent} />
      )}
    </div>
  );
}

export function ReportsScreen({ currency, showSampleData = false, transactions = [], budgetGroups = [] }: ReportsScreenProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('list');
  const currencySymbol = getCurrency(currency).symbol;

  // Show empty state if no transactions
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={FileBarChart}
        title="No reports yet"
        description="Add transactions to see spending insights and detailed reports."
      />
    );
  }

  // Calculate report data from transactions
  const spendingByCategory = calculateSpendingByCategory(transactions);
  const budgetVariance = calculateBudgetVariance(transactions, budgetGroups);
  const netPosition = calculateNetPosition(transactions);
  const summary = calculatePeriodSummary(transactions);

  // Calculate summary statistics
  const totalIncome = transactions
    .filter(t => t.categoryType === 'INCOME')
    .reduce((sum, t) => sum + t.amountMinor, 0);

  const totalExpenses = transactions
    .filter(t => ['BILLS', 'EXPENSES'].includes(t.categoryType))
    .reduce((sum, t) => sum + t.amountMinor, 0);

  const totalSavings = transactions
    .filter(t => t.categoryType === 'SAVINGS')
    .reduce((sum, t) => sum + t.amountMinor, 0);

  const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
  const savingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

  // Budget performance: calculate percentage on budget
  const totalBudgeted = budgetGroups.reduce((sum, g) => sum + g.budgeted, 0);
  const budgetHealth = totalBudgeted > 0 ? Math.round(((totalBudgeted - totalExpenses) / totalBudgeted) * 100) : 0;

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      {/* Header */}
      <div className="mb-7 flex items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">September 2026</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#0B0F17]">Reports & Analytics</h2>
          </div>
          <HelpTooltip
            title="Reports & Analytics"
            content="Visual breakdown of your spending, income, savings, and budget performance this month. Hover over charts for details, toggle between chart and list views."
          />
        </div>
        <p className="hidden text-xs text-[#64748b] sm:block">Your financial insights at a glance</p>
      </div>

      {/* Summary Statistics Section */}
      <div className="mb-7">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.05em] text-[#64748b]">Financial Overview</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Income"
            value={formatMoney(totalIncome, currency)}
            helpTitle="Total Income"
            helpContent="All income transactions received this period from all sources (salary, freelance, etc.)"
          />
          <StatCard
            label="Total Expenses"
            value={formatMoney(totalExpenses, currency)}
            helpTitle="Total Expenses"
            helpContent="Sum of bills and expenses spent this period across all categories"
          />
          <StatCard
            label="Savings This Month"
            value={formatMoney(totalSavings, currency)}
            change={`${savingsRate}% of income`}
            changeIsPositive={savingsRate > 0}
            helpTitle="Savings Rate"
            helpContent="Percentage of income allocated to savings goals and debt repayment"
          />
          <StatCard
            label="Remaining Balance"
            value={formatMoney(summary.netMinor, currency)}
            change={budgetHealth > 0 ? `${budgetHealth}% under budget` : `${Math.abs(budgetHealth)}% over budget`}
            changeIsPositive={budgetHealth > 0}
            helpTitle="Cash Position"
            helpContent="Income minus all expenses and savings this period"
          />
        </div>
      </div>

      {/* Spending Analysis Section */}
      <div className="mb-7 rounded-[14px] border border-[#E8EAED] bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <SectionHeader
            title="Spending by Category"
            subtitle="Where your money went this month"
            helpTitle="Category Breakdown"
            helpContent="Shows actual spending across all expense categories, sorted by amount. Bars are colored to show relative magnitude — darker shades indicate higher spending."
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                viewMode === 'chart'
                  ? 'bg-[#0B0F17] text-white'
                  : 'bg-[#F6F7F9] text-[#475569] hover:bg-[#E8EAED]'
              }`}
              aria-label="Chart view"
              title="Circular chart view"
            >
              <Grid3x3 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#0B0F17] text-white'
                  : 'bg-[#F6F7F9] text-[#475569] hover:bg-[#E8EAED]'
              }`}
              aria-label="List view"
              title="List/bar chart view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {viewMode === 'chart' ? (
          <div className="h-[400px] w-full" aria-label="Circular budget chart of spending by category">
            <CircularBudgetChart
              data={spendingByCategory.map((cat, idx) => ({
                id: `cat-${idx}`,
                label: cat.name,
                color: cat.fill,
                value: (cat.amountMinor / totalExpenses) * 100,
                amount: cat.amountMinor,
              }))}
              totalAmount={totalExpenses}
              currency={currency}
            />
          </div>
        ) : (
          <>
            <div className="h-[330px] w-full" aria-label="Horizontal bar chart of spending by category">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingByCategory} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                  <CartesianGrid horizontal={false} stroke="#F0F2F4" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(value: number) => formatMoney(value, currency, { includeSymbol: false }).replace('.00', '')}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={104}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#F6F7F9' }}
                    formatter={(value) => [formatMoney(Number(value), currency), 'Actual']}
                    contentStyle={{ border: '1px solid #E8EAED', borderRadius: 10, boxShadow: '0 8px 24px rgba(11,15,23,0.08)' }}
                    labelStyle={{ color: '#0B0F17', fontWeight: 600 }}
                  />
                  <Bar dataKey="amountMinor" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {spendingByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-xs text-[#64748b]">
              💡 <strong>Insight:</strong> {spendingByCategory[0]?.name} is your largest expense category, accounting for {
                ((spendingByCategory[0]?.amountMinor || 0) / totalExpenses * 100).toFixed(0)
              }% of total spending.
            </p>
          </>
        )}
      </div>

      {/* Budget Performance Section */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[14px] border border-[#E8EAED] bg-white p-4 sm:p-5">
          <SectionHeader
            title="Budget Performance"
            subtitle="Actual vs planned spending"
            helpTitle="Over/Under Analysis"
            helpContent="Shows how much each spending group is over or under budget. Green = under budget (good), Red = over budget (exceeded limit), Gray = on target."
          />
          <div className="h-[300px] w-full" aria-label="Diverging bar chart of budget variance">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVariance} layout="vertical" margin={{ top: 4, right: 16, bottom: 12, left: 0 }}>
                <CartesianGrid horizontal={false} stroke="#F0F2F4" />
                <XAxis
                  type="number"
                  domain={[-30_000, 30_000]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(value: number) => formatMoney(value, currency, { includeSymbol: false }).replace('.00', '')}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={68}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 11 }}
                />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Tooltip
                  cursor={{ fill: '#F6F7F9' }}
                  formatter={(value) => {
                    const amount = Number(value);
                    const label = amount > 0 ? 'Over plan' : amount < 0 ? 'Under plan' : 'On plan';
                    return [formatMoney(amount, currency, { showPlus: true }), label];
                  }}
                  contentStyle={{ border: '1px solid #E8EAED', borderRadius: 10, boxShadow: '0 8px 24px rgba(11,15,23,0.08)' }}
                  labelStyle={{ color: '#0B0F17', fontWeight: 600 }}
                />
                <Bar dataKey="varianceMinor" radius={4} maxBarSize={22}>
                  {budgetVariance.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.varianceMinor > 0 ? '#ef4444' : entry.varianceMinor < 0 ? '#10B981' : '#CBD5E1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.07em] text-[#64748b]">
            <span>− under budget</span>
            <span>0 on target</span>
            <span>+ over budget</span>
          </div>
        </div>

        {/* Key Metrics Panel */}
        <div className="space-y-3">
          <div className="rounded-[14px] border border-[#E8EAED] bg-white p-4 sm:p-5">
            <h4 className="flex items-center justify-between text-sm font-semibold text-[#0B0F17]">
              Budget Health Score
              <HelpTooltip
                title="Budget Health"
                content="Percentage of budgeted amount remaining. 100% means you're exactly on track; positive means you're under budget (saved money)."
              />
            </h4>
            <div className="mt-4">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#E8EAED]">
                <div
                  className={`h-full ${budgetHealth > 0 ? 'bg-[#10B981]' : 'bg-[#ef4444]'}`}
                  style={{ width: `${Math.max(0, Math.min(100, budgetHealth + 50))}%` }}
                />
              </div>
              <p className={`mt-2 text-sm font-semibold ${budgetHealth > 0 ? 'text-[#10B981]' : 'text-[#ef4444]'}`}>
                {budgetHealth > 0 ? '✓' : '⚠'} {budgetHealth}% {budgetHealth > 0 ? 'under' : 'over'} budget
              </p>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#E8EAED] bg-white p-4 sm:p-5">
            <h4 className="flex items-center justify-between text-sm font-semibold text-[#0B0F17]">
              Expense Ratio
              <HelpTooltip
                title="Expense Ratio"
                content="Percentage of income spent on bills and expenses. Lower is better — leaves more for savings."
              />
            </h4>
            <p className="mt-3 text-2xl font-semibold text-[#0B0F17]">{expenseRatio}%</p>
            <p className="mt-2 text-xs text-[#64748b]">
              {expenseRatio < 60 ? '💰 Excellent ratio — strong savings capacity' :
               expenseRatio < 80 ? '📊 Moderate ratio — room for optimization' :
               '⚠️ High ratio — review spending patterns'}
            </p>
          </div>
        </div>
      </div>

      {/* Trends Section */}
      <article className="mt-7 rounded-[14px] border border-[#E8EAED] bg-white p-4 sm:p-5">
        <SectionHeader
          title="Cash Flow Trends"
          subtitle="Net position over the last 6 months"
          helpTitle="Net Position Trend"
          helpContent="Shows your monthly net position (income minus all outflows). Positive values mean money left over; negative means you spent more than earned."
        />
        <div className="mt-5 h-[280px] w-full" aria-label="Line chart of net position by month">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netPosition} margin={{ top: 8, right: 18, bottom: 4, left: 8 }}>
              <CartesianGrid vertical={false} stroke="#F0F2F4" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={64}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(value: number) => formatMoney(value, currency, { includeSymbol: false }).replace('.00', '')}
              />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Tooltip
                formatter={(value) => [formatMoney(Number(value), currency, { showPlus: true }), 'Net position']}
                contentStyle={{ border: '1px solid #E8EAED', borderRadius: 10, boxShadow: '0 8px 24px rgba(11,15,23,0.08)' }}
                labelStyle={{ color: '#0B0F17', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="netMinor"
                stroke="#10B981"
                strokeWidth={2}
                dot={<NetDot />}
                activeDot={{ r: 5, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 rounded-lg bg-[#F0FDF9] p-3">
          <p className="text-xs text-[#047857]">
            <strong>Trend Analysis:</strong> Your current net position is <strong>{formatMoney(summary.netMinor, currency)}</strong>. This is the income minus all expenses. Compare it with previous months to identify spending patterns and plan ahead.
          </p>
        </div>
      </article>
    </section>
  );
}

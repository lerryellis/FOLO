'use client';

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
import {
  NET_POSITION,
  PLAN_VARIANCE,
  SPENDING_BY_CATEGORY,
  type CurrencyCode,
  formatMoney,
  getCurrency,
} from '@/lib/folo-data';

interface ReportsScreenProps {
  currency: CurrencyCode;
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

function PanelHeading({ title, subtitle, trailing }: { title: string; subtitle: string; trailing?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-[#0B0F17]">{title}</h3>
        <p className="mt-1 text-xs text-[#64748b]">{subtitle}</p>
      </div>
      {trailing ? <span className="money text-xs font-semibold text-[#475569]">{trailing}</span> : null}
    </div>
  );
}

export function ReportsScreen({ currency }: ReportsScreenProps) {
  const currencySymbol = getCurrency(currency).symbol;

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">September 2026</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#0B0F17]">Reports</h2>
        </div>
        <p className="hidden text-xs text-[#64748b] sm:block">Three signals. No chart clutter.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-[14px] border border-[#E8EAED] bg-white p-4 sm:p-5">
          <PanelHeading
            title="Where the money went"
            subtitle="Actual spend by category · sorted high to low"
            trailing={currencySymbol}
          />
          <div className="mt-5 h-[330px] w-full" aria-label="Horizontal bar chart of spending by category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPENDING_BY_CATEGORY} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
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
                  {SPENDING_BY_CATEGORY.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[14px] border border-[#E8EAED] bg-white p-4 sm:p-5">
          <PanelHeading title="Over and under plan" subtitle="Actual minus budgeted, by group" />
          <div className="mt-5 h-[330px] w-full" aria-label="Diverging bar chart of budget variance">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PLAN_VARIANCE} layout="vertical" margin={{ top: 4, right: 16, bottom: 12, left: 0 }}>
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
                  {PLAN_VARIANCE.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.varianceMinor > 0 ? '#ef4444' : entry.varianceMinor < 0 ? '#10B981' : '#CBD5E1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.07em] text-[#64748b]">
            <span>− under</span>
            <span>0 on plan</span>
            <span>+ over</span>
          </div>
        </article>
      </div>

      <article className="mt-5 rounded-[14px] border border-[#E8EAED] bg-white p-4 sm:p-5">
        <PanelHeading
          title="Net position by month"
          subtitle="Income minus everything out · last 6 completed periods"
          trailing={`${formatMoney(81_500, currency, { showPlus: true })} this month`}
        />
        <div className="mt-5 h-[280px] w-full" aria-label="Line chart of net position by month">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={NET_POSITION} margin={{ top: 8, right: 18, bottom: 4, left: 8 }}>
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
      </article>
    </section>
  );
}

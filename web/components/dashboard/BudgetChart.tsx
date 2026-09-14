'use client';

import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { BUDGET_GROUPS, type CurrencyCode, getCurrency } from '@/lib/folo-data';

interface BudgetChartProps {
  currency: CurrencyCode;
}

export function BudgetChart({ currency }: BudgetChartProps) {
  const currencySymbol = getCurrency(currency).symbol;

  // Chart data: budgeted vs actual for each group
  const data = BUDGET_GROUPS.map((group) => ({
    name: group.name,
    Budgeted: group.budgetMinor / 100,
    Actual: group.actualMinor / 100,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-[#E8EAED] bg-white p-3 shadow-md">
          <p className="text-xs font-semibold text-[#0B0F17]">{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="money text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}: {currencySymbol}
              {entry.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full rounded-2xl border border-[#E8EAED] bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-[#0B0F17]">Budget vs Actual</h3>
        <p className="mt-1 text-xs text-[#64748b]">Compare your planned budget with actual spending by category</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#E8EAED' }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#E8EAED' }}
            label={{
              value: `Amount (${currencySymbol})`,
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#64748b', fontSize: 12 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
          />
          <Bar
            dataKey="Budgeted"
            fill="#10B981"
            radius={[8, 8, 0, 0]}
            opacity={0.8}
          />
          <Bar
            dataKey="Actual"
            fill="#0B0F17"
            radius={[8, 8, 0, 0]}
            opacity={0.6}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: '#10B981' }}></div>
          <span className="text-[#64748b]">Budgeted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: '#0B0F17' }}></div>
          <span className="text-[#64748b]">Actual</span>
        </div>
      </div>
    </div>
  );
}

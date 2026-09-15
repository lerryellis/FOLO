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
import { type CurrencyCode, getCurrency } from '@/lib/folo-data';

interface BudgetChartProps {
  currency: CurrencyCode;
  groups: Array<{ category_type: string; budgeted: number; actual: number }>;
}

export function BudgetChart({ currency, groups }: BudgetChartProps) {
  const currencySymbol = getCurrency(currency).symbol;

  const names: Record<string, string> = {
    INCOME: 'Income',
    BILLS: 'Bills',
    EXPENSES: 'Expenses',
    SAVINGS: 'Savings',
    DEBT: 'Debt',
  };
  const data = groups.map((group) => ({
    name: names[group.category_type] ?? group.category_type,
    Budgeted: Number(group.budgeted) || 0,
    Actual: Number(group.actual) || 0,
  }));

  return (
    <div className="w-full rounded-2xl border border-[#E8EAED] bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-[-0.01em] text-[#0B0F17]">Budget vs Actual</h3>
        <p className="mt-1 text-xs text-[#64748b]">Compare your planned budget with actual spending by category</p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-[#E8EAED] bg-[#FAFBFC] px-6 text-center">
          <p className="text-sm text-[#64748b]">No budget data exists for this period yet.</p>
        </div>
      ) : (
      <>
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
          <Tooltip />
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
      </>
      )}
    </div>
  );
}

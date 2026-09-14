'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CashflowData {
  month: string;
  earnings: number;
  spent: number;
}

interface CashflowCardProps {
  data: CashflowData[];
  totalEarnings: number;
  totalSpent: number;
  netCashflow: number;
}

export function CashflowCard({ data, totalEarnings, totalSpent, netCashflow }: CashflowCardProps) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-6">Cashflow Trend</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                formatter={(value) => `$${Number(value).toFixed(2)}`}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                name="Earnings"
              />
              <Line
                type="monotone"
                dataKey="spent"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                name="Spent"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="space-y-4">
          {/* Total Earnings */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-green-400">${totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-1">This month</p>
          </div>

          {/* Total Spent */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-red-400">${totalSpent.toFixed(2)}</p>
            <p className="text-xs text-red-600 mt-1">This month</p>
          </div>

          {/* Net Cashflow */}
          <div className={`rounded-lg p-4 ${netCashflow >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
            <p className="text-sm text-gray-400 mb-1">Net Cashflow</p>
            <p className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${netCashflow.toFixed(2)}
            </p>
            <p className={`text-xs mt-1 ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netCashflow >= 0 ? 'Positive' : 'Negative'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

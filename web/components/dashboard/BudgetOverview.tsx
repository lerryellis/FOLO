'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#06b6d4', '#ec4899', '#f97316', '#8b5cf6', '#10b981'];

interface BudgetData {
  name: string;
  value: number;
  percentage: number;
}

interface BudgetOverviewProps {
  data: BudgetData[];
  totalBudget: number;
  totalSpent: number;
}

export function BudgetOverview({ data, totalBudget, totalSpent }: BudgetOverviewProps) {
  const remainingBudget = totalBudget - totalSpent;
  const percentageSpent = ((totalSpent / totalBudget) * 100).toFixed(1);

  return (
    <div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-6">Budget Overview</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `$${Number(value).toFixed(2)}`}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-sm text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="space-y-4">
          {/* Budget Spent */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Budget Spent</p>
            <p className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">of ${totalBudget.toFixed(2)}</p>
            <div className="mt-3 h-2 bg-slate-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-pink-500"
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Remaining Budget */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Remaining Budget</p>
            <p className="text-3xl font-bold text-green-400">${remainingBudget.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {percentageSpent}% of budget spent
            </p>
          </div>

          {/* Category Breakdown */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-3">Top Categories</p>
            <div className="space-y-2">
              {data.slice(0, 3).map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-300">{category.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    ${category.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

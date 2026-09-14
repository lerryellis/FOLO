'use client';

interface Goal {
  id: string;
  name: string;
  type: 'SAVINGS' | 'DEBT';
  targetAmount: number;
  currentProgress: number;
  deadline?: string;
}

interface FinancialGoalsCardProps {
  goals: Goal[];
}

export function FinancialGoalsCard({ goals }: FinancialGoalsCardProps) {
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (type: string) => {
    return type === 'SAVINGS' ? 'from-green-500 to-emerald-500' : 'from-blue-500 to-cyan-500';
  };

  const getGoalIcon = (type: string) => {
    return type === 'SAVINGS' ? '🏦' : '💳';
  };

  return (
    <div className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-6">Financial Goals</h2>

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No financial goals yet</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const percentage = getProgressPercentage(goal.currentProgress, goal.targetAmount);
            const remaining = goal.targetAmount - goal.currentProgress;

            return (
              <div key={goal.id} className="bg-slate-700/50 rounded-lg p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{getGoalIcon(goal.type)}</span>
                    {goal.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      goal.type === 'SAVINGS'
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-blue-900/50 text-blue-300'
                    }`}
                  >
                    {goal.type}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getProgressColor(goal.type)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span>Progress</span>
                    <span className="font-semibold">${goal.currentProgress.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Target</span>
                    <span className="font-semibold">${goal.targetAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 pt-1 border-t border-slate-600">
                    <span>Remaining</span>
                    <span className="font-semibold text-cyan-400">
                      ${Math.max(remaining, 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Percentage */}
                <div className="mt-3 text-center">
                  <p className="text-lg font-bold text-cyan-400">{percentage.toFixed(0)}%</p>
                </div>

                {/* Deadline */}
                {goal.deadline && (
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    By {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

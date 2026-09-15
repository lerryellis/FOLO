'use client';

import { formatMoney } from '@/lib/folo-data';
import type { CurrencyCode } from '@/lib/folo-data';
import { getMonthLabel, calculateSavingsRate } from '@/lib/monthly-achievements';
import type { MonthlyAchievement } from '@/lib/monthly-achievements';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AchievementHistoryProps {
  achievements: MonthlyAchievement[];
  currency: CurrencyCode;
}

export function AchievementHistory({ achievements, currency }: AchievementHistoryProps) {
  if (achievements.length === 0) {
    return null;
  }

  const totalSavings = achievements.reduce((sum, a) => sum + a.savingsMinor, 0);
  const positiveMonths = achievements.filter((a) => a.savingsMinor > 0).length;

  return (
    <section className="mt-8 rounded-2xl border border-[#E8EAED] bg-white p-5 sm:p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#0B0F17]">Savings History</h3>
            <p className="mt-1 text-xs text-[#64748b]">
              Your monthly savings achievements
            </p>
          </div>
          <div className="rounded-lg bg-[#F0FDF9] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#065F46]">
              Total Saved
            </p>
            <p className="mt-1 font-bold text-[#047857]">
              {formatMoney(totalSavings, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[#F0FDF9] p-3">
          <p className="text-[10px] font-semibold text-[#065F46]">Positive Months</p>
          <p className="mt-1 text-lg font-bold text-[#047857]">{positiveMonths}/{achievements.length}</p>
        </div>
        <div className="rounded-lg bg-[#FEF2F2] p-3">
          <p className="text-[10px] font-semibold text-[#DC2626]">Average Savings</p>
          <p className="mt-1 text-lg font-bold text-[#DC2626]">
            {formatMoney(Math.round(totalSavings / achievements.length), currency)}
          </p>
        </div>
      </div>

      {/* Achievement Cards */}
      <div className="space-y-2">
        {achievements.map((achievement) => {
          const isSavingsPositive = achievement.savingsMinor > 0;
          const savingsRate = calculateSavingsRate(achievement.incomeMinor, achievement.savingsMinor);

          return (
            <div
              key={achievement.id}
              className={`rounded-lg border p-3 transition-colors ${
                isSavingsPositive
                  ? 'border-[#10B981] bg-[#F0FDF9]'
                  : 'border-[#FEE2E2] bg-[#FEF2F2]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Month & Savings */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0B0F17]">
                    {getMonthLabel(achievement.month)}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#64748b]">
                    <span>
                      {formatMoney(achievement.incomeMinor, currency)} income
                    </span>
                    <span>−</span>
                    <span>
                      {formatMoney(achievement.expensesMinor, currency)} spent
                    </span>
                  </div>
                </div>

                {/* Savings Amount & Icon */}
                <div className="flex items-end gap-2">
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        isSavingsPositive ? 'text-[#047857]' : 'text-[#DC2626]'
                      }`}
                    >
                      {formatMoney(Math.abs(achievement.savingsMinor), currency)}
                    </p>
                    <p className="text-[10px] text-[#64748b]">
                      {savingsRate}%
                    </p>
                  </div>
                  {isSavingsPositive ? (
                    <TrendingUp className="h-5 w-5 text-[#10B981]" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-[#EF4444]" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivational Message */}
      {positiveMonths > 0 && (
        <div className="mt-4 rounded-lg bg-[#FEF3C7] p-3">
          <p className="text-xs font-medium text-[#92400E]">
            💡 You've had {positiveMonths} month{positiveMonths > 1 ? 's' : ''} of positive savings! Keep it up! 🎯
          </p>
        </div>
      )}
    </section>
  );
}

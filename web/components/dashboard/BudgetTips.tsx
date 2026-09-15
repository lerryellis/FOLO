'use client';

import { BarChart3, Lightbulb, TrendingUp, Sparkles } from 'lucide-react';
import { BUDGET_EDUCATION } from '@/lib/folo-data';

export function BudgetTips() {
  return (
    <div className="space-y-4">
      {/* Why Budget */}
      <article className="rounded-2xl border border-[#E8EAED] bg-gradient-to-br from-[#F0FDF9] to-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F7F0]">
            <BarChart3 className="h-5 w-5 text-[#10B981]" />
          </div>
          <h3 className="font-semibold text-[#0B0F17]">{BUDGET_EDUCATION.whyBudget.title}</h3>
        </div>
        <ul className="space-y-2 text-sm text-[#475569]">
          {BUDGET_EDUCATION.whyBudget.tips.slice(0, 2).map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#10B981]">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </article>

      {/* Allocation Strategy */}
      <article className="rounded-2xl border border-[#E8EAED] bg-gradient-to-br from-[#FFF7ED] to-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7]">
            <Lightbulb className="h-5 w-5 text-[#D97706]" />
          </div>
          <h3 className="font-semibold text-[#0B0F17]">{BUDGET_EDUCATION.allocationStrategy.title}</h3>
        </div>
        <p className="mb-3 text-xs text-[#64748b]">{BUDGET_EDUCATION.allocationStrategy.method}</p>
        <div className="space-y-2">
          {BUDGET_EDUCATION.allocationStrategy.breakdown.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-white p-2.5">
              <div>
                <p className="text-xs font-semibold text-[#0B0F17]">{item.category}</p>
                <p className="text-[10px] text-[#64748b]">{item.description}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F6F7F9]">
                <span className="text-xs font-bold text-[#10B981]">{item.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Actual vs Budget */}
      <article className="rounded-2xl border border-[#E8EAED] bg-gradient-to-br from-[#EFF6FF] to-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DBEAFE]">
            <TrendingUp className="h-5 w-5 text-[#3B82F6]" />
          </div>
          <h3 className="font-semibold text-[#0B0F17]">{BUDGET_EDUCATION.actualVsBudget.title}</h3>
        </div>
        <p className="mb-3 text-sm text-[#475569]">{BUDGET_EDUCATION.actualVsBudget.explanation}</p>
        <ul className="space-y-1.5 text-xs text-[#475569]">
          {BUDGET_EDUCATION.actualVsBudget.tips.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#10B981]">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </article>

      {/* Best Practices */}
      <article className="rounded-2xl border border-[#E8EAED] bg-gradient-to-br from-[#F3E8FF] to-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E8FF]">
            <Sparkles className="h-5 w-5 text-[#A855F7]" />
          </div>
          <h3 className="font-semibold text-[#0B0F17]">{BUDGET_EDUCATION.bestPractices.title}</h3>
        </div>
        <ul className="space-y-1.5 text-xs text-[#475569]">
          {BUDGET_EDUCATION.bestPractices.tips.slice(0, 3).map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#10B981]">✓</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

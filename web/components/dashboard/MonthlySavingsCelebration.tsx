'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, Sparkles } from 'lucide-react';
import { formatMoney } from '@/lib/folo-data';
import type { CurrencyCode } from '@/lib/folo-data';
import { getMonthLabel, calculateSavingsRate } from '@/lib/monthly-achievements';

interface MonthlySavingsCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  monthLabel: string;
  savingsMinor: number;
  incomeMinor: number;
  expensesMinor: number;
  currency: CurrencyCode;
}

export function MonthlySavingsCelebration({
  isOpen,
  onClose,
  monthLabel,
  savingsMinor,
  incomeMinor,
  expensesMinor,
  currency,
}: MonthlySavingsCelebrationProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const savingsRate = calculateSavingsRate(incomeMinor, savingsMinor);
  const isSavingsPositive = savingsMinor > 0;

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after modal opens
      setTimeout(() => setShowAnimation(true), 100);
    } else {
      setShowAnimation(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Celebration Modal */}
      <div
        className={`relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-[#10B981] bg-gradient-to-br from-[#F0FDF9] to-white p-6 shadow-2xl transition-all duration-500 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#E0FDF5]"
        >
          <X className="h-5 w-5 text-[#64748b]" />
        </button>

        {/* Celebration Content */}
        <div className="text-center">
          {/* Celebration Icon with Animation */}
          <div className="mb-4 flex justify-center">
            <div
              className={`relative transition-all duration-700 ${
                showAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
            >
              <div className="text-6xl animate-bounce">🎉</div>
              <Sparkles className="absolute -right-4 -top-4 h-8 w-8 text-[#10B981] animate-spin" />
            </div>
          </div>

          {/* Header */}
          <h2 className="text-2xl font-bold text-[#0B0F17]">Great Work! 🌟</h2>
          <p className="mt-2 text-sm text-[#64748b]">
            Here's your financial summary for <span className="font-semibold text-[#047857]">{monthLabel}</span>
          </p>

          {/* Stats Cards */}
          <div className="mt-6 space-y-3">
            {/* Income Card */}
            <div className="rounded-xl bg-white p-4 border border-[#E8EAED]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Income</p>
              <p className="mt-2 text-2xl font-bold text-[#0B0F17]">
                {formatMoney(incomeMinor, currency)}
              </p>
            </div>

            {/* Expenses Card */}
            <div className="rounded-xl bg-white p-4 border border-[#E8EAED]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Expenses</p>
              <p className="mt-2 text-2xl font-bold text-[#EF4444]">
                {formatMoney(expensesMinor, currency)}
              </p>
            </div>

            {/* Savings Card - Highlighted */}
            <div
              className={`rounded-xl p-4 border-2 transition-all duration-500 ${
                isSavingsPositive
                  ? 'border-[#10B981] bg-[#F0FDF9]'
                  : 'border-[#EF4444] bg-[#FEF2F2]'
              } ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                    {isSavingsPositive ? '💰 Amount Saved' : '⚠️ Shortfall'}
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${
                    isSavingsPositive ? 'text-[#047857]' : 'text-[#DC2626]'
                  }`}>
                    {formatMoney(Math.abs(savingsMinor), currency)}
                  </p>
                </div>
                {isSavingsPositive && (
                  <TrendingUp className="h-12 w-12 text-[#10B981] opacity-50" />
                )}
              </div>
            </div>
          </div>

          {/* Savings Rate */}
          {isSavingsPositive && (
            <div className="mt-4 rounded-lg bg-[#E7F7F0] p-3">
              <p className="text-sm font-semibold text-[#065F46]">
                ✨ You saved <span className="text-lg">{savingsRate}%</span> of your income
              </p>
            </div>
          )}

          {/* Motivational Message */}
          <p className="mt-6 text-sm text-[#475569]">
            {isSavingsPositive ? (
              <>
                Amazing effort! Keep up the great financial discipline. Every month of positive savings
                brings you closer to your goals. 🚀
              </>
            ) : (
              <>
                This month was a challenge, but that's okay. Review your expenses and adjust your budget
                for next month. You've got this! 💪
              </>
            )}
          </p>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-[#10B981] py-3 font-semibold text-white transition-colors hover:bg-[#059669] active:scale-[0.98]"
          >
            Continue
          </button>
        </div>

        {/* Confetti Animation */}
        {showAnimation && isSavingsPositive && <Confetti />}
      </div>
    </div>
  );
}

/**
 * Confetti particles component
 */
function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
  }));

  return (
    <div className="pointer-events-none fixed inset-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="animate-pulse absolute h-2 w-2 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: '-10px',
            backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'][particle.id % 4],
            animation: `fall ${particle.duration}s linear ${particle.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, Check, Clock } from 'lucide-react';
import type { Transaction, Goal, CurrencyCode } from '@/lib/folo-data';
import { formatMoney } from '@/lib/folo-data';
import {
  calculateMonthSettlement,
  settleMonthSurplus,
  settleMonthDebt,
} from '@/lib/month-settlement';

export interface MonthSettlementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSettled: () => void;
  transactions: Transaction[];
  goals: Goal[];
  period: Date;
  userId: string;
  budgetPeriodId: string;
  currency: CurrencyCode;
  isAlreadySettled: boolean;
}

function formatPeriodLabel(date: Date) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
}

export function MonthSettlementSheet({
  isOpen,
  onClose,
  onSettled,
  transactions,
  goals,
  period,
  userId,
  budgetPeriodId,
  currency,
  isAlreadySettled,
}: MonthSettlementSheetProps) {
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const periodLabel = formatPeriodLabel(period);
  const settlement = calculateMonthSettlement(transactions);
  const { incomeMinor, billsExpensesMinor, savingsMinor, remainderMinor, isSurplus, isDebt } = settlement;

  const savingsGoals = goals.filter((g) => g.type === 'SAVINGS' && g.percent < 100);

  async function handleSurplus() {
    if (!selectedGoalId) {
      setError('Please select a savings goal.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await settleMonthSurplus(userId, budgetPeriodId, selectedGoalId, remainderMinor);
      onSettled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Settlement failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDebt() {
    setIsLoading(true);
    setError('');
    try {
      await settleMonthDebt(userId, budgetPeriodId, periodLabel, remainderMinor);
      onSettled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Settlement failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full lg:max-w-lg animate-in slide-in-from-bottom lg:slide-in-from-center duration-300 rounded-t-3xl lg:rounded-2xl border border-[#E8EAED] bg-white p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0B0F17]">Settle {periodLabel}</h2>
            <p className="mt-0.5 text-xs text-[#64748b]">Review and close out this month</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#F6F7F9] text-[#64748b]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Already settled badge */}
        {isAlreadySettled && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[#F0FDF9] border border-[#10B981] px-4 py-3">
            <Check className="h-5 w-5 text-[#10B981] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#065F46]">Month Settled</p>
              <p className="text-xs text-[#047857]">This month has already been settled.</p>
            </div>
          </div>
        )}

        {/* Breakdown card */}
        <div className="rounded-2xl border border-[#E8EAED] bg-white divide-y divide-[#F0F2F4] mb-5">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#475569]">Income</span>
            <span className="text-sm font-semibold text-[#047857]">{formatMoney(incomeMinor, currency)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#475569]">Bills &amp; Expenses</span>
            <span className="text-sm font-semibold text-[#0B0F17]">−{formatMoney(billsExpensesMinor, currency)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#475569]">Savings allocated</span>
            <span className="text-sm font-semibold text-[#64748b]">−{formatMoney(savingsMinor, currency)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 rounded-b-2xl bg-[#F8F9FB]">
            <span className="text-sm font-semibold text-[#0B0F17]">Net remaining</span>
            <span
              className={`text-base font-bold ${
                remainderMinor > 0 ? 'text-[#047857]' : remainderMinor < 0 ? 'text-[#ef4444]' : 'text-[#0B0F17]'
              }`}
            >
              {remainderMinor >= 0 ? '' : '−'}{formatMoney(Math.abs(remainderMinor), currency)}
            </span>
          </div>
        </div>

        {/* Actions — only if not yet settled */}
        {!isAlreadySettled && (
          <>
            {isSurplus && (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#F0FDF9] border border-[#10B981] px-4 py-3">
                  <p className="text-sm font-semibold text-[#065F46]">
                    You have {formatMoney(remainderMinor, currency)} left. Send it to savings?
                  </p>
                  <p className="mt-1 text-xs text-[#047857]">Select a savings goal to allocate this surplus.</p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">Savings Goal</span>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
                  >
                    <option value="">— Choose a goal —</option>
                    {savingsGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.percent}%)
                      </option>
                    ))}
                  </select>
                </label>

                {error && <p className="text-xs text-[#ef4444]">{error}</p>}

                <button
                  type="button"
                  onClick={handleSurplus}
                  disabled={isLoading}
                  className="w-full min-h-12 rounded-xl bg-[#10B981] text-sm font-semibold text-white transition-colors hover:bg-[#059669] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving…' : 'Add to Savings Goal'}
                </button>
              </div>
            )}

            {isDebt && (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#FEF2F2] border border-[#ef4444] px-4 py-3">
                  <p className="text-sm font-semibold text-[#991B1B]">
                    ⚠ You spent more than you earned this month.
                  </p>
                  <p className="mt-1 text-xs text-[#DC2626]">
                    A debt goal of {formatMoney(Math.abs(remainderMinor), currency)} will be created for {periodLabel}.
                  </p>
                </div>

                {error && <p className="text-xs text-[#ef4444]">{error}</p>}

                <button
                  type="button"
                  onClick={handleDebt}
                  disabled={isLoading}
                  className="w-full min-h-12 rounded-xl bg-[#ef4444] text-sm font-semibold text-white transition-colors hover:bg-[#dc2626] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating…' : 'Create Debt Goal'}
                </button>
              </div>
            )}

            {!isSurplus && !isDebt && (
              <div className="rounded-xl bg-[#F0FDF9] border border-[#10B981] px-4 py-3 text-center">
                <p className="text-sm font-semibold text-[#065F46]">Perfectly balanced!</p>
                <p className="mt-1 text-xs text-[#047857]">Your income exactly covered all expenses and savings this month.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

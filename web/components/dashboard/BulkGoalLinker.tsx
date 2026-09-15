'use client';

import { useState } from 'react';
import { X, Link as LinkIcon, CheckCircle } from 'lucide-react';
import type { Transaction, CurrencyCode } from '@/lib/folo-data';
import { formatMoney } from '@/lib/folo-data';
import { linkTransactionToGoal } from '@/lib/goal-transaction-operations';

interface Goal {
  id: string;
  name: string;
  type: 'SAVINGS' | 'DEBT';
  targetMinor: number;
  progressMinor: number;
  percent: number;
}

interface BulkGoalLinkerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  goals: Goal[];
  currency: CurrencyCode;
  userId?: string;
  onLinked?: () => void;
}

export function BulkGoalLinker({
  isOpen,
  onClose,
  transactions,
  goals,
  currency,
  userId,
  onLinked,
}: BulkGoalLinkerProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);

  if (!isOpen) return null;

  // Filter to eligible transactions (DEBT/SAVINGS only)
  const eligibleTransactions = transactions.filter(
    (tx) => tx.categoryType === 'DEBT' || tx.categoryType === 'SAVINGS'
  );

  // Filter goals by selected transaction types
  const selectedTxTypes = new Set(
    Array.from(selectedTransactions)
      .map((id) => eligibleTransactions.find((tx) => tx.id === id)?.categoryType)
      .filter(Boolean)
  );

  const compatibleGoals = goals.filter(
    (goal) =>
      selectedTxTypes.size === 0 ||
      (selectedTxTypes.has('DEBT') && goal.type === 'DEBT') ||
      (selectedTxTypes.has('SAVINGS') && goal.type === 'SAVINGS')
  );

  const handleSelectTransaction = (txId: string) => {
    const newSet = new Set(selectedTransactions);
    if (newSet.has(txId)) {
      newSet.delete(txId);
    } else {
      newSet.add(txId);
    }
    setSelectedTransactions(newSet);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === eligibleTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(eligibleTransactions.map((tx) => tx.id)));
    }
  };

  const handleLink = async () => {
    if (!userId || !selectedGoal || selectedTransactions.size === 0) {
      setError('Please select at least one transaction and a goal');
      return;
    }

    try {
      setLinking(true);
      setError(null);

      // Link each selected transaction to the goal
      for (const txId of selectedTransactions) {
        await linkTransactionToGoal(
          userId,
          selectedGoal,
          txId
        );
      }

      setLinked(true);
      setTimeout(() => {
        onLinked?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link transactions');
    } finally {
      setLinking(false);
    }
  };

  if (linked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative rounded-2xl border border-[#E8EAED] bg-white p-8 max-w-sm">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-12 w-12 text-[#10B981] mb-4" />
            <h3 className="text-lg font-semibold text-[#0B0F17]">
              Linked {selectedTransactions.size} Transaction{selectedTransactions.size === 1 ? '' : 's'}
            </h3>
            <p className="mt-2 text-sm text-[#64748b]">
              Your transactions are now linked to {selectedGoal && goals.find((g) => g.id === selectedGoal)?.name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0B0F17]">Link Transactions to Goal</h2>
            <p className="mt-1 text-sm text-[#64748b]">Bulk link multiple transactions at once</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F6F7F9]"
          >
            <X className="h-5 w-5 text-[#64748b]" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Transaction Selection */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-[#0B0F17]">
              Select Transactions ({selectedTransactions.size} selected)
            </label>
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-[#10B981] hover:text-[#059669]"
            >
              {selectedTransactions.size === eligibleTransactions.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {eligibleTransactions.length === 0 ? (
              <p className="text-sm text-[#64748b]">No DEBT or SAVINGS transactions available</p>
            ) : (
              eligibleTransactions.map((tx) => (
                <label
                  key={tx.id}
                  className="flex items-center gap-3 rounded-lg border border-[#E8EAED] p-3 cursor-pointer hover:bg-[#F6F7F9] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTransactions.has(tx.id)}
                    onChange={() => handleSelectTransaction(tx.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B0F17] truncate">{tx.name}</p>
                    <p className="text-xs text-[#64748b]">{tx.date}</p>
                  </div>
                  <p className="text-sm font-semibold text-[#0B0F17] shrink-0">
                    {formatMoney(Math.abs(tx.amountMinor), currency)}
                  </p>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Goal Selection */}
        <div className="mb-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Target Goal</span>
            <select
              value={selectedGoal || ''}
              onChange={(e) => setSelectedGoal(e.target.value || null)}
              className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
            >
              <option value="">Choose a goal...</option>
              {compatibleGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name} ({goal.percent}% complete)
                </option>
              ))}
            </select>
            {compatibleGoals.length === 0 && selectedTransactions.size > 0 && (
              <p className="mt-2 text-xs text-[#ef4444]">
                No compatible goals for selected transactions
              </p>
            )}
          </label>
        </div>

        {/* Summary */}
        {selectedTransactions.size > 0 && selectedGoal && (
          <div className="mb-6 rounded-lg bg-[#F0FDF9] p-4 border border-[#10B981]">
            <p className="text-sm font-semibold text-[#047857]">
              Will link {selectedTransactions.size} transaction{selectedTransactions.size === 1 ? '' : 's'} totaling{' '}
              {formatMoney(
                Array.from(selectedTransactions).reduce((sum, txId) => {
                  const tx = eligibleTransactions.find((t) => t.id === txId);
                  return sum + (tx ? Math.abs(tx.amountMinor) : 0);
                }, 0),
                currency
              )}{' '}
              to {goals.find((g) => g.id === selectedGoal)?.name}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 min-h-12 rounded-xl border border-[#E8EAED] bg-white font-semibold text-[#0B0F17] transition-colors hover:bg-[#F6F7F9]"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={linking || selectedTransactions.size === 0 || !selectedGoal}
            className="flex-1 min-h-12 rounded-xl bg-[#10B981] font-semibold text-white transition-colors hover:bg-[#059669] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LinkIcon className="h-4 w-4" />
            Link Transactions
          </button>
        </div>
      </div>
    </div>
  );
}

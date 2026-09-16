'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { getCurrency, parseAmountToMinor, type Transaction } from '@/lib/folo-data';
import type { CurrencyCode } from '@/lib/folo-data';

interface Goal {
  id: string;
  name: string;
  type: 'SAVINGS' | 'DEBT';
  targetMinor: number;
  progressMinor: number;
  percent: number;
}

interface TransactionEditSheetProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (transaction: Transaction, linkedGoalId?: string) => void;
  onDelete: (transactionId: string) => void;
  currency: CurrencyCode;
  availableGoals?: Goal[];
}

export function TransactionEditSheet({
  transaction,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  currency,
  availableGoals = [],
}: TransactionEditSheetProps) {
  if (!isOpen || !transaction) return null;

  return (
    <TransactionEditForm
      key={transaction.id}
      transaction={transaction}
      onClose={onClose}
      onDelete={onDelete}
      onUpdate={onUpdate}
      currency={currency}
      availableGoals={availableGoals}
    />
  );
}

function TransactionEditForm({
  transaction,
  onClose,
  onUpdate,
  onDelete,
  currency,
  availableGoals = [],
}: Omit<TransactionEditSheetProps, 'isOpen'> & { transaction: Transaction; availableGoals: Goal[] }) {
  const [editData, setEditData] = useState<Transaction>(transaction);
  const [amount, setAmount] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Suggest compatible goals based on transaction type
  const suggestedGoals = availableGoals.filter((goal) => {
    if (transaction.categoryType === 'DEBT') return goal.type === 'DEBT';
    if (transaction.categoryType === 'SAVINGS') return goal.type === 'SAVINGS';
    return false;
  });

  const currencySymbol = getCurrency(currency).symbol;

  // Check if transaction is from a different month (warning for user)
  const txDate = new Date(editData.date);
  const today = new Date();
  const isFromDifferentMonth =
    txDate.getFullYear() !== today.getFullYear() ||
    txDate.getMonth() !== today.getMonth();

  const handleUpdateTransaction = () => {
    const updatedTransaction = { ...editData };

    // Only update amount if user entered a new value
    if (amount.trim()) {
      const amountMinor = parseAmountToMinor(amount);
      if (amountMinor <= 0) {
        alert('Amount must be greater than 0');
        return;
      }
      updatedTransaction.amountMinor = editData.categoryType === 'INCOME' ? amountMinor : -amountMinor;
    }

    onUpdate(updatedTransaction, selectedGoalId || undefined);
    onClose();
  };

  const handleDelete = () => {
    onDelete(transaction.id);
    onClose();
  };

  const appendKey = (key: string) => {
    if (key === 'backspace') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => (prev || '0') + '.');
      }
    } else {
      setAmount((prev) => (prev === '0' ? key : prev + key));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 overflow-y-auto rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0B0F17]">Edit Transaction</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F6F7F9]"
          >
            <X className="h-5 w-5 text-[#64748b]" />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4">
          {/* Amount Display */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Amount</span>
            <div className="min-h-12 rounded-xl border border-[#E8EAED] bg-white px-3 py-2 text-right">
              <span className="text-2xl font-semibold text-[#0B0F17]">
                {currencySymbol}
                <span className="money">
                  {amount
                    ? (parseAmountToMinor(amount) / 100).toLocaleString('en', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : (Math.abs(editData.amountMinor) / 100).toLocaleString('en', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </span>
              </span>
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
              <button
                key={key}
                onClick={() => appendKey(key)}
                className="money min-h-12 rounded-xl border border-[#E8EAED] bg-white font-semibold text-[#0B0F17] transition-transform active:scale-[0.98] hover:bg-[#F6F7F9]"
              >
                {key === 'backspace' ? '⌫' : key}
              </button>
            ))}
          </div>

          {/* Edit Date */}
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Date</span>
            <input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
              className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
            />
            <p className="mt-2 text-xs text-[#64748b]">
              📅 You can select any date, including past dates (backdate) or future dates
            </p>
            {isFromDifferentMonth && (
              <div className="mt-3 rounded-lg bg-[#FEF3C7] p-3 border border-[#FBBF24]">
                <p className="text-xs font-medium text-[#92400E]">
                  ⚠️ This transaction is from a different month ({txDate.toLocaleDateString('en', { month: 'short', year: 'numeric' })}).
                  Make sure this is intentional for accurate budgeting.
                </p>
              </div>
            )}
          </label>

          {/* Quick Date Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setEditData({ ...editData, date: today });
              }}
              className="rounded-lg bg-[#F0FDF9] px-3 py-2 text-xs font-semibold text-[#047857] hover:bg-[#D1FAE5] transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                setEditData({ ...editData, date: yesterday });
              }}
              className="rounded-lg bg-[#F0FDF9] px-3 py-2 text-xs font-semibold text-[#047857] hover:bg-[#D1FAE5] transition-colors"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => {
                const monthStart = new Date();
                monthStart.setDate(1);
                setEditData({ ...editData, date: monthStart.toISOString().split('T')[0] });
              }}
              className="rounded-lg bg-[#F0FDF9] px-3 py-2 text-xs font-semibold text-[#047857] hover:bg-[#D1FAE5] transition-colors"
            >
              Month Start
            </button>
          </div>

          {/* Edit Note */}
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Note</span>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value, note: e.target.value })}
              className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none placeholder:text-[#94a3b8] focus:border-[#10B981]"
              placeholder="Add a note"
            />
          </label>

          {/* Link to Goal */}
          {suggestedGoals.length > 0 && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">
                Link to Goal <span className="text-xs text-[#64748b] font-normal">(optional)</span>
              </span>
              <select
                value={selectedGoalId || ''}
                onChange={(e) => setSelectedGoalId(e.target.value || null)}
                className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
              >
                <option value="">Select a goal...</option>
                {suggestedGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name} ({goal.percent}% complete)
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[#64748b]">
                💡 This transaction will add to your goal progress when linked
              </p>
            </label>
          )}

          {/* Recurring Transaction Toggle */}
          <label className="flex items-center gap-3 rounded-xl border border-[#E8EAED] bg-white p-3">
            <input
              type="checkbox"
              checked={editData.isRecurring || false}
              onChange={(e) => setEditData({ ...editData, isRecurring: e.target.checked })}
              className="h-5 w-5 rounded-md cursor-pointer accent-[#10B981]"
            />
            <div className="flex-1">
              <span className="block text-sm font-semibold text-[#0B0F17]">
                Repeat Monthly
              </span>
              <p className="text-xs text-[#64748b]">
                {editData.isRecurring ? '📅 This will repeat every month' : '🔄 One-time transaction'}
              </p>
            </div>
          </label>

          {/* Recurring End Date (show only if recurring) */}
          {editData.isRecurring && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">
                Stop Repeating On <span className="text-xs text-[#64748b] font-normal">(optional)</span>
              </span>
              <input
                type="date"
                value={editData.recurringEndDate || ''}
                onChange={(e) => setEditData({ ...editData, recurringEndDate: e.target.value || undefined })}
                className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
              />
              <p className="mt-2 text-xs text-[#64748b]">
                Leave blank to repeat forever, or set an end date
              </p>
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex flex-1 items-center justify-center gap-2 min-h-12 rounded-xl border border-[#ef4444] text-[#ef4444] font-semibold transition-colors hover:bg-[#FEF2F2]"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button
            onClick={handleUpdateTransaction}
            className="flex flex-1 items-center justify-center min-h-12 rounded-xl bg-[#10B981] text-white font-semibold transition-colors hover:bg-[#059669]"
          >
            Update
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-2xl border border-[#E8EAED] bg-white p-6 max-w-sm">
              <h3 className="text-lg font-semibold text-[#0B0F17]">Delete Transaction?</h3>
              <p className="mt-2 text-sm text-[#64748b]">
                This will permanently delete this transaction. This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl border border-[#E8EAED] py-2 font-semibold text-[#0B0F17] hover:bg-[#F6F7F9]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-[#ef4444] py-2 font-semibold text-white hover:bg-[#dc2626]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

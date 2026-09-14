'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { type Transaction, CATEGORY_MAP, formatMoney, getCurrency, parseAmountToMinor, INSURANCE_TYPES, UTILITY_TYPES, CREDIT_CARD_TYPES } from '@/lib/folo-data';
import type { CurrencyCode, CategoryType } from '@/lib/folo-data';

interface TransactionEditSheetProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  currency: CurrencyCode;
}

export function TransactionEditSheet({
  transaction,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  currency,
}: TransactionEditSheetProps) {
  const [editData, setEditData] = useState<Transaction | null>(transaction);
  const [amount, setAmount] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currencySymbol = getCurrency(currency).symbol;

  if (!editData || !transaction) return null;

  const handleUpdateTransaction = () => {
    const amountMinor = parseAmountToMinor(amount);
    if (amountMinor <= 0) return;

    onUpdate({
      ...editData,
      amountMinor: editData.categoryType === 'INCOME' ? amountMinor : -amountMinor,
    });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full animate-in slide-in-from-bottom duration-300 rounded-t-3xl border border-[#E8EAED] bg-white p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
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
          </label>

          {/* Edit Note */}
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Note</span>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none placeholder:text-[#94a3b8] focus:border-[#10B981]"
              placeholder="Add a note"
            />
          </label>
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

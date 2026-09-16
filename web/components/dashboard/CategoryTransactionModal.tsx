'use client';

import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import type { Transaction, CurrencyCode } from '@/lib/folo-data';
import { formatMoney } from '@/lib/folo-data';

interface CategoryTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  subcategory?: string;
  transactions: Transaction[];
  currency: CurrencyCode;
}

export function CategoryTransactionModal({
  isOpen,
  onClose,
  category,
  subcategory,
  transactions,
  currency,
}: CategoryTransactionModalProps) {
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  if (!isOpen) return null;

  // Filter transactions by category and subcategory
  const filtered = transactions.filter((tx) => {
    if (tx.category !== category) return false;
    if (subcategory && tx.category !== subcategory) return false;
    return true;
  });

  // Sort transactions
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      return Math.abs(b.amountMinor) - Math.abs(a.amountMinor);
    }
  });

  // Calculate totals
  const totalAmount = sorted.reduce((sum, tx) => sum + tx.amountMinor, 0);
  const count = sorted.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E8EAED] bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-[#E8EAED] bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0B0F17]">
                {subcategory || category} Transactions
              </h2>
              <p className="mt-1 text-sm text-[#64748b]">
                {count} transaction{count !== 1 ? 's' : ''} totaling {formatMoney(Math.abs(totalAmount), currency)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F0F2F4]"
            >
              <X className="h-5 w-5 text-[#64748b]" />
            </button>
          </div>

          {/* Sort Controls */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setSortBy('date')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                sortBy === 'date'
                  ? 'bg-[#F0F2F4] text-[#0B0F17]'
                  : 'bg-white text-[#64748b] hover:bg-[#F8F9FB]'
              }`}
            >
              <Filter className="h-4 w-4" />
              Newest First
            </button>
            <button
              onClick={() => setSortBy('amount')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                sortBy === 'amount'
                  ? 'bg-[#F0F2F4] text-[#0B0F17]'
                  : 'bg-white text-[#64748b] hover:bg-[#F8F9FB]'
              }`}
            >
              <Filter className="h-4 w-4" />
              Largest First
            </button>
          </div>
        </div>

        {/* Transaction List */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 280px)' }}>
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <p className="text-sm text-[#64748b]">No transactions found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8EAED]">
              {sorted.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 border-b border-[#F0F2F4] px-6 py-4 hover:bg-[#F8F9FB] transition-colors"
                >
                  {/* Left side - Description & Date */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#0B0F17]">{tx.name}</p>
                    <p className="mt-1 text-xs text-[#64748b]">{tx.date}</p>
                    {tx.note && (
                      <p className="mt-1 truncate text-xs text-[#94a3b8]">{tx.note}</p>
                    )}
                  </div>

                  {/* Right side - Amount */}
                  <div className="shrink-0 text-right">
                    <p
                      className={`font-semibold ${
                        tx.amountMinor > 0 ? 'text-[#10B981]' : 'text-[#0B0F17]'
                      }`}
                    >
                      {formatMoney(Math.abs(tx.amountMinor), currency)}
                    </p>
                    <p className="mt-1 text-xs text-[#64748b]">
                      {tx.categoryType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {sorted.length > 0 && (
          <div className="sticky bottom-0 border-t border-[#E8EAED] bg-[#F8F9FB] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0B0F17]">Total</p>
              <p className="text-lg font-bold text-[#0B0F17]">
                {formatMoney(Math.abs(totalAmount), currency)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

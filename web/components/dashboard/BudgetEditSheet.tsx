'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { type CurrencyCode, getCurrency } from '@/lib/folo-data';

interface BudgetEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budgets: Record<string, number>) => void;
  currency: CurrencyCode;
  budgets?: {
    INCOME?: number;
    BILLS?: number;
    EXPENSES?: number;
    SAVINGS?: number;
    DEBT?: number;
  };
  budgetLabels?: Partial<Record<'INCOME' | 'BILLS' | 'EXPENSES' | 'SAVINGS' | 'DEBT', string>>;
}

export function BudgetEditSheet({
  isOpen,
  onClose,
  onSave,
  currency,
  budgets = {},
  budgetLabels = {},
}: BudgetEditSheetProps) {
  if (!isOpen) return null;

  const formKey = ['INCOME', 'BILLS', 'EXPENSES', 'SAVINGS', 'DEBT']
    .map((category) => `${category}:${budgets[category as keyof typeof budgets] ?? 0}`)
    .join('|');

  return <BudgetEditForm key={formKey} onClose={onClose} onSave={onSave} currency={currency} budgets={budgets} budgetLabels={budgetLabels} />;
}

function BudgetEditForm({
  onClose,
  onSave,
  currency,
  budgets = {},
  budgetLabels = {},
}: Omit<BudgetEditSheetProps, 'isOpen'>) {
  const [editBudgets, setEditBudgets] = useState<Record<string, string>>({
    INCOME: (budgets.INCOME ? budgets.INCOME / 100 : 0).toFixed(2),
    BILLS: (budgets.BILLS ? budgets.BILLS / 100 : 0).toFixed(2),
    EXPENSES: (budgets.EXPENSES ? budgets.EXPENSES / 100 : 0).toFixed(2),
    SAVINGS: (budgets.SAVINGS ? budgets.SAVINGS / 100 : 0).toFixed(2),
    DEBT: (budgets.DEBT ? budgets.DEBT / 100 : 0).toFixed(2),
  });

  const currencySymbol = getCurrency(currency).symbol;

  const categoryLabels: Record<string, string> = {
    INCOME: 'Monthly Income',
    BILLS: 'Bills & Fixed Costs',
    EXPENSES: 'Expenses & Discretionary',
    SAVINGS: 'Savings & Goals',
    DEBT: 'Debt Payments',
  };

  const handleSave = () => {
    const updated: Record<string, number> = {};
    for (const [key, value] of Object.entries(editBudgets)) {
      const amount = parseFloat(value) || 0;
      if (amount < 0) {
        alert('Budget amounts must be 0 or greater');
        return;
      }
      updated[key] = Math.round(amount * 100); // Convert to minor units
    }
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 overflow-y-auto rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0B0F17]">Edit Monthly Budgets</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F6F7F9]"
          >
            <X className="h-5 w-5 text-[#64748b]" />
          </button>
        </div>

        {/* Budget Input Fields */}
        <div className="space-y-5">
          {(['INCOME', 'BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'] as const).map((category) => (
            <label key={category} className="block">
              <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">
                {budgetLabels[category] || categoryLabels[category]}
              </span>
              <div className="relative">
                <span className="absolute left-3 top-3 text-lg font-semibold text-[#475569]">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={editBudgets[category]}
                  onChange={(e) =>
                    setEditBudgets((prev) => ({
                      ...prev,
                      [category]: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white pl-8 pr-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
                />
              </div>
            </label>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 rounded-xl bg-[#F6F7F9] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#64748b]">
            Total Monthly Budget
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#0B0F17]">
            {currencySymbol}
            <span className="money">
              {(
                Object.values(editBudgets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
              ).toLocaleString('en', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="mt-8 w-full min-h-12 rounded-xl bg-[#10B981] font-semibold text-white transition-colors hover:bg-[#059669] active:scale-[0.98]"
        >
          Save Budgets
        </button>
      </div>
    </div>
  );
}

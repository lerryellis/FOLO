'use client';

import { useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import { getCurrency, parseAmountToMinor, type CurrencyCode, type Goal } from '@/lib/folo-data';

type GoalEditValues = Pick<Goal, 'name' | 'type' | 'targetMinor'>;

interface GoalEditSheetProps {
  currency: CurrencyCode;
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (goal: Goal) => void;
  onUpdate: (goalId: string, values: GoalEditValues) => void;
}

export function GoalEditSheet({
  currency,
  goal,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
}: GoalEditSheetProps) {
  if (!isOpen || !goal) return null;

  return <GoalEditForm key={goal.id} currency={currency} goal={goal} onClose={onClose} onDelete={onDelete} onUpdate={onUpdate} />;
}

function GoalEditForm({
  currency,
  goal,
  onClose,
  onDelete,
  onUpdate,
}: Omit<GoalEditSheetProps, 'isOpen'> & { goal: Goal }) {
  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState((goal.targetMinor / 100).toFixed(2));
  const [type, setType] = useState<Goal['type']>(goal.type);
  const [error, setError] = useState('');

  const handleSave = () => {
    const targetMinor = parseAmountToMinor(targetAmount);
    if (!name.trim()) {
      setError('A goal name is required.');
      return;
    }
    if (targetMinor <= 0) {
      setError('Target amount must be greater than zero.');
      return;
    }
    if (targetMinor < goal.progressMinor) {
      setError('Target amount cannot be less than the current progress.');
      return;
    }

    onUpdate(goal.id, { name: name.trim(), type, targetMinor });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-goal-title">
      <button type="button" aria-label="Close edit goal" className="absolute inset-0" onClick={onClose} />
      <section className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#64748b]">Goal settings</p>
            <h2 id="edit-goal-title" className="mt-1 text-xl font-semibold text-[#0B0F17]">Edit goal</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close edit goal" className="flex h-10 w-10 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#F6F7F9]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Goal name</span>
          <input value={name} onChange={(event) => { setName(event.target.value); setError(''); }} className="min-h-12 w-full rounded-xl border border-[#E8EAED] px-3 text-sm font-medium outline-none focus:border-[#10B981]" />
        </label>

        <fieldset className="mt-4">
          <legend className="mb-2 block text-sm font-semibold text-[#0B0F17]">Goal type</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['SAVINGS', 'DEBT'] as const).map((option) => (
              <button key={option} type="button" onClick={() => setType(option)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${type === option ? option === 'SAVINGS' ? 'border-[#10B981] bg-[#F0FDF9] text-[#047857]' : 'border-[#EF4444] bg-[#FEF2F2] text-[#B91C1C]' : 'border-[#E8EAED] text-[#475569] hover:bg-[#F6F7F9]'}`}>
                {option === 'SAVINGS' ? 'Save (build)' : 'Pay off (debt)'}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Target amount</span>
          <div className="flex min-h-12 items-center rounded-xl border border-[#E8EAED] bg-white px-3 focus-within:border-[#10B981]">
            <span className="mr-2 text-sm font-semibold text-[#475569]">{getCurrency(currency).symbol}</span>
            <input type="number" min="0" step="0.01" inputMode="decimal" value={targetAmount} onChange={(event) => { setTargetAmount(event.target.value); setError(''); }} className="money w-full bg-transparent text-right text-lg font-semibold outline-none" />
          </div>
          <p className="mt-1 text-xs text-[#64748b]">Current progress: {getCurrency(currency).symbol}{(goal.progressMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </label>

        {error ? <p className="mt-3 text-sm font-medium text-[#DC2626]">{error}</p> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button type="button" onClick={() => onDelete(goal)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-[#DC2626] hover:bg-[#FEF2F2]">
            <Trash2 className="h-4 w-4" /> Delete goal
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#E8EAED] px-4 text-sm font-semibold hover:bg-[#F6F7F9]">Cancel</button>
            <button type="button" onClick={handleSave} className="flex min-h-11 items-center gap-2 rounded-xl bg-[#10B981] px-4 text-sm font-semibold text-white hover:bg-[#059669]">
              <Save className="h-4 w-4" /> Save changes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

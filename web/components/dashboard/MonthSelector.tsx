'use client';

interface MonthSelectorProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function MonthSelector({ currentDate, onPreviousMonth, onNextMonth }: MonthSelectorProps) {
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const isCurrentMonth = new Date().getMonth() === currentDate.getMonth();

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={onPreviousMonth}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
      >
        ← Previous
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">{monthName}</h1>
        {isCurrentMonth && <p className="text-sm text-cyan-400">Current Month</p>}
      </div>

      <button
        onClick={onNextMonth}
        disabled={isCurrentMonth}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}

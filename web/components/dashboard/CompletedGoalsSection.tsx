'use client';

import { useState } from 'react';
import { Archive, ArchiveX, Trash2 } from 'lucide-react';
import type { Goal, CurrencyCode } from '@/lib/folo-data';
import { formatMoney } from '@/lib/folo-data';
import { archiveGoal, deleteGoal } from '@/lib/goal-archive-operations';

interface CompletedGoalsSectionProps {
  goals: Goal[];
  currency: CurrencyCode;
  userId?: string;
  onGoalArchived?: () => void;
}

export function CompletedGoalsSection({
  goals,
  currency,
  userId,
  onGoalArchived,
}: CompletedGoalsSectionProps) {
  const [archiving, setArchiving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completedGoals = goals.filter((goal) => goal.percent >= 100);

  if (completedGoals.length === 0) {
    return null; // Don't show section if no completed goals
  }

  const handleArchive = async (goalId: string) => {
    if (!userId) return;

    try {
      setArchiving(goalId);
      setError(null);
      await archiveGoal(userId, goalId);
      onGoalArchived?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive goal');
    } finally {
      setArchiving(null);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!userId || !confirm('Delete this goal permanently? This cannot be undone.')) return;

    try {
      setDeleting(goalId);
      setError(null);
      await deleteGoal(userId, goalId);
      onGoalArchived?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-[#E8EAED]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#0B0F17]">Completed Goals ({completedGoals.length})</h3>
        <p className="mt-1 text-xs text-[#64748b]">Archive or delete completed goals to clean up your active list</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="space-y-2">
        {completedGoals.map((goal) => (
          <div
            key={goal.id}
            className="flex items-center justify-between rounded-lg border border-[#E8EAED] bg-white p-4 hover:border-[#10B981] transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{goal.type === 'SAVINGS' ? '💰' : '💳'}</div>
                <div>
                  <p className="font-semibold text-[#0B0F17]">{goal.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-[#64748b]">
                      {formatMoney(goal.targetMinor, currency)}
                    </span>
                    <span className="text-xs text-[#10B981] font-semibold">✓ Complete</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleArchive(goal.id)}
                disabled={archiving === goal.id}
                title="Archive this goal"
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#F0FDF9] text-[#10B981] hover:bg-[#E0FDF5] transition-colors text-xs font-medium disabled:opacity-50"
              >
                <Archive className="h-4 w-4" />
                <span className="hidden sm:inline">Archive</span>
              </button>

              <button
                onClick={() => handleDelete(goal.id)}
                disabled={deleting === goal.id}
                title="Delete this goal permanently"
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-medium disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          // Archive all completed goals at once
          completedGoals.forEach((goal) => {
            handleArchive(goal.id);
          });
        }}
        className="mt-4 w-full py-2 px-4 rounded-lg border border-[#E8EAED] bg-white text-sm font-semibold text-[#0B0F17] hover:bg-[#F6F7F9] transition-colors"
      >
        <Archive className="h-4 w-4 inline mr-2" />
        Archive All Completed Goals
      </button>
    </div>
  );
}

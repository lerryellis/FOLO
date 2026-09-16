'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { type Goal, getCurrency, parseAmountToMinor } from '@/lib/folo-data';
import type { CurrencyCode } from '@/lib/folo-data';

interface GoalCreationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGoal: (goal: Omit<Goal, 'id' | 'percent' | 'icon' | 'detail' | 'remainingMinor'> & {
    monthlyPaymentMinor?: number;
    paymentStartDate?: string;
  }) => void;
  currency: CurrencyCode;
}

export function GoalCreationSheet({ isOpen, onClose, onCreateGoal, currency }: GoalCreationSheetProps) {
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [goalType, setGoalType] = useState<'SAVINGS' | 'DEBT'>('SAVINGS');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currencySymbol = getCurrency(currency).symbol;

  const handleCreateGoal = () => {
    const newErrors: Record<string, string> = {};

    if (!goalName.trim()) newErrors.goal_name = 'Goal name is required';
    if (!targetAmount.trim()) newErrors.target_amount = 'Target amount is required';

    // Monthly payment validation: if provided, must be positive and start date must be set
    if (monthlyPayment.trim()) {
      if (!paymentStartDate) {
        newErrors.payment_start_date = 'Payment start date is required for monthly payments';
      }
      const monthlyMinor = parseAmountToMinor(monthlyPayment);
      if (monthlyMinor <= 0) {
        newErrors.monthly_payment = 'Monthly payment must be greater than 0';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const targetMinor = parseAmountToMinor(targetAmount);
    if (targetMinor <= 0) {
      setErrors({ target_amount: 'Amount must be greater than 0' });
      return;
    }

    const goal: Omit<Goal, 'id' | 'percent' | 'icon' | 'detail' | 'remainingMinor'> & {
      monthlyPaymentMinor?: number;
      paymentStartDate?: string;
    } = {
      name: goalName.trim(),
      type: goalType,
      targetMinor,
      progressMinor: 0,
    };

    // Add optional monthly payment fields
    if (monthlyPayment.trim()) {
      goal.monthlyPaymentMinor = parseAmountToMinor(monthlyPayment);
      goal.paymentStartDate = paymentStartDate;
    }

    onCreateGoal(goal);

    // Reset form
    setGoalName('');
    setTargetAmount('');
    setMonthlyPayment('');
    setPaymentStartDate('');
    setGoalType('SAVINGS');
    setErrors({});
    onClose();
  };

  const appendKey = (key: string) => {
    if (key === 'backspace') {
      setTargetAmount((prev) => prev.slice(0, -1));
    } else if (key === '.') {
      if (!targetAmount.includes('.')) {
        setTargetAmount((prev) => (prev || '0') + '.');
      }
    } else {
      setTargetAmount((prev) => (prev === '0' ? key : prev + key));
    }
    setErrors((prev) => ({ ...prev, target_amount: '' }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 overflow-y-auto rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0B0F17]">Create Goal</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F6F7F9]"
          >
            <X className="h-5 w-5 text-[#64748b]" />
          </button>
        </div>

        {/* Goal Name */}
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Goal Name</span>
          <input
            type="text"
            value={goalName}
            onChange={(e) => {
              setGoalName(e.target.value);
              setErrors((prev) => ({ ...prev, goal_name: '' }));
            }}
            placeholder="e.g., Vacation, Emergency Fund, House Down Payment"
            className="min-h-12 w-full rounded-xl border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none placeholder:text-[#94a3b8] focus:border-[#10B981]"
          />
          {errors.goal_name && <p className="mt-1 text-xs text-[#ef4444]">{errors.goal_name}</p>}
        </label>

        {/* Goal Type */}
        <div className="mt-4">
          <span className="mb-3 block text-sm font-semibold text-[#0B0F17]">Goal Type</span>
          <div className="flex gap-3">
            <button
              onClick={() => setGoalType('SAVINGS')}
              className={`flex-1 rounded-xl py-3 font-semibold transition-colors ${
                goalType === 'SAVINGS'
                  ? 'border-[#10B981] bg-[#F0FDF9] text-[#10B981]'
                  : 'border border-[#E8EAED] bg-white text-[#475569] hover:bg-[#F6F7F9]'
              }`}
            >
              Save (Build)
            </button>
            <button
              onClick={() => setGoalType('DEBT')}
              className={`flex-1 rounded-xl py-3 font-semibold transition-colors ${
                goalType === 'DEBT'
                  ? 'border-[#ef4444] bg-[#FEF2F2] text-[#ef4444]'
                  : 'border border-[#E8EAED] bg-white text-[#475569] hover:bg-[#F6F7F9]'
              }`}
            >
              Pay Off (Debt)
            </button>
          </div>
        </div>

        {/* Target Amount */}
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Target Amount</span>
          <div className="min-h-12 rounded-xl border border-[#E8EAED] bg-white px-3 py-2 text-right">
            <span className="text-2xl font-semibold text-[#0B0F17]">
              {currencySymbol}
              <span className="money">
                {targetAmount
                  ? (parseAmountToMinor(targetAmount) / 100).toLocaleString('en', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00'}
              </span>
            </span>
          </div>
          {errors.target_amount && <p className="mt-1 text-xs text-[#ef4444]">{errors.target_amount}</p>}
        </label>

        {/* Numeric Keypad */}
        <div className="mt-6 grid grid-cols-3 gap-2">
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
      {/* Create Button */}
        <button
          onClick={handleCreateGoal}
          className="mt-6 flex w-full items-center justify-center gap-2 min-h-12 rounded-xl bg-[#10B981] font-semibold text-white transition-colors hover:bg-[#059669] active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          Create Goal
        </button>
      </div>
    </div>
  );
}

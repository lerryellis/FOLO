'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { CashflowCard } from '@/components/dashboard/CashflowCard';
import { FinancialGoalsCard } from '@/components/dashboard/FinancialGoalsCard';

// Mock data - Replace with real Supabase queries
const MOCK_BUDGET_DATA = [
  { name: 'Income', value: 3000, percentage: 0 },
  { name: 'Groceries', value: 450, percentage: 15 },
  { name: 'Utilities', value: 200, percentage: 6.7 },
  { name: 'Entertainment', value: 300, percentage: 10 },
  { name: 'Transport', value: 150, percentage: 5 },
];

const MOCK_CASHFLOW_DATA = [
  { month: 'Jan', earnings: 3000, spent: 2100 },
  { month: 'Feb', earnings: 3000, spent: 2300 },
  { month: 'Mar', earnings: 3500, spent: 2400 },
  { month: 'Apr', earnings: 3500, spent: 2200 },
  { month: 'May', earnings: 3000, spent: 2500 },
  { month: 'Jun', earnings: 3000, spent: 1900 },
];

const MOCK_GOALS = [
  {
    id: '1',
    name: 'Emergency Fund',
    type: 'SAVINGS' as const,
    targetAmount: 10000,
    currentProgress: 3500,
    deadline: '2026-12-31',
  },
  {
    id: '2',
    name: 'Credit Card Debt',
    type: 'DEBT' as const,
    targetAmount: 5000,
    currentProgress: 1200,
    deadline: '2026-12-31',
  },
  {
    id: '3',
    name: 'Vacation Fund',
    type: 'SAVINGS' as const,
    targetAmount: 3000,
    currentProgress: 1800,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const result = await signOut();
    if (!result.error) {
      router.push('/login');
    }
    setIsSigningOut(false);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    const today = new Date();
    if (
      currentDate.getFullYear() < today.getFullYear() ||
      (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() < today.getMonth())
    ) {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    }
  };

  // Calculate totals from mock data
  const totalBudget = 3000;
  const totalSpent = MOCK_BUDGET_DATA.reduce((sum, item) => sum + (item.name === 'Income' ? 0 : item.value), 0);
  const totalEarnings = MOCK_CASHFLOW_DATA[MOCK_CASHFLOW_DATA.length - 1].earnings;
  const totalExpenses = MOCK_CASHFLOW_DATA[MOCK_CASHFLOW_DATA.length - 1].spent;
  const netCashflow = totalEarnings - totalExpenses;

  const quickStats = [
    {
      title: 'Total Income',
      value: `$${totalEarnings.toFixed(2)}`,
      icon: '💰',
      color: 'text-green-400',
      subtitle: 'This month',
    },
    {
      title: 'Total Expenses',
      value: `$${totalExpenses.toFixed(2)}`,
      icon: '💸',
      color: 'text-red-400',
      subtitle: 'This month',
    },
    {
      title: 'Remaining Budget',
      value: `$${(totalBudget - totalSpent).toFixed(2)}`,
      icon: '📊',
      color: 'text-blue-400',
      subtitle: 'This period',
    },
    {
      title: 'Net Cashflow',
      value: `$${netCashflow.toFixed(2)}`,
      icon: '📈',
      color: netCashflow >= 0 ? 'text-emerald-400' : 'text-orange-400',
      subtitle: netCashflow >= 0 ? 'Positive' : 'Negative',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          <p className="mt-2 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white" style={{ borderColor: '#10B981', borderOpacity: 0.3 }}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/folo_logo.png" alt="FOLO" className="h-10" />
            <div>
              <p className="text-sm" style={{ color: '#0B0F17', opacity: 0.6 }}>Welcome back, {user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="px-4 py-2 rounded-lg disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Month Selector */}
        <div className="mb-8">
          <MonthSelector
            currentDate={currentDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <QuickStats stats={quickStats} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Budget Overview */}
          <BudgetOverview
            data={MOCK_BUDGET_DATA.filter((item) => item.name !== 'Income')}
            totalBudget={totalBudget}
            totalSpent={totalSpent}
          />

          {/* Cashflow Card */}
          <CashflowCard
            data={MOCK_CASHFLOW_DATA}
            totalEarnings={totalEarnings}
            totalSpent={totalExpenses}
            netCashflow={netCashflow}
          />
        </div>

        {/* Financial Goals */}
        <div className="mb-8">
          <FinancialGoalsCard goals={MOCK_GOALS} />
        </div>

        {/* Coming Soon Info */}
        <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🚀 Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-cyan-400 font-medium mb-1">✅ Completed</p>
              <ul className="text-gray-400 space-y-1">
                <li>• Authentication System</li>
                <li>• Dashboard Layout</li>
                <li>• Budget Overview Charts</li>
                <li>• Financial Goals Tracking</li>
              </ul>
            </div>
            <div>
              <p className="text-orange-400 font-medium mb-1">🔨 In Progress</p>
              <ul className="text-gray-400 space-y-1">
                <li>• Real Supabase Data Integration</li>
                <li>• Add Transactions Feature</li>
                <li>• Android Feature Parity</li>
                <li>• Real-time Sync Testing</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

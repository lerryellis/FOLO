'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Home, BarChart3, Settings, TrendingUp, User, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6F7F9' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#10B981]"></div>
          <p className="mt-2 text-sm" style={{ color: '#0B0F17', opacity: 0.6 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInitial = user.email?.[0].toUpperCase() || 'E';
  const leftToSpend = 1315; // GH₵ (from design)
  const planned = 1800;
  const underPlan = 485;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F6F7F9' }}>
      {/* Period Header */}
      <div className="sticky top-0 border-b" style={{ backgroundColor: '#F6F7F9', borderColor: '#E8EAED' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/50">
              <ChevronLeft className="w-5 h-5" style={{ color: '#475569' }} />
            </button>
            <div className="flex flex-col gap-0.5">
              <div className="text-sm font-semibold" style={{ color: '#0B0F17' }}>September 2026</div>
              <div className="text-xs" style={{ color: '#94a3b8', fontWeight: 500 }}>1 Sep – 30 Sep</div>
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/50">
              <ChevronRight className="w-5 h-5" style={{ color: '#475569' }} />
            </button>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs text-white" style={{ backgroundColor: '#0B0F17' }}>
            {userInitial}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Hero: LEFT TO SPEND */}
        <div className="bg-white border rounded-2xl p-5 mb-3" style={{ borderColor: '#E8EAED' }}>
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-xs font-semibold tracking-widest" style={{ color: '#94a3b8' }}>LEFT TO SPEND</div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
              <span className="text-xs" style={{ color: '#94a3b8', fontWeight: 500 }}>16 days left</span>
            </div>
          </div>

          {/* Big Number */}
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-sm font-medium" style={{ color: '#475569' }}>GH₵</span>
            <span className="text-5xl font-bold tracking-tight" style={{ color: '#0B0F17', letterSpacing: '-0.03em' }}>1,315</span>
            <span className="text-sm font-medium" style={{ color: '#475569' }}>.00</span>
          </div>

          <div className="h-px mb-3" style={{ backgroundColor: '#E8EAED' }}></div>

          {/* Planned vs Actual */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: '#475569' }}>
              Planned{' '}
              <span className="font-semibold" style={{ color: '#0B0F17' }}>GH₵1,800.00</span>
            </span>
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
              <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>GH₵{underPlan} under plan</span>
            </div>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'INCOME', value: '9,200', sub: 'of 9,500', color: '#0B0F17' },
            { label: 'SPENT', value: '5,935', sub: '+185 over', color: '#ef4444' },
            { label: 'SAVED', value: '1,500', sub: 'of 1,500', color: '#0B0F17' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border rounded-xl p-3" style={{ borderColor: '#E8EAED' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: '#94a3b8', letterSpacing: '0.07em' }}>
                {stat.label}
              </div>
              <div className="text-base font-semibold mb-0.5" style={{ color: stat.color, letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: stat.label === 'SPENT' ? '#ef4444' : '#94a3b8', fontWeight: stat.label === 'SPENT' ? 500 : 400 }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Group Meters */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs font-bold tracking-widest" style={{ color: '#94a3b8' }}>BY GROUP</div>
            <button className="text-xs font-medium" style={{ color: '#059669' }}>See all</button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Bills', spent: 3090, budget: 3150, color: '#10B981' },
              { name: 'Expenses', spent: 2845, budget: 2600, color: '#ef4444' },
              { name: 'Savings', spent: 1500, budget: 1500, color: '#10B981' },
              { name: 'Debt', spent: 950, budget: 950, color: '#10B981' },
            ].map((group, i) => {
              const percent = (group.spent / group.budget) * 100;
              const textColor = group.spent > group.budget ? '#ef4444' : '#0B0F17';
              return (
                <div key={i} className="bg-white border rounded-xl p-3" style={{ borderColor: '#E8EAED' }}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: '#0B0F17' }}>{group.name}</span>
                    <span className="text-xs font-medium" style={{ color: textColor }}>
                      {group.spent.toLocaleString()}{' '}
                      <span style={{ color: '#94a3b8' }}>/ {group.budget.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: group.color,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs font-bold tracking-widest" style={{ color: '#94a3b8' }}>RECENT</div>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: '#E8EAED' }}>
            {[
              { name: 'Groceries', category: 'Food · 13 Sep', amount: '−184.50', type: 'expense', icon: '🛒' },
              { name: 'Uber to Osu', category: 'Transport · 13 Sep', amount: '−42.00', type: 'expense', icon: '🚗' },
              { name: 'September salary', category: 'Salary · 11 Sep', amount: '+8,500.00', type: 'income', icon: '⬆' },
            ].map((tx, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 ${i < 2 ? 'border-b' : ''}`}
                style={{ borderColor: '#F0F2F4' }}
              >
                <div
                  className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm"
                  style={{
                    backgroundColor: tx.type === 'income' ? '#E7F7F0' : '#F1F5F3',
                  }}
                >
                  {tx.icon}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-sm font-medium" style={{ color: '#0B0F17' }}>{tx.name}</div>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>{tx.category}</div>
                </div>
                <div className="text-sm font-semibold text-right" style={{ color: tx.type === 'income' ? '#059669' : '#0B0F17' }}>
                  {tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 gap-1 py-2 px-1"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E8EAED',
        }}
      >
        {[
          { icon: Home, label: 'Home', id: 'home' },
          { icon: BarChart3, label: 'Budget', id: 'budget' },
          { icon: () => <div className="w-6 h-6 rounded-3xl bg-[#10B981] flex items-center justify-center"><span className="text-white font-bold text-lg">+</span></div>, label: 'Add', id: 'add' },
          { icon: TrendingUp, label: 'Activity', id: 'activity' },
          { icon: User, label: 'Goals', id: 'goals' },
        ].map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => {
              if (id !== 'add') setActiveTab(id);
            }}
            className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: activeTab === id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            }}
          >
            <Icon className="w-5 h-5" style={{ color: activeTab === id ? '#0B0F17' : '#94a3b8' }} />
            <span className="text-xs font-medium" style={{ color: activeTab === id ? '#0B0F17' : '#94a3b8' }}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

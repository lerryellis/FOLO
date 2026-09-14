'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Home, BarChart3, TrendingUp, User, ChevronLeft, ChevronRight, Clock, AlertCircle, X } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Expenses');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  // ========== HOME SCREEN ==========
  const HomeScreen = () => (
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
            Planned <span className="font-semibold" style={{ color: '#0B0F17' }}>GH₵1,800.00</span>
          </span>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
            <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>GH₵485 under plan</span>
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
                    {group.spent.toLocaleString()} <span style={{ color: '#94a3b8' }}>/ {group.budget.toLocaleString()}</span>
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
            { name: 'Groceries', category: 'Food · 13 Sep', amount: '−184.50', type: 'expense' },
            { name: 'Uber to Osu', category: 'Transport · 13 Sep', amount: '−42.00', type: 'expense' },
            { name: 'September salary', category: 'Salary · 11 Sep', amount: '+8,500.00', type: 'income' },
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
                {tx.type === 'income' ? '⬆' : '📦'}
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
  );

  // ========== ADD SCREEN ==========
  const AddScreen = () => (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button className="w-10 h-10 flex items-center justify-center" onClick={() => setActiveTab('home')}>
          <X className="w-6 h-6" style={{ color: '#475569' }} />
        </button>
        <h2 className="text-lg font-semibold" style={{ color: '#0B0F17' }}>New transaction</h2>
        <div className="w-10"></div>
      </div>

      {/* Amount Display */}
      <div className="text-center mb-8">
        <div className="text-sm" style={{ color: '#94a3b8' }}>{selectedCategory}</div>
        <div className="flex items-baseline gap-1 justify-center mt-2">
          <span className="text-xl font-medium" style={{ color: '#475569' }}>GH₵</span>
          <span className="text-6xl font-bold" style={{ color: '#0B0F17', letterSpacing: '-0.035em' }}>
            {amount || '0'}
          </span>
          <span className="text-xl font-medium" style={{ color: '#475569' }}>.00</span>
        </div>
      </div>

      {/* Category Buttons */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['Income', 'Bills', 'Expenses', 'Savings', 'Debt'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-all flex-shrink-0"
            style={{
              backgroundColor: selectedCategory === cat ? '#0B0F17' : '#FFFFFF',
              color: selectedCategory === cat ? '#FFFFFF' : '#475569',
              borderColor: selectedCategory === cat ? '#0B0F17' : '#E8EAED',
              border: '1px solid',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Numeric Keypad */}
      <div className="flex-grow flex flex-col justify-end">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === '⌫') {
                  setAmount(amount.slice(0, -1));
                } else if (key === '.') {
                  if (!amount.includes('.')) setAmount(amount + '.');
                } else {
                  setAmount(amount + key.toString());
                }
              }}
              className="py-4 rounded-lg font-semibold text-lg border transition-all active:scale-95"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E8EAED',
                color: '#0B0F17',
              }}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Save Button */}
        <button
          className="w-full py-4 rounded-lg font-semibold text-white transition-all"
          style={{ backgroundColor: '#10B981' }}
        >
          Save Transaction
        </button>
      </div>
    </div>
  );

  // ========== BUDGET SCREEN ==========
  const BudgetScreen = () => (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#0B0F17' }}>Budget</h2>
          <p className="text-xs" style={{ color: '#94a3b8', fontWeight: 500 }}>September 2026</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border rounded-2xl p-4 mb-4 grid grid-cols-3 gap-4" style={{ borderColor: '#E8EAED' }}>
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color: '#94a3b8', letterSpacing: '0.07em' }}>BUDGETED</div>
          <div className="text-lg font-semibold" style={{ color: '#0B0F17' }}>8,200</div>
        </div>
        <div style={{ borderLeft: '1px solid #F0F2F4', paddingLeft: 16 }}>
          <div className="text-xs font-semibold mb-1" style={{ color: '#94a3b8', letterSpacing: '0.07em' }}>ACTUAL</div>
          <div className="text-lg font-semibold" style={{ color: '#0B0F17' }}>8,385</div>
        </div>
        <div style={{ borderLeft: '1px solid #F0F2F4', paddingLeft: 16 }}>
          <div className="text-xs font-semibold mb-1" style={{ color: '#94a3b8', letterSpacing: '0.07em' }}>VARIANCE</div>
          <div className="text-lg font-semibold" style={{ color: '#ef4444' }}>−185</div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="space-y-3">
        {[
          { name: 'Bills', spent: 3090, budget: 3150, color: '#10B981' },
          { name: 'Expenses', spent: 2845, budget: 2600, color: '#ef4444' },
          { name: 'Savings', spent: 1500, budget: 1500, color: '#10B981' },
          { name: 'Debt', spent: 950, budget: 950, color: '#10B981' },
          { name: 'Income', spent: 9200, budget: 9500, color: '#059669' },
        ].map((cat, i) => {
          const percent = (cat.spent / cat.budget) * 100;
          return (
            <div key={i} className="bg-white border rounded-2xl p-4" style={{ borderColor: '#E8EAED' }}>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="font-semibold" style={{ color: '#0B0F17' }}>{cat.name}</h3>
                <span className="text-xs font-medium" style={{ color: percent > 100 ? '#ef4444' : '#0B0F17' }}>
                  {cat.spent.toLocaleString()} <span style={{ color: '#94a3b8' }}>/ {cat.budget.toLocaleString()}</span>
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(percent, 100)}%`,
                    backgroundColor: cat.color,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ========== TRANSACTIONS SCREEN ==========
  const TransactionsScreen = () => (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#0B0F17' }}>Activity</h2>
          <p className="text-xs" style={{ color: '#94a3b8', fontWeight: 500 }}>28 transactions · September</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['All', 'Expenses', 'Bills', 'Income'].map((filter) => (
          <button
            key={filter}
            className="px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm flex-shrink-0"
            style={{
              backgroundColor: filter === 'All' ? '#0B0F17' : '#FFFFFF',
              color: filter === 'All' ? '#FFFFFF' : '#475569',
              borderColor: filter === 'All' ? '#0B0F17' : '#E8EAED',
              border: filter === 'All' ? 'none' : '1px solid',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Transactions grouped by date */}
      <div className="space-y-4">
        {[
          { date: 'Today', transactions: [
            { name: 'Groceries', category: 'Food', amount: '−184.50', type: 'expense' },
            { name: 'Starbucks', category: 'Food', amount: '−15.30', type: 'expense' },
          ]},
          { date: 'Yesterday', transactions: [
            { name: 'Salary Deposit', category: 'Income', amount: '+8,500.00', type: 'income' },
            { name: 'Electricity Bill', category: 'Bills', amount: '−89.50', type: 'expense' },
          ]},
        ].map((group, gi) => (
          <div key={gi}>
            <div className="text-xs font-bold mb-2" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>{group.date.toUpperCase()}</div>
            <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: '#E8EAED' }}>
              {group.transactions.map((tx, ti) => (
                <div
                  key={ti}
                  className={`flex items-center gap-3 p-3 ${ti < group.transactions.length - 1 ? 'border-b' : ''}`}
                  style={{ borderColor: '#F0F2F4' }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{
                      backgroundColor: tx.type === 'income' ? '#E7F7F0' : '#F1F5F3',
                    }}
                  >
                    {tx.type === 'income' ? '⬆' : '📦'}
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
        ))}
      </div>
    </div>
  );

  // ========== GOALS SCREEN ==========
  const GoalsScreen = () => (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#0B0F17' }}>Goals</h2>
          <p className="text-xs" style={{ color: '#94a3b8', fontWeight: 500 }}>2 of 5 achieved</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border rounded-2xl p-4 mb-4 grid grid-cols-3 gap-4" style={{ borderColor: '#E8EAED' }}>
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color: '#94a3b8', letterSpacing: '0.07em' }}>TARGET</div>
          <div className="text-lg font-semibold" style={{ color: '#0B0F17' }}>76,000</div>
        </div>
        <div style={{ borderLeft: '1px solid #F0F2F4', paddingLeft: 16 }}>
          <div className="text-xs font-semibold mb-1" style={{ color: '#94a3b8', letterSpacing: '0.07em' }}>SAVED</div>
          <div className="text-lg font-semibold" style={{ color: '#059669' }}>29,000</div>
        </div>
        <div style={{ borderLeft: '1px solid #F0F2F4', paddingLeft: 16 }}>
          <div className="text-xs font-semibold mb-1" style={{ color: '#94a3b8', letterSpacing: '0.07em' }}>TO GO</div>
          <div className="text-lg font-semibold" style={{ color: '#0B0F17' }}>47,000</div>
        </div>
      </div>

      {/* Goal Cards */}
      <div className="space-y-3">
        {[
          { name: 'Emergency Fund', saved: 15000, target: 20000, icon: '🛡️' },
          { name: 'Vacation', saved: 8500, target: 12000, icon: '✈️' },
          { name: 'New Laptop', saved: 5500, target: 2500, icon: '💻' },
          { name: 'Car Down Payment', saved: 0, target: 30000, icon: '🚗' },
          { name: 'Home Improvement', saved: 0, target: 12000, icon: '🏠' },
        ].map((goal, i) => {
          const percent = (goal.saved / goal.target) * 100;
          const isComplete = goal.saved >= goal.target;
          return (
            <div key={i} className="bg-white border rounded-2xl p-4" style={{ borderColor: '#E8EAED' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#0B0F17' }}>{goal.name}</h3>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>
                      {goal.saved.toLocaleString()} of {goal.target.toLocaleString()}
                    </p>
                  </div>
                </div>
                {isComplete && <span className="text-sm font-semibold" style={{ color: '#059669' }}>✓ Done</span>}
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(percent, 100)}%`,
                    backgroundColor: isComplete ? '#059669' : '#10B981',
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F6F7F9' }}>
      {/* Period Header - Hide on Add screen */}
      {activeTab !== 'add' && (
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
      )}

      {/* Screen Content */}
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'budget' && <BudgetScreen />}
      {activeTab === 'add' && <AddScreen />}
      {activeTab === 'activity' && <TransactionsScreen />}
      {activeTab === 'goals' && <GoalsScreen />}

      {/* Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t grid grid-cols-5 gap-1 py-2 px-1"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E8EAED',
        }}
      >
        {[
          { icon: 'home', label: 'Home', id: 'home' },
          { icon: 'budget', label: 'Budget', id: 'budget' },
          { icon: 'add', label: 'Add', id: 'add' },
          { icon: 'activity', label: 'Activity', id: 'activity' },
          { icon: 'goals', label: 'Goals', id: 'goals' },
        ].map(({ icon, label, id }) => {
          const renderIcon = () => {
            switch (icon) {
              case 'home': return <Home className="w-5 h-5" style={{ color: activeTab === id ? '#0B0F17' : '#94a3b8' }} />;
              case 'budget': return <BarChart3 className="w-5 h-5" style={{ color: activeTab === id ? '#0B0F17' : '#94a3b8' }} />;
              case 'add': return <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold text-sm">+</div>;
              case 'activity': return <TrendingUp className="w-5 h-5" style={{ color: activeTab === id ? '#0B0F17' : '#94a3b8' }} />;
              case 'goals': return <User className="w-5 h-5" style={{ color: activeTab === id ? '#0B0F17' : '#94a3b8' }} />;
              default: return null;
            }
          };
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: activeTab === id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              }}
            >
              {renderIcon()}
              <span className="text-xs font-medium" style={{ color: activeTab === id ? '#0B0F17' : '#94a3b8' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

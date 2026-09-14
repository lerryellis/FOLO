'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Home, BarChart3, Settings, TrendingUp, User, Bell } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#10B981' }}></div>
          <p className="mt-2" style={{ color: '#0B0F17', opacity: 0.6 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userName = user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top Section with Greeting */}
      <div className="sticky top-0 bg-white border-b" style={{ borderColor: '#10B981', borderOpacity: 0.2 }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-start">
          <div>
            <p className="text-sm" style={{ color: '#0B0F17', opacity: 0.6 }}>Good Morning</p>
            <h1 className="text-2xl font-bold" style={{ color: '#0B0F17' }}>Welcome Back</h1>
            <p className="text-xs" style={{ color: '#0B0F17', opacity: 0.5 }}>{user.email}</p>
          </div>
          <button className="p-2 rounded-full" style={{ backgroundColor: '#10B981', backgroundOpacity: 0.1 }}>
            <Bell className="w-5 h-5" style={{ color: '#10B981' }} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Available Funds Card */}
        <div
          className="rounded-3xl p-6 text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          }}
        >
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-sm opacity-80">Available Funds</p>
              <p className="text-3xl font-bold mt-1">USD $24,000</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white opacity-20"></div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs opacity-80">Current Balance</p>
              <p className="text-lg font-semibold mt-1">FOLO Card</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Card Number</p>
              <p className="text-sm font-mono mt-1">•••• 4242</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#0B0F17' }}>Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {['Send', 'Request', 'Top Up', 'More'].map((action) => (
              <button
                key={action}
                className="py-3 rounded-2xl font-medium transition-all transform hover:scale-105"
                style={{
                  backgroundColor: action === 'More' ? '#10B981' : '#10B981',
                  backgroundOpacity: action === 'More' ? 1 : 0.1,
                  color: action === 'More' ? '#FFFFFF' : '#10B981',
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Insights */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#0B0F17' }}>Financial Insights</h2>
            <button className="text-xs font-medium" style={{ color: '#10B981' }}>View Report</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {['Weekly', 'Monthly'].map((tab) => (
              <button
                key={tab}
                className="px-6 py-2 rounded-full font-medium transition-all"
                style={{
                  backgroundColor: tab === 'Weekly' ? '#10B981' : '#10B981',
                  backgroundOpacity: tab === 'Weekly' ? 1 : 0.1,
                  color: tab === 'Weekly' ? '#FFFFFF' : '#0B0F17',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="flex items-end justify-around h-48 p-6 rounded-2xl bg-gray-50">
            {[65, 30, 75, 45, 60, 85, 70].map((height, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div
                  className="rounded-full transition-all"
                  style={{
                    width: '32px',
                    height: `${height * 1.5}px`,
                    backgroundColor: '#10B981',
                  }}
                ></div>
                <span className="text-xs" style={{ color: '#0B0F17', opacity: 0.5 }}>
                  {17 + idx}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 p-4 rounded-2xl bg-gray-50">
            <p className="text-sm" style={{ color: '#0B0F17', opacity: 0.6 }}>Total Income & Expense</p>
            <p className="text-3xl font-bold mt-2" style={{ color: '#0B0F17' }}>USD $24,000.00</p>
          </div>
        </div>

        {/* Transaction Summary */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: '#0B0F17' }}>Transaction Summary</h2>
            <button className="text-xs font-medium" style={{ color: '#10B981' }}>View All</button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Salary Deposit', amount: '+USD 5,000.00', type: 'income' },
              { name: 'Grocery Store', amount: '-USD 125.50', type: 'expense' },
              { name: 'Utility Bill', amount: '-USD 89.99', type: 'expense' },
            ].map((transaction, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50">
                <div>
                  <p className="font-medium" style={{ color: '#0B0F17' }}>{transaction.name}</p>
                  <p className="text-xs" style={{ color: '#0B0F17', opacity: 0.5 }}>Today</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold" style={{ color: transaction.type === 'income' ? '#10B981' : '#0B0F17' }}>
                    {transaction.amount}
                  </p>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: '#10B981', backgroundOpacity: 0.2, color: '#10B981' }}
                  >
                    ✓
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-4 border-t"
        style={{
          backgroundColor: '#0B0F17',
          borderColor: '#10B981',
          borderOpacity: 0.3,
        }}
      >
        {[
          { icon: Home, label: 'Home', id: 'home' },
          { icon: BarChart3, label: 'Analytics', id: 'analytics' },
          { icon: Settings, label: 'Settings', id: 'settings' },
          { icon: TrendingUp, label: 'Trends', id: 'trends' },
          { icon: User, label: 'Profile', id: 'profile' },
        ].map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => {
              if (id === 'profile') handleSignOut();
              else setActiveTab(id);
            }}
            className="flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all"
            style={{
              backgroundColor: activeTab === id ? '#10B981' : 'transparent',
              backgroundOpacity: activeTab === id ? 1 : 0.5,
            }}
          >
            <Icon
              className="w-6 h-6"
              style={{ color: activeTab === id ? '#FFFFFF' : '#FFFFFF', opacity: activeTab === id ? 1 : 0.6 }}
            />
            <span className="text-xs" style={{ color: activeTab === id ? '#FFFFFF' : '#FFFFFF', opacity: activeTab === id ? 1 : 0.6 }}>
              {id === 'profile' ? (isSigningOut ? 'Signing out...' : 'Logout') : label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

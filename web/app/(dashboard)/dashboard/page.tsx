'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🎯 FOLO Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome, {user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Coming Soon */}
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon! 🚀</h2>
          <p className="text-gray-600 mb-8">
            The dashboard is being built. Features coming:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Budget Overview</h3>
              <p className="text-sm text-blue-700">
                See your income, expenses, and budget summary at a glance
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">💰 Transactions</h3>
              <p className="text-sm text-green-700">
                Log and track all your financial transactions
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">🎯 Financial Goals</h3>
              <p className="text-sm text-purple-700">
                Set and track your savings and debt payoff goals
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-2">📈 Analytics</h3>
              <p className="text-sm text-orange-700">
                Visualize your financial trends and patterns
              </p>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-600">
            <p>✅ Authentication is working!</p>
            <p>Next: Build Budget, Transactions, Goals, and Analytics</p>
          </div>
        </div>

        {/* User Info */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.id}</code>
            </p>
            <p>
              <strong>Created:</strong> {new Date(user.created_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading screen while checking auth
  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 h-screen flex flex-col justify-center">
        <div className="text-center">
          {/* Logo & Title */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-white mb-2">🎯 FOLO</h1>
            <p className="text-2xl text-blue-100">Financial Budget & Goal Planner</p>
          </div>

          {/* Description */}
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Take control of your finances. Track budgets, manage transactions, and achieve your
            financial goals with ease.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-blue-700 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg inline-block"
            >
              🚀 Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg inline-block"
            >
              🔐 Sign In
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur p-6 rounded-lg text-white">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Budget Management</h3>
              <p className="text-blue-100 text-sm">
                Create and track monthly budgets across different categories
              </p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur p-6 rounded-lg text-white">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Sync</h3>
              <p className="text-blue-100 text-sm">
                Sync seamlessly across your phone, tablet, and desktop
              </p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur p-6 rounded-lg text-white">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Goal Tracking</h3>
              <p className="text-blue-100 text-sm">
                Set and track your savings and debt payoff goals
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h3 className="text-white font-semibold mb-6">What You Get:</h3>
            <ul className="text-blue-100 space-y-2 text-sm">
              <li>✅ Track income, expenses, savings, and debt</li>
              <li>✅ Set financial goals and monitor progress</li>
              <li>✅ View detailed transaction history and analytics</li>
              <li>✅ Work offline on mobile, sync when online</li>
              <li>✅ Secure authentication and data privacy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

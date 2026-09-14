'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🎯 FOLO</h1>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left: Text */}
          <div>
            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Take Control Of Your <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Finances</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Track budgets, manage transactions, and achieve your financial goals all in one beautiful app. Works seamlessly across all your devices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg transform hover:scale-105"
              >
                Start Free Today
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 border-2 border-cyan-500 text-cyan-400 font-bold rounded-lg hover:bg-cyan-500/10 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Right: Feature Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                    <span className="text-white text-xl">💰</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Smart Budget Tracking</h3>
                  <p className="text-gray-400 text-sm">Set budgets by category and track spending in real-time</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500">
                    <span className="text-white text-xl">📊</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Real-Time Analytics</h3>
                  <p className="text-gray-400 text-sm">Beautiful charts and insights into your spending patterns</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    <span className="text-white text-xl">🎯</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Financial Goals</h3>
                  <p className="text-gray-400 text-sm">Set and track savings goals and debt payoff plans</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                    <span className="text-white text-xl">🔄</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Sync Everywhere</h3>
                  <p className="text-gray-400 text-sm">Access your finances on phone, tablet, and desktop instantly</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-white text-center mb-12">Powerful Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-cyan-500 transition-all">
              <div className="text-4xl mb-4">💳</div>
              <h4 className="text-white font-bold mb-2">Budget Categories</h4>
              <p className="text-gray-400 text-sm">Organize spending across income, bills, expenses, savings & debt</p>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-pink-500 transition-all">
              <div className="text-4xl mb-4">📈</div>
              <h4 className="text-white font-bold mb-2">Smart Insights</h4>
              <p className="text-gray-400 text-sm">Visualize cashflow trends and spending patterns with interactive charts</p>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-purple-500 transition-all">
              <div className="text-4xl mb-4">🏦</div>
              <h4 className="text-white font-bold mb-2">Goal Progress</h4>
              <p className="text-gray-400 text-sm">Track your journey to financial freedom with visual progress indicators</p>
            </div>

            {/* Card 4 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-green-500 transition-all">
              <div className="text-4xl mb-4">📱</div>
              <h4 className="text-white font-bold mb-2">Mobile First</h4>
              <p className="text-gray-400 text-sm">Beautiful, responsive design works perfectly on any device</p>
            </div>

            {/* Card 5 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-orange-500 transition-all">
              <div className="text-4xl mb-4">🔐</div>
              <h4 className="text-white font-bold mb-2">Security First</h4>
              <p className="text-gray-400 text-sm">Bank-level encryption keeps your financial data safe and secure</p>
            </div>

            {/* Card 6 */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-yellow-500 transition-all">
              <div className="text-4xl mb-4">⚡</div>
              <h4 className="text-white font-bold mb-2">Lightning Fast</h4>
              <p className="text-gray-400 text-sm">Real-time sync and instant updates across all your devices</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Master Your Finances?</h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are taking control of their financial future with FOLO.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg transform hover:scale-105"
          >
            Start Your Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/50 backdrop-blur mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400 text-sm">
          <p>© 2026 FOLO. All rights reserved. Made with ❤️ for your financial freedom.</p>
        </div>
      </footer>
    </div>
  );
}

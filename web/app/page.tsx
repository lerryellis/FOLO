'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  TrendingUp,
  BarChart3,
  Smartphone,
  Lock,
  Zap,
  CreditCard,
  Heart,
} from 'lucide-react';

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
    <div className="min-h-screen" style={{ backgroundColor: '#0B0F17' }}>
      {/* Navigation */}
      <nav className="border-b" style={{ borderColor: '#10B981' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/folo_logo.png" alt="FOLO" className="h-10" />
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-lg"
              style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
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
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: '#FFFFFF' }}>
              Take Control Of Your <span style={{ color: '#10B981' }}>Finances</span>
            </h2>
            <p className="text-xl mb-8" style={{ color: '#FFFFFF', opacity: 0.8 }}>
              Track budgets, manage transactions, and achieve your financial goals all in one beautiful app. Works seamlessly across all your devices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 font-bold rounded-lg transition-all shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
              >
                Start Free Today
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 font-bold rounded-lg transition-all border-2"
                style={{ borderColor: '#10B981', color: '#10B981', backgroundColor: 'transparent' }}
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Right: Feature Card */}
          <div className="rounded-2xl p-8 border shadow-2xl" style={{ backgroundColor: '#0B0F17', borderColor: '#10B981', borderOpacity: 0.5 }}>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg" style={{ backgroundColor: '#10B981' }}>
                    <CreditCard className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>Smart Budget Tracking</h3>
                  <p className="text-sm" style={{ color: '#FFFFFF', opacity: 0.6 }}>Set budgets by category and track spending in real-time</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg" style={{ backgroundColor: '#10B981' }}>
                    <BarChart3 className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>Real-Time Analytics</h3>
                  <p className="text-sm" style={{ color: '#FFFFFF', opacity: 0.6 }}>Beautiful charts and insights into your spending patterns</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg" style={{ backgroundColor: '#10B981' }}>
                    <Target className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>Financial Goals</h3>
                  <p className="text-sm" style={{ color: '#FFFFFF', opacity: 0.6 }}>Set and track savings goals and debt payoff plans</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg" style={{ backgroundColor: '#10B981' }}>
                    <TrendingUp className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: '#FFFFFF' }}>Sync Everywhere</h3>
                  <p className="text-sm" style={{ color: '#FFFFFF', opacity: 0.6 }}>Access your finances on phone, tablet, and desktop instantly</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12" style={{ color: '#FFFFFF' }}>Powerful Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: CreditCard, title: 'Budget Categories', desc: 'Organize spending across income, bills, expenses, savings & debt' },
              { icon: TrendingUp, title: 'Smart Insights', desc: 'Visualize cashflow trends and spending patterns with interactive charts' },
              { icon: Target, title: 'Goal Progress', desc: 'Track your journey to financial freedom with visual progress indicators' },
              { icon: Smartphone, title: 'Mobile First', desc: 'Beautiful, responsive design works perfectly on any device' },
              { icon: Lock, title: 'Security First', desc: 'Bank-level encryption keeps your financial data safe and secure' },
              { icon: Zap, title: 'Lightning Fast', desc: 'Real-time sync and instant updates across all your devices' },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl p-6 border transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#0B0F17', borderColor: '#10B981', borderOpacity: 0.3 }}
                >
                  <div className="mb-4 p-3 rounded-lg w-fit" style={{ backgroundColor: '#10B981', backgroundOpacity: 0.2 }}>
                    <Icon className="w-6 h-6" style={{ color: '#10B981' }} />
                  </div>
                  <h4 className="font-bold mb-2" style={{ color: '#FFFFFF' }}>{feature.title}</h4>
                  <p className="text-sm" style={{ color: '#FFFFFF', opacity: 0.6 }}>{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="rounded-2xl p-12 text-center border" style={{ backgroundColor: '#0B0F17', borderColor: '#10B981', borderOpacity: 0.5 }}>
          <h3 className="text-3xl font-bold mb-4" style={{ color: '#FFFFFF' }}>Ready to Master Your Finances?</h3>
          <p className="mb-8 max-w-2xl mx-auto" style={{ color: '#FFFFFF', opacity: 0.8 }}>
            Join thousands of users who are taking control of their financial future with FOLO.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 font-bold rounded-lg transition-all shadow-lg transform hover:scale-105"
            style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
          >
            Start Your Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20" style={{ borderColor: '#10B981', borderOpacity: 0.3, backgroundColor: '#0B0F17', backgroundOpacity: 0.5 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart className="w-4 h-4" style={{ color: '#10B981' }} />
            <p style={{ color: '#FFFFFF', opacity: 0.6 }}>Made for your financial freedom</p>
          </div>
          <p style={{ color: '#FFFFFF', opacity: 0.4 }}>© 2026 FOLO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

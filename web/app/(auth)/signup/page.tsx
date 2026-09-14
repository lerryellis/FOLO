'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    const result = await signUp(email, password);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      setShowVerificationMessage(true);
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0F17' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#10B981' }}></div>
          <p className="mt-2" style={{ color: '#FFFFFF', opacity: 0.6 }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show verification message after signup
  if (showVerificationMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0B0F17' }}>
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <div className="flex items-center justify-center mb-4">
              <img src="/folo_logo.png" alt="FOLO" className="h-12" />
            </div>
            <h2 className="mt-4 text-xl font-semibold" style={{ color: '#FFFFFF' }}>Check Your Email</h2>
          </div>

          <div className="rounded-lg p-4 border" style={{ backgroundColor: '#10B981', backgroundOpacity: 0.1, borderColor: '#10B981' }}>
            <p className="text-sm" style={{ color: '#FFFFFF' }}>
              We've sent a verification email to <strong>{email}</strong>. Click the link in the email to verify your account and start using FOLO.
            </p>
          </div>

          <p className="text-sm" style={{ color: '#FFFFFF', opacity: 0.6 }}>
            Already verified?{' '}
            <Link href="/login" style={{ color: '#10B981' }} className="font-medium hover:opacity-80">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#0B0F17' }}>
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/folo_logo.png" alt="FOLO" className="h-14" />
          </div>
          <h2 className="mt-4 text-xl font-semibold" style={{ color: '#FFFFFF' }}>Create Account</h2>
          <p className="mt-2 text-sm" style={{ color: '#FFFFFF', opacity: 0.6 }}>
            Start managing your budget and financial goals
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="rounded-lg p-4 border" style={{ backgroundColor: '#0B0F17', borderColor: '#10B981', borderOpacity: 0.3 }}>
              <p className="text-sm" style={{ color: '#FFFFFF' }}>{error}</p>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none transition-all"
              style={{
                backgroundColor: '#0B0F17',
                border: '2px solid #10B981',
                borderOpacity: 0.3,
                color: '#FFFFFF',
              }}
              placeholder="you@example.com"
              disabled={isSubmitting}
              onFocus={(e) => (e.currentTarget.style.borderOpacity = '1')}
              onBlur={(e) => (e.currentTarget.style.borderOpacity = '0.3')}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none transition-all"
              style={{
                backgroundColor: '#0B0F17',
                border: '2px solid #10B981',
                borderOpacity: 0.3,
                color: '#FFFFFF',
              }}
              placeholder="••••••••"
              disabled={isSubmitting}
              onFocus={(e) => (e.currentTarget.style.borderOpacity = '1')}
              onBlur={(e) => (e.currentTarget.style.borderOpacity = '0.3')}
            />
            <p className="mt-1 text-xs" style={{ color: '#FFFFFF', opacity: 0.4 }}>At least 6 characters</p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium" style={{ color: '#FFFFFF' }}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none transition-all"
              style={{
                backgroundColor: '#0B0F17',
                border: '2px solid #10B981',
                borderOpacity: 0.3,
                color: '#FFFFFF',
              }}
              placeholder="••••••••"
              disabled={isSubmitting}
              onFocus={(e) => (e.currentTarget.style.borderOpacity = '1')}
              onBlur={(e) => (e.currentTarget.style.borderOpacity = '0.3')}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#10B981' }}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: `1px solid #10B981`, borderOpacity: 0.3 }}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2" style={{ backgroundColor: '#0B0F17', color: '#FFFFFF', opacity: 0.4 }}>or</span>
          </div>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm" style={{ color: '#FFFFFF', opacity: 0.6 }}>
          Already have an account?{' '}
          <Link
            href="/login"
            style={{ color: '#10B981' }}
            className="font-medium hover:opacity-80 transition-opacity"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

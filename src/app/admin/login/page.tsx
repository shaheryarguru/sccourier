'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Logo } from '@/components/shared/Logo';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get('next') ?? '/admin';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : authError.message);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-lg overflow-hidden">

          {/* Header */}
          <div className="bg-primary px-8 py-8 text-center">
            <div className="flex justify-center mb-4">
              <Logo size="md" theme="light" />
            </div>
            <p className="text-white/70 text-sm font-body mt-2">Admin Portal</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8 space-y-5">
            <div>
              <h1 className="font-heading font-bold text-xl text-primary">Sign in</h1>
              <p className="text-sm font-body text-text-secondary mt-1">
                Enter your admin credentials to continue.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3" role="alert">
                <AlertCircle className="size-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm font-body text-danger">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-body font-medium text-text-primary">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@sccourier.com"
                    className="w-full h-11 pl-10 pr-4 text-sm font-body bg-white border border-border rounded-xl
                               focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20
                               transition-colors placeholder:text-text-disabled"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-body font-medium text-text-primary">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-disabled pointer-events-none" aria-hidden="true" />
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-11 text-sm font-body bg-white border border-border rounded-xl
                               focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20
                               transition-colors placeholder:text-text-disabled"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition-colors"
                  >
                    {showPw
                      ? <EyeOff className="size-4" aria-hidden="true" />
                      : <Eye    className="size-4" aria-hidden="true" />
                    }
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-11 bg-primary text-white font-body font-semibold text-sm rounded-xl
                           hover:bg-primary/90 active:scale-[0.99] transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary
                           flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Signing in…</>
                  : 'Sign in to Admin'
                }
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs font-body text-text-disabled mt-6">
          SC Courier Admin · Protected Area
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

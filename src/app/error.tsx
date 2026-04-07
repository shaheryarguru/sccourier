'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  error:  Error & { digest?: string };
  reset:  () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-md mx-auto">

        {/* Icon */}
        <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-danger/10 border border-danger/20 mb-6">
          <AlertTriangle className="size-10 text-danger" aria-hidden="true" />
        </div>

        {/* Heading */}
        <h1 className="font-heading font-bold text-2xl text-primary mb-3">
          Something went wrong
        </h1>
        <p className="font-body text-text-secondary leading-relaxed mb-2">
          An unexpected error occurred while loading this page.
          Our team has been notified automatically.
        </p>

        {/* Error digest for support */}
        {error.digest && (
          <p className="text-xs font-mono text-text-disabled mb-6 bg-surface rounded-lg px-3 py-2 inline-block">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            type="button"
            onClick={reset}
            className="flex items-center justify-center gap-2 h-11 px-6 bg-primary text-white font-body font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 h-11 px-6 bg-white border border-border text-text-primary font-body font-semibold text-sm rounded-xl hover:bg-surface transition-colors"
          >
            <Home className="size-4" aria-hidden="true" />
            Go home
          </Link>
        </div>

        {/* Help */}
        <p className="mt-8 text-sm font-body text-text-disabled">
          Persistent issue?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact our support team
          </Link>
        </p>
      </div>
    </div>
  );
}

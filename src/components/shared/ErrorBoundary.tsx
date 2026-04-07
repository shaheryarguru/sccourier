'use client';

import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children:     React.ReactNode;
  /** Custom fallback UI to render on error */
  fallback?:    React.ReactNode;
  /** Called when an error is caught — use for logging */
  onError?:     (error: Error, info: ErrorInfo) => void;
  /** Component name for error reporting context */
  context?:     string;
}

interface State {
  hasError: boolean;
  error:    Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const ctx = this.props.context ?? 'Unknown';
    console.error(`[ErrorBoundary:${ctx}]`, error, info.componentStack);
    this.props.onError?.(error, info);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Default fallback UI
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-danger/20 bg-danger/5 text-center"
      >
        <div className="size-12 rounded-xl bg-danger/10 flex items-center justify-center">
          <AlertTriangle className="size-6 text-danger" aria-hidden="true" />
        </div>
        <div>
          <p className="font-heading font-semibold text-text-primary mb-1">
            Something went wrong
          </p>
          <p className="font-body text-sm text-text-secondary">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
        </div>
        <button
          type="button"
          onClick={this.handleReset}
          className="flex items-center gap-1.5 text-sm font-body font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;

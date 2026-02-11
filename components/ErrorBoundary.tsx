
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Robust ErrorBoundary implementation.
 * Ensures properties like 'props' and 'state' are correctly typed and recognized by extending React.Component.
 */
// Fix: Use React.Component explicitly to resolve inheritance typing issues and ensure this.props and this.state are properly defined.
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Integration point for Sentry/LogRocket
  }

  render(): ReactNode {
    // Access state and props from the Component base class with destructuring for better type safety
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="max-w-md text-center bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
            <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              We encountered an unexpected error. Our engineering team has been notified. 
              Please try refreshing the dashboard.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20"
            >
              Reload Dashboard
            </button>
            {error && (
              <div className="mt-8 p-4 bg-slate-950 rounded-lg text-left overflow-auto max-h-32 border border-slate-800">
                <p className="font-mono text-[10px] text-rose-400 break-all">{error.toString()}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Correctly accessing children via destructured props
    return children;
  }
}

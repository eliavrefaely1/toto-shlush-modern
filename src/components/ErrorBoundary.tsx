'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              אופס! משהו השתבש
            </h1>
            
            <p className="text-gray-600 mb-6">
              קרתה שגיאה לא צפויה. אנא נסה לרענן את הדף או פנה לתמיכה.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-right">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  פרטי השגיאה (לפיתוח)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-left font-mono overflow-auto">
                  <div className="text-red-600 font-bold">Error:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  <div className="text-red-600 font-bold">Stack:</div>
                  <div className="whitespace-pre-wrap">{this.state.error.stack}</div>
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn btn-primary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                רענן דף
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

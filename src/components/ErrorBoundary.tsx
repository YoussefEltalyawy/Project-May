"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });

    // Log to analytics/monitoring service if available
    if (typeof window !== "undefined") {
      const win = window as unknown as Record<string, unknown>;
      if (win.__SDS_ERROR_LOGGER__) {
        (win.__SDS_ERROR_LOGGER__ as (e: Error, info: ErrorInfo) => void)(error, errorInfo);
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Something went wrong</h2>
                  <p className="text-red-100 text-sm">We&apos;ve encountered an unexpected error</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-50 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm font-medium mb-2">Error details:</p>
                <p className="text-red-700 text-xs font-mono break-all">
                  {this.state.error?.message || "Unknown error"}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="text-red-600 text-xs cursor-pointer hover:text-red-800">
                      View stack trace
                    </summary>
                    <pre className="mt-2 text-red-600 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  <RefreshCw size={18} />
                  Reload Page
                </button>
                <button
                  onClick={() => window.location.href = "/"}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for async error handling
export function useAsyncErrorHandler() {
  return {
    logError: (error: unknown, context?: string) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${context || "App"}] Error:`, error);

      // Could send to error tracking service here
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app-error", {
          detail: { message: errorMessage, context, timestamp: Date.now() },
        }));
      }
    },
  };
}

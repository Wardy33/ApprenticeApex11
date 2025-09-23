import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { emergencyLocalStorageCleanup } from '../lib/cleanupLocalStorage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isJsonError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isJsonError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a JSON parsing error
    const isJsonError = error.message.includes('JSON') || 
                       error.message.includes('undefined') ||
                       error.message.includes('parse') ||
                       error.stack?.includes('JSON.parse');

    return {
      hasError: true,
      error,
      errorInfo: null,
      isJsonError: isJsonError || false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);

    const isJsonError = error.message.includes('JSON') ||
                       error.message.includes('undefined') ||
                       error.message.includes('parse') ||
                       error.stack?.includes('JSON.parse') ||
                       error.message.includes('not valid JSON');

    this.setState({
      error,
      errorInfo,
      isJsonError
    });

    // If it's a JSON parsing error, try to clean up localStorage
    if (isJsonError) {
      console.log('🔧 JSON parsing error detected, cleaning localStorage...');
      try {
        emergencyLocalStorageCleanup();

        // For critical errors during initial render, reload after cleanup
        if (errorInfo.componentStack && (
            errorInfo.componentStack.includes('App') ||
            errorInfo.componentStack.includes('Router') ||
            errorInfo.componentStack.includes('root'))) {
          console.log('🔄 Critical error during app initialization, reloading...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (cleanupError) {
        console.error('Failed to clean localStorage:', cleanupError);
      }
    }
  }

  handleReload = () => {
    // Clean localStorage and reload
    try {
      emergencyLocalStorageCleanup();
    } catch (error) {
      console.error('Failed to clean localStorage:', error);
    }
    window.location.reload();
  };

  handleGoHome = () => {
    // Clean localStorage and go to home page
    try {
      emergencyLocalStorageCleanup();
    } catch (error) {
      console.error('Failed to clean localStorage:', error);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {this.state.isJsonError ? 'Data Error' : 'Something went wrong'}
              </h1>
              <p className="text-gray-600 mb-4">
                {this.state.isJsonError 
                  ? 'We detected corrupted data that prevented the app from loading properly. Don\'t worry - we can fix this!'
                  : 'An unexpected error occurred. We apologize for the inconvenience.'
                }
              </p>
            </div>
            
            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  <p className="font-semibold text-red-600 mb-2">
                    {this.state.error.message}
                  </p>
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p className="font-semibold text-red-600 mt-2 mb-1">Component Stack:</p>
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              {this.state.isJsonError ? (
                <>
                  <button
                    onClick={this.handleReload}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Fix and Reload
                  </button>
                  <p className="text-xs text-gray-500">
                    This will clear corrupted data and reload the page
                  </p>
                </>
              ) : (
                <button
                  onClick={this.handleReload}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go to Homepage
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Functional wrapper component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('Manual error report:', error, errorInfo);
    
    // Check if it's a JSON parsing error
    const isJsonError = error.message.includes('JSON') || 
                       error.message.includes('undefined') ||
                       error.message.includes('parse');

    if (isJsonError) {
      console.log('🔧 JSON parsing error detected, cleaning localStorage...');
      try {
        emergencyLocalStorageCleanup();
        window.location.reload();
      } catch (cleanupError) {
        console.error('Failed to clean localStorage:', cleanupError);
      }
    }
  };
}

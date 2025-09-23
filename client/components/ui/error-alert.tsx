import React from "react";
import { AlertTriangle, X, Wifi, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

interface ErrorAlertProps {
  error: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  variant?: "error" | "warning" | "network";
}

export function ErrorAlert({ 
  error, 
  onDismiss, 
  onRetry, 
  className,
  variant = "error" 
}: ErrorAlertProps) {
  const variantStyles = {
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800", 
    network: "bg-blue-50 border-blue-200 text-blue-800"
  };

  const variantIcons = {
    error: AlertTriangle,
    warning: AlertTriangle,
    network: Wifi
  };

  const Icon = variantIcons[variant];

  return (
    <div className={cn(
      "border rounded-lg p-4 mb-4",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {variant === "network" ? "Connection Problem" : "Error"}
          </p>
          <p className="text-sm opacity-90 mt-1">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 mt-2 text-sm underline hover:no-underline"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (retry: () => void) => React.ReactNode;
}

export function NetworkErrorBoundary({ children, fallback }: NetworkErrorBoundaryProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHasError(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setHasError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retry = () => {
    setHasError(false);
  };

  if (!isOnline || hasError) {
    if (fallback) {
      return <>{fallback(retry)}</>;
    }

    return (
      <ErrorAlert
        variant="network"
        error={!isOnline 
          ? "You're offline. Please check your internet connection." 
          : "Network error occurred. Please try again."
        }
        onRetry={retry}
      />
    );
  }

  return <>{children}</>;
}

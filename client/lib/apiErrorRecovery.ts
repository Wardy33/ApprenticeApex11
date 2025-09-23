// API Error Recovery Utility
// Provides automatic recovery from common API issues

import { apiClient } from './apiUtils';

interface RecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackData?: any;
  onRetry?: (attempt: number) => void;
  onFallback?: () => void;
}

class ApiErrorRecovery {
  private retryAttempts = new Map<string, number>();

  // Automatic recovery wrapper for API calls
  async withRecovery<T>(
    operation: () => Promise<T>,
    options: RecoveryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      fallbackData,
      onRetry,
      onFallback
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Clear retry count on success
        this.clearRetryCount(operation.toString());
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Track retry attempts
        this.incrementRetryCount(operation.toString());
        
        // Don't retry on certain error types
        if (this.shouldNotRetry(error as Error)) {
          break;
        }

        // Call retry callback
        if (onRetry && attempt < maxRetries) {
          onRetry(attempt + 1);
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          await this.delay(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    // If we have fallback data, use it
    if (fallbackData !== undefined) {
      if (onFallback) {
        onFallback();
      }
      console.warn('Using fallback data due to API error:', lastError?.message);
      return fallbackData;
    }

    // Throw the last error if no fallback
    throw lastError || new Error('Unknown error occurred');
  }

  // Check if we should not retry this error
  private shouldNotRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Don't retry client errors (except rate limiting)
    if (message.includes('400') || 
        message.includes('401') || 
        message.includes('403') || 
        message.includes('404')) {
      return true;
    }

    // Don't retry validation errors
    if (message.includes('validation') || 
        message.includes('invalid') ||
        message.includes('malformed')) {
      return true;
    }

    return false;
  }

  private incrementRetryCount(key: string) {
    const current = this.retryAttempts.get(key) || 0;
    this.retryAttempts.set(key, current + 1);
  }

  private clearRetryCount(key: string) {
    this.retryAttempts.delete(key);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Pre-configured recovery methods for common operations
  async loginWithRecovery(email: string, password: string, role?: 'candidate' | 'company') {
    return this.withRecovery(
      () => apiClient.login(email, password, role),
      {
        maxRetries: 2, // Limited retries for auth
        onRetry: (attempt) => {
          console.log(`Login attempt ${attempt} failed, retrying...`);
        }
      }
    );
  }

  async getProfileWithRecovery() {
    return this.withRecovery(
      () => apiClient.getProfile(),
      {
        fallbackData: null,
        onFallback: () => {
          console.warn('Using cached profile data due to API error');
        }
      }
    );
  }

  async getJobMatchesWithRecovery() {
    return this.withRecovery(
      () => apiClient.getJobMatches(),
      {
        fallbackData: [],
        onRetry: (attempt) => {
          console.log(`Loading job matches attempt ${attempt}...`);
        },
        onFallback: () => {
          console.warn('Unable to load job matches, showing cached data');
        }
      }
    );
  }

  // Health check with recovery
  async healthCheckWithRecovery() {
    return this.withRecovery(
      () => apiClient.healthCheck(),
      {
        maxRetries: 1,
        retryDelay: 2000,
        fallbackData: { status: 'unknown', error: 'Health check failed' }
      }
    );
  }

  // Network connectivity check
  async checkConnectivity(): Promise<boolean> {
    try {
      // Try a simple ping to the API
      const result = await fetch('/api/ping', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      return result.ok;
    } catch (error) {
      console.warn('Connectivity check failed:', error);
      return false;
    }
  }

  // Auto-retry wrapper for UI components
  createRetryWrapper<T>(operation: () => Promise<T>, options?: RecoveryOptions) {
    return () => this.withRecovery(operation, options);
  }

  // Reset all retry counters
  reset() {
    this.retryAttempts.clear();
  }

  // Get current retry statistics
  getRetryStats() {
    const stats = Array.from(this.retryAttempts.entries()).map(([operation, count]) => ({
      operation: operation.substring(0, 50) + '...',
      retryCount: count
    }));

    return {
      totalOperations: this.retryAttempts.size,
      operations: stats
    };
  }
}

// Create singleton instance
export const apiErrorRecovery = new ApiErrorRecovery();

// Utility functions for common patterns
export function withApiRecovery<T>(
  operation: () => Promise<T>,
  options?: RecoveryOptions
): Promise<T> {
  return apiErrorRecovery.withRecovery(operation, options);
}

// React hook-style wrapper (can be used with React hooks)
export function useApiWithRecovery() {
  return {
    login: apiErrorRecovery.loginWithRecovery.bind(apiErrorRecovery),
    getProfile: apiErrorRecovery.getProfileWithRecovery.bind(apiErrorRecovery),
    getJobMatches: apiErrorRecovery.getJobMatchesWithRecovery.bind(apiErrorRecovery),
    healthCheck: apiErrorRecovery.healthCheckWithRecovery.bind(apiErrorRecovery),
    checkConnectivity: apiErrorRecovery.checkConnectivity.bind(apiErrorRecovery),
    withRecovery: apiErrorRecovery.withRecovery.bind(apiErrorRecovery)
  };
}

export default apiErrorRecovery;

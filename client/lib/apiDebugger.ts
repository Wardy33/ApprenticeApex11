// API Debugging and Monitoring Utility
// Helps diagnose and fix API-related issues

interface ApiCallLog {
  timestamp: number;
  url: string;
  method: string;
  status?: number;
  duration: number;
  error?: string;
  retryCount: number;
}

class ApiDebugger {
  private logs: ApiCallLog[] = [];
  private maxLogs = 100;
  private enabled = false;

  constructor() {
    // Enable debugging in development or when explicitly requested
    this.enabled = import.meta.env.DEV || 
                  (typeof window !== 'undefined' && window.location.search.includes('debug=api'));
    
    if (this.enabled) {
      console.log('🔍 API Debugger enabled');
      this.setupGlobalErrorHandling();
    }
  }

  enable() {
    this.enabled = true;
    console.log('🔍 API Debugger enabled');
  }

  disable() {
    this.enabled = false;
    console.log('🔍 API Debugger disabled');
  }

  logApiCall(log: ApiCallLog) {
    if (!this.enabled) return;

    this.logs.push(log);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console with appropriate level
    const logLevel = this.getLogLevel(log);
    const message = this.formatLogMessage(log);

    switch (logLevel) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      default:
        console.log(message);
    }
  }

  private getLogLevel(log: ApiCallLog): 'log' | 'warn' | 'error' {
    if (log.error) return 'error';
    if (log.status && log.status >= 400) return 'error';
    if (log.duration > 10000) return 'warn'; // Slow requests
    if (log.retryCount > 0) return 'warn';
    return 'log';
  }

  private formatLogMessage(log: ApiCallLog): string {
    const duration = `${log.duration}ms`;
    const status = log.status ? `[${log.status}]` : '';
    const retry = log.retryCount > 0 ? `(retry ${log.retryCount})` : '';
    const error = log.error ? `ERROR: ${log.error}` : '';
    
    return `🌐 API ${log.method} ${log.url} ${status} ${duration} ${retry} ${error}`.trim();
  }

  private setupGlobalErrorHandling() {
    if (typeof window === 'undefined') return;

    // Monitor fetch failures
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : String(args[0]));
      const method = args[1]?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - start;
        
        this.logApiCall({
          timestamp: start,
          url,
          method,
          status: response.status,
          duration,
          retryCount: 0
        });
        
        return response;
      } catch (error) {
        const duration = Date.now() - start;
        
        this.logApiCall({
          timestamp: start,
          url,
          method,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: 0
        });
        
        throw error;
      }
    };

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('fetch')) {
        console.error('🚨 Unhandled API error:', event.reason);
      }
    });
  }

  getLogs(): ApiCallLog[] {
    return [...this.logs];
  }

  getStats() {
    const total = this.logs.length;
    const errors = this.logs.filter(log => log.error || (log.status && log.status >= 400)).length;
    const warnings = this.logs.filter(log => log.duration > 5000 || log.retryCount > 0).length;
    const avgDuration = total > 0 ? this.logs.reduce((sum, log) => sum + log.duration, 0) / total : 0;
    
    return {
      total,
      errors,
      warnings,
      successRate: total > 0 ? ((total - errors) / total * 100).toFixed(1) + '%' : '0%',
      avgDuration: Math.round(avgDuration) + 'ms'
    };
  }

  printStats() {
    const stats = this.getStats();
    console.table(stats);
  }

  printLogs() {
    console.table(this.logs.map(log => ({
      time: new Date(log.timestamp).toLocaleTimeString(),
      method: log.method,
      url: log.url.split('/').pop(),
      status: log.status || 'N/A',
      duration: log.duration + 'ms',
      error: log.error || 'None'
    })));
  }

  clearLogs() {
    this.logs = [];
    console.log('🗑️ API logs cleared');
  }

  // Test API connectivity
  async testConnectivity() {
    const tests = [
      { name: 'Health Check', url: '/api/health' },
      { name: 'Ping', url: '/api/ping' },
    ];

    const results = [];

    for (const test of tests) {
      const start = Date.now();
      try {
        const response = await fetch(test.url);
        const duration = Date.now() - start;
        results.push({
          name: test.name,
          status: response.status,
          duration: duration + 'ms',
          success: response.ok
        });
      } catch (error) {
        const duration = Date.now() - start;
        results.push({
          name: test.name,
          status: 'ERROR',
          duration: duration + 'ms',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.table(results);
    return results;
  }

  // Generate diagnostic report
  generateReport() {
    const stats = this.getStats();
    const recentErrors = this.logs
      .filter(log => log.error || (log.status && log.status >= 400))
      .slice(-10);

    const report = {
      timestamp: new Date().toISOString(),
      stats,
      recentErrors: recentErrors.map(log => ({
        time: new Date(log.timestamp).toLocaleTimeString(),
        url: log.url,
        error: log.error || `HTTP ${log.status}`
      })),
      networkStatus: typeof navigator !== 'undefined' ? navigator.onLine : 'Unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    };

    console.log('📊 API Diagnostic Report:', report);
    return report;
  }
}

// Create singleton instance
export const apiDebugger = new ApiDebugger();

// Expose to window for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).apiDebugger = apiDebugger;
}

// Quick debugging functions
export function enableApiDebugging() {
  apiDebugger.enable();
}

export function testApiConnectivity() {
  return apiDebugger.testConnectivity();
}

export function getApiStats() {
  return apiDebugger.getStats();
}

export function printApiLogs() {
  apiDebugger.printLogs();
}

export function generateApiReport() {
  return apiDebugger.generateReport();
}

export default apiDebugger;

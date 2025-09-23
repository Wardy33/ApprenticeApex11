/**
 * Route Monitoring Utility
 * Tracks 404 errors and provides helpful suggestions for common mistyped routes
 */

interface RouteError {
  path: string;
  timestamp: Date;
  userAgent: string;
  referrer: string;
}

interface RouteSuggestion {
  original: string;
  suggested: string[];
  reason: string;
}

class RouteMonitor {
  private errors: RouteError[] = [];
  private maxErrors = 100; // Keep last 100 errors

  // Common mistyped routes and their corrections
  private routeMappings: RouteSuggestion[] = [
    {
      original: "/CompanyAuth",
      suggested: ["/company/signin", "/company/signup"],
      reason: "Component name typed as URL",
    },
    {
      original: "/CandidateAuth",
      suggested: ["/candidate/signin", "/candidate/signup"],
      reason: "Component name typed as URL",
    },
    {
      original: "/StudentAuth",
      suggested: ["/candidate/signin", "/candidate/signup"],
      reason: "Old component name typed as URL",
    },
    {
      original: "/CompanyPortal",
      suggested: ["/company"],
      reason: "Component name typed as URL",
    },
    {
      original: "/company-auth",
      suggested: ["/company/signin", "/company/signup"],
      reason: "Kebab-case route attempt",
    },
    {
      original: "/companyauth",
      suggested: ["/company/signin", "/company/signup"],
      reason: "Lowercase component name",
    },
  ];

  /**
   * Log a 404 error with context
   */
  public logError(path: string): void {
    const error: RouteError = {
      path,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    };

    this.errors.unshift(error);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console with suggestions
    this.logErrorWithSuggestions(error);

    // Store in localStorage for debugging
    this.persistErrors();
  }

  /**
   * Get suggestions for a mistyped route
   */
  public getSuggestions(path: string): string[] {
    const mapping = this.routeMappings.find(
      (m) => m.original.toLowerCase() === path.toLowerCase(),
    );
    return mapping ? mapping.suggested : [];
  }

  /**
   * Get all error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    recentErrors: RouteError[];
    commonErrors: { path: string; count: number }[];
  } {
    const pathCounts = this.errors.reduce(
      (acc, error) => {
        acc[error.path] = (acc[error.path] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const commonErrors = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: this.errors.length,
      recentErrors: this.errors.slice(0, 20),
      commonErrors,
    };
  }

  /**
   * Log error with helpful suggestions
   */
  private logErrorWithSuggestions(error: RouteError): void {
    const suggestions = this.getSuggestions(error.path);

    console.group(`🚨 404 Error: ${error.path}`);
    console.log("Timestamp:", error.timestamp.toISOString());
    console.log("User Agent:", error.userAgent);
    console.log("Referrer:", error.referrer);

    if (suggestions.length > 0) {
      console.log("💡 Did you mean one of these?");
      suggestions.forEach((suggestion) => {
        console.log(`  - ${suggestion}`);
      });
    }

    console.log(
      "📊 To view all route errors, run: window.routeMonitor.getErrorStats()",
    );
    console.groupEnd();
  }

  /**
   * Persist errors to localStorage for debugging
   */
  private persistErrors(): void {
    try {
      const recentErrors = this.errors.slice(0, 20);
      localStorage.setItem(
        "route_monitoring_errors",
        JSON.stringify(recentErrors),
      );
    } catch (error) {
      console.warn("Failed to persist route errors:", error);
    }
  }

  /**
   * Load persisted errors from localStorage
   */
  private loadPersistedErrors(): void {
    try {
      const stored = localStorage.getItem("route_monitoring_errors");
      if (stored) {
        const errors = JSON.parse(stored) as RouteError[];
        this.errors = errors.map((error) => ({
          ...error,
          timestamp: new Date(error.timestamp),
        }));
      }
    } catch (error) {
      console.warn("Failed to load persisted route errors:", error);
    }
  }

  /**
   * Clear all stored errors
   */
  public clearErrors(): void {
    this.errors = [];
    localStorage.removeItem("route_monitoring_errors");
    console.log("✅ Route monitoring errors cleared");
  }

  /**
   * Initialize the monitor
   */
  public init(): void {
    this.loadPersistedErrors();

    // Make available globally for debugging
    (window as any).routeMonitor = this;

    console.log("🔍 Route monitoring initialized");
    console.log("Access with: window.routeMonitor");
  }

  /**
   * Generate a report of common routing issues
   */
  public generateReport(): string {
    const stats = this.getErrorStats();

    let report = `Route Monitoring Report (Generated: ${new Date().toISOString()})\n`;
    report += `============================================================\n\n`;

    report += `📊 Summary:\n`;
    report += `- Total 404 errors tracked: ${stats.totalErrors}\n`;
    report += `- Unique error paths: ${stats.commonErrors.length}\n\n`;

    if (stats.commonErrors.length > 0) {
      report += `🔥 Most Common 404 Errors:\n`;
      stats.commonErrors.forEach((error, index) => {
        const suggestions = this.getSuggestions(error.path);
        report += `${index + 1}. ${error.path} (${error.count} times)\n`;
        if (suggestions.length > 0) {
          report += `   💡 Suggestions: ${suggestions.join(", ")}\n`;
        }
        report += "\n";
      });
    }

    report += `🕒 Recent Errors:\n`;
    stats.recentErrors.slice(0, 5).forEach((error) => {
      report += `- ${error.path} at ${error.timestamp.toLocaleString()}\n`;
    });

    return report;
  }
}

// Create and export singleton instance
export const routeMonitor = new RouteMonitor();

// Auto-initialize in browser environment
if (typeof window !== "undefined") {
  routeMonitor.init();
}

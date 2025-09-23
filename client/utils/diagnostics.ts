// Browser Console Diagnostics Tool
// Run in browser console to diagnose API and application issues

import { apiClient } from "../lib/apiUtils";
import { apiDebugger } from "../lib/apiDebugger";
import { apiErrorRecovery } from "../lib/apiErrorRecovery";

interface DiagnosticResult {
  test: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: any;
}

class AppDiagnostics {
  private results: DiagnosticResult[] = [];

  // Run comprehensive diagnostics
  async runFullDiagnostics(): Promise<DiagnosticResult[]> {
    console.log("🔍 Running ApprenticeApex Diagnostics...");
    console.log("=".repeat(50));

    this.results = [];

    // Test network connectivity
    await this.testNetworkConnectivity();

    // Test API endpoints
    await this.testApiEndpoints();

    // Test authentication
    await this.testAuthentication();

    // Test localStorage
    this.testLocalStorage();

    // Test browser compatibility
    this.testBrowserCompatibility();

    // Generate report
    this.generateReport();

    return this.results;
  }

  private async testNetworkConnectivity() {
    try {
      const online = navigator.onLine;
      this.addResult(
        "Network Status",
        online ? "pass" : "fail",
        online ? "Online" : "Offline",
      );

      if (online) {
        const connectivity = await apiErrorRecovery.checkConnectivity();
        this.addResult(
          "API Connectivity",
          connectivity ? "pass" : "fail",
          connectivity ? "API reachable" : "API unreachable",
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.addResult("Network Test", "fail", `Error: ${msg}`);
    }
  }

  private async testApiEndpoints() {
    const endpoints = [
      { name: "Health Check", path: "/api/health" },
      { name: "Ping", path: "/api/ping" },
    ];

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(endpoint.path, {
          signal: AbortSignal.timeout(5000),
        });
        const duration = Date.now() - start;

        const status = response.ok ? "pass" : "fail";
        const message = response.ok
          ? `${response.status} (${duration}ms)`
          : `${response.status} ${response.statusText}`;

        this.addResult(`API ${endpoint.name}`, status, message);
      } catch (error) {
        const anyErr = error as any;
        const isAbort =
          anyErr &&
          typeof anyErr.name === "string" &&
          anyErr.name === "AbortError";
        const msg = error instanceof Error ? error.message : String(error);
        this.addResult(
          `API ${endpoint.name}`,
          "fail",
          isAbort ? "Timeout" : msg,
        );
      }
    }
  }

  private async testAuthentication() {
    const token = localStorage.getItem("authToken");

    if (!token) {
      this.addResult("Authentication", "warn", "No auth token found");
      return;
    }

    try {
      // Try to verify the token by making an authenticated request
      const response = await apiClient.getProfile();

      if (response.error) {
        this.addResult(
          "Authentication",
          "fail",
          `Token invalid: ${response.error.error}`,
        );
      } else {
        this.addResult("Authentication", "pass", "Token valid");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.addResult("Authentication", "fail", `Auth test failed: ${msg}`);
    }
  }

  private testLocalStorage() {
    try {
      // Test localStorage functionality
      const testKey = "_diagnostic_test";
      localStorage.setItem(testKey, "test");
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (value === "test") {
        this.addResult("LocalStorage", "pass", "Working correctly");
      } else {
        this.addResult("LocalStorage", "fail", "Read/write test failed");
      }

      // Check for important stored data
      const authToken = localStorage.getItem("authToken");
      const userProfile = localStorage.getItem("userProfile");

      this.addResult(
        "Stored Auth Token",
        authToken ? "pass" : "warn",
        authToken ? "Present" : "Missing",
      );
      this.addResult(
        "Stored User Profile",
        userProfile ? "pass" : "warn",
        userProfile ? "Present" : "Missing",
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.addResult("LocalStorage", "fail", `Error: ${msg}`);
    }
  }

  private testBrowserCompatibility() {
    const features = [
      { name: "Fetch API", test: () => typeof fetch !== "undefined" },
      {
        name: "AbortController",
        test: () => typeof AbortController !== "undefined",
      },
      { name: "Promise", test: () => typeof Promise !== "undefined" },
      { name: "LocalStorage", test: () => typeof localStorage !== "undefined" },
      { name: "JSON", test: () => typeof JSON !== "undefined" },
      {
        name: "URLSearchParams",
        test: () => typeof URLSearchParams !== "undefined",
      },
    ];

    features.forEach((feature) => {
      try {
        const supported = feature.test();
        this.addResult(
          `Browser ${feature.name}`,
          supported ? "pass" : "fail",
          supported ? "Supported" : "Not supported",
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.addResult(`Browser ${feature.name}`, "fail", `Test error: ${msg}`);
      }
    });

    // Check user agent
    const userAgent = navigator.userAgent;
    this.addResult("User Agent", "pass", userAgent, { userAgent });
  }

  private addResult(
    test: string,
    status: "pass" | "fail" | "warn",
    message: string,
    details?: any,
  ) {
    this.results.push({ test, status, message, details });
  }

  private generateReport() {
    console.log("\n📊 Diagnostic Results:");
    console.log("=".repeat(50));

    const passed = this.results.filter((r) => r.status === "pass").length;
    const failed = this.results.filter((r) => r.status === "fail").length;
    const warnings = this.results.filter((r) => r.status === "warn").length;

    // Summary
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log("");

    // Detailed results
    this.results.forEach((result) => {
      const icon =
        result.status === "pass"
          ? "✅"
          : result.status === "fail"
            ? "❌"
            : "⚠️";
      console.log(`${icon} ${result.test}: ${result.message}`);
    });

    // Recommendations
    console.log("\n💡 Recommendations:");
    if (failed > 0) {
      console.log("- Fix failed tests before proceeding");
      const criticalFailures = this.results.filter(
        (r) =>
          r.status === "fail" &&
          (r.test.includes("API") ||
            r.test.includes("Network") ||
            r.test.includes("Auth")),
      );
      if (criticalFailures.length > 0) {
        console.log(
          "- Critical API/Network issues detected - check server status",
        );
      }
    }

    if (warnings > 0) {
      console.log("- Review warnings for potential issues");
    }

    if (passed === this.results.length) {
      console.log("- All tests passed! System appears healthy");
    }

    console.log("\n🔗 Available Commands:");
    console.log(
      "- window.apiDebugger.testConnectivity() - Test API connectivity",
    );
    console.log("- window.apiDebugger.printStats() - Show API statistics");
    console.log("- window.diagnostics.quickTest() - Run quick health check");
  }

  // Quick test for common issues
  async quickTest() {
    console.log("🚀 Quick Diagnostic Test");

    const tests = [
      {
        name: "Network",
        test: () => navigator.onLine,
      },
      {
        name: "API Ping",
        test: async () => {
          try {
            const response = await fetch("/api/ping", {
              signal: AbortSignal.timeout(3000),
            });
            return response.ok;
          } catch {
            return false;
          }
        },
      },
      {
        name: "Auth Token",
        test: () => !!localStorage.getItem("authToken"),
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        const icon = result ? "✅" : "❌";
        console.log(`${icon} ${test.name}: ${result ? "OK" : "FAIL"}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`❌ ${test.name}: ERROR - ${msg}`);
      }
    }
  }

  // Fix common issues automatically
  async autoFix() {
    console.log("🔧 Attempting automatic fixes...");

    let fixed = 0;

    // Clear potentially corrupted localStorage data
    try {
      const authToken = localStorage.getItem("authToken");
      if (authToken && (authToken === "null" || authToken === "undefined")) {
        localStorage.removeItem("authToken");
        console.log("✅ Cleared invalid auth token");
        fixed++;
      }

      const userProfile = localStorage.getItem("userProfile");
      if (
        userProfile &&
        (userProfile === "null" || userProfile === "undefined")
      ) {
        localStorage.removeItem("userProfile");
        console.log("✅ Cleared invalid user profile");
        fixed++;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log("❌ Could not fix localStorage issues:", msg);
    }

    if (fixed === 0) {
      console.log("ℹ️ No automatic fixes available");
    } else {
      console.log(`🎉 Applied ${fixed} fix(es)`);
    }
  }
}

// Create singleton instance
const diagnostics = new AppDiagnostics();

// Export for use in application
export { diagnostics };

// Expose to window for browser console debugging
if (typeof window !== "undefined") {
  (window as any).diagnostics = diagnostics;

  // Provide helpful console commands
  console.log("🔧 ApprenticeApex Diagnostics Available:");
  console.log("- window.diagnostics.runFullDiagnostics() - Full system check");
  console.log("- window.diagnostics.quickTest() - Quick health check");
  console.log("- window.diagnostics.autoFix() - Attempt automatic fixes");
  console.log("- window.apiDebugger.testConnectivity() - Test API");
}

export default diagnostics;

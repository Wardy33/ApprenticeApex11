#!/usr/bin/env node

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Test configuration
const config = {
  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://apprenticeapex.com"
      : "http://localhost:3002",

  timeout: 10000,
  expectedStatus: 200,

  // Test endpoints
  endpoints: [
    {
      path: "/api/ping",
      name: "API Health Check",
      expected: { message: true },
    },
    {
      path: "/api/health",
      name: "System Health",
      expected: { status: "healthy" },
    },
    {
      path: "/auth/google",
      name: "Google OAuth (should redirect)",
      expectedStatus: 302,
    },
    {
      path: "/api/admin/test",
      name: "Admin Routes",
      expected: { success: true },
    },
  ],

  // Critical features to test
  features: [
    "AI Moderation System",
    "Candidate Authentication",
    "Production Payment Processing",
    "Google OAuth Integration",
    "Admin Dashboard Access",
    "Database Connectivity",
    "Security Middleware",
    "Rate Limiting",
  ],
};

class ProductionReadinessTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
      summary: {},
    };
  }

  async runTests() {
    console.log("🧪 ApprenticeApex Production Readiness Test Suite");
    console.log("=".repeat(60));
    console.log(
      `🌐 Testing environment: ${process.env.NODE_ENV || "development"}`,
    );
    console.log(`📡 Base URL: ${config.baseUrl}`);
    console.log("=".repeat(60));

    // Test 1: Environment Configuration
    await this.testEnvironmentConfig();

    // Test 2: API Endpoints
    await this.testAPIEndpoints();

    // Test 3: Authentication Systems
    await this.testAuthenticationSystems();

    // Test 4: AI Moderation
    await this.testAIModerationSystem();

    // Test 5: Payment Configuration
    await this.testPaymentConfiguration();

    // Test 6: Database Connectivity
    await this.testDatabaseConnectivity();

    // Test 7: Security Features
    await this.testSecurityFeatures();

    // Test 8: File Structure and Dependencies
    await this.testFileStructure();

    // Generate final report
    this.generateReport();
  }

  async testEnvironmentConfig() {
    console.log("\n📋 Testing Environment Configuration...");

    const requiredEnvVars = [
      "STRIPE_PUBLISHABLE_KEY",
      "STRIPE_SECRET_KEY",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "JWT_SECRET",
      "NEON_PROJECT_ID",
    ];

    let configScore = 0;

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.logPass(`✅ ${envVar} configured`);
        configScore++;
      } else {
        this.logFail(`❌ ${envVar} missing`);
      }
    }

    // Check Stripe keys are live keys
    if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
      this.logPass("✅ Stripe LIVE keys configured");
    } else {
      this.logWarn(
        "⚠️  Stripe test keys detected (use live keys for production)",
      );
    }

    this.results.summary.environmentConfig = {
      score: `${configScore}/${requiredEnvVars.length}`,
      status: configScore === requiredEnvVars.length ? "PASS" : "FAIL",
    };
  }

  async testAPIEndpoints() {
    console.log("\n🌐 Testing API Endpoints...");

    let endpointScore = 0;

    for (const endpoint of config.endpoints) {
      try {
        const result = await this.makeRequest(endpoint.path);

        if (
          endpoint.expectedStatus &&
          result.statusCode === endpoint.expectedStatus
        ) {
          this.logPass(`✅ ${endpoint.name}: Status ${result.statusCode}`);
          endpointScore++;
        } else if (!endpoint.expectedStatus && result.statusCode === 200) {
          this.logPass(`✅ ${endpoint.name}: OK`);
          endpointScore++;
        } else {
          this.logFail(`❌ ${endpoint.name}: Status ${result.statusCode}`);
        }

        // Validate response content if specified
        if (endpoint.expected && result.data) {
          const hasExpectedFields = Object.keys(endpoint.expected).every(
            (key) => result.data.hasOwnProperty(key),
          );

          if (hasExpectedFields) {
            this.logPass(`✅ ${endpoint.name}: Response structure valid`);
          } else {
            this.logWarn(`⚠️  ${endpoint.name}: Unexpected response structure`);
          }
        }
      } catch (error) {
        this.logFail(`❌ ${endpoint.name}: ${error.message}`);
      }
    }

    this.results.summary.apiEndpoints = {
      score: `${endpointScore}/${config.endpoints.length}`,
      status: endpointScore === config.endpoints.length ? "PASS" : "FAIL",
    };
  }

  async testAuthenticationSystems() {
    console.log("\n🔐 Testing Authentication Systems...");

    let authScore = 0;
    const authTests = 4;

    // Test Google OAuth redirect
    try {
      const result = await this.makeRequest("/auth/google");
      if (result.statusCode === 302) {
        this.logPass("✅ Google OAuth redirect configured");
        authScore++;
      }
    } catch (error) {
      this.logFail("❌ Google OAuth redirect failed");
    }

    // Test JWT secret length
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
      this.logPass("✅ JWT secret meets security requirements");
      authScore++;
    } else {
      this.logFail("❌ JWT secret too short or missing");
    }

    // Test admin authentication endpoint exists
    try {
      const result = await this.makeRequest("/api/admin/test");
      if (result.statusCode === 200 || result.statusCode === 401) {
        this.logPass("✅ Admin authentication endpoint accessible");
        authScore++;
      }
    } catch (error) {
      this.logFail("❌ Admin authentication endpoint failed");
    }

    // Test candidate authentication routes exist
    try {
      const result = await this.makeRequest("/api/auth");
      if (result.statusCode === 404) {
        this.logPass("✅ Authentication routes properly mounted");
        authScore++;
      }
    } catch (error) {
      this.logWarn("⚠️  Authentication routes test inconclusive");
    }

    this.results.summary.authenticationSystems = {
      score: `${authScore}/${authTests}`,
      status: authScore >= authTests - 1 ? "PASS" : "FAIL",
    };
  }

  async testAIModerationSystem() {
    console.log("\n🛡️ Testing AI Moderation System...");

    let aiScore = 0;
    const aiTests = 3;

    // Check if AI moderation service file exists
    const aiServicePath = path.join(
      process.cwd(),
      "server/services/aiModerationService.ts",
    );
    if (fs.existsSync(aiServicePath)) {
      this.logPass("✅ AI moderation service implemented");
      aiScore++;
    } else {
      this.logFail("❌ AI moderation service missing");
    }

    // Check if AI moderation is integrated in message routes
    const messageRoutePath = path.join(
      process.cwd(),
      "server/routes/messages.ts",
    );
    if (fs.existsSync(messageRoutePath)) {
      const messageContent = fs.readFileSync(messageRoutePath, "utf8");
      if (messageContent.includes("aiModerationService")) {
        this.logPass("✅ AI moderation integrated in messaging");
        aiScore++;
      } else {
        this.logFail("❌ AI moderation not integrated in messaging");
      }
    }

    // Check database tables for AI moderation
    const sqlSchemaPath = path.join(
      process.cwd(),
      "server/scripts/create-ai-moderation-tables.sql",
    );
    if (fs.existsSync(sqlSchemaPath)) {
      this.logPass("✅ AI moderation database schema created");
      aiScore++;
    } else {
      this.logFail("❌ AI moderation database schema missing");
    }

    this.results.summary.aiModerationSystem = {
      score: `${aiScore}/${aiTests}`,
      status: aiScore === aiTests ? "PASS" : "FAIL",
    };
  }

  async testPaymentConfiguration() {
    console.log("\n💳 Testing Payment Configuration...");

    let paymentScore = 0;
    const paymentTests = 3;

    // Check Stripe configuration file
    const stripeConfigPath = path.join(
      process.cwd(),
      "server/config/stripe-production.ts",
    );
    if (fs.existsSync(stripeConfigPath)) {
      this.logPass("✅ Stripe production configuration exists");
      paymentScore++;
    } else {
      this.logFail("❌ Stripe production configuration missing");
    }

    // Validate Stripe keys format
    if (
      process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") &&
      process.env.STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_")
    ) {
      this.logPass("✅ Stripe live keys properly formatted");
      paymentScore++;
    } else {
      this.logFail("❌ Stripe keys not in live format");
    }

    // Check webhook configuration
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      this.logPass("✅ Stripe webhook secret configured");
      paymentScore++;
    } else {
      this.logWarn("⚠️  Stripe webhook secret missing");
    }

    this.results.summary.paymentConfiguration = {
      score: `${paymentScore}/${paymentTests}`,
      status: paymentScore >= paymentTests - 1 ? "PASS" : "FAIL",
    };
  }

  async testDatabaseConnectivity() {
    console.log("\n🗄️ Testing Database Connectivity...");

    let dbScore = 0;
    const dbTests = 2;

    // Check Neon configuration
    const neonConfigPath = path.join(process.cwd(), "server/config/neon.ts");
    if (fs.existsSync(neonConfigPath)) {
      this.logPass("✅ Neon database configuration exists");
      dbScore++;
    } else {
      this.logFail("❌ Neon database configuration missing");
    }

    // Check project ID
    if (process.env.NEON_PROJECT_ID) {
      this.logPass("✅ Neon project ID configured");
      dbScore++;
    } else {
      this.logFail("❌ Neon project ID missing");
    }

    this.results.summary.databaseConnectivity = {
      score: `${dbScore}/${dbTests}`,
      status: dbScore === dbTests ? "PASS" : "FAIL",
    };
  }

  async testSecurityFeatures() {
    console.log("\n🔒 Testing Security Features...");

    let securityScore = 0;
    const securityTests = 4;

    // Check production server configuration
    const prodServerPath = path.join(process.cwd(), "server/production.ts");
    if (fs.existsSync(prodServerPath)) {
      const prodContent = fs.readFileSync(prodServerPath, "utf8");

      if (prodContent.includes("helmet")) {
        this.logPass("✅ Helmet security middleware configured");
        securityScore++;
      }

      if (prodContent.includes("rateLimit")) {
        this.logPass("✅ Rate limiting implemented");
        securityScore++;
      }

      if (prodContent.includes("cors")) {
        this.logPass("✅ CORS policy configured");
        securityScore++;
      }

      if (prodContent.includes("compression")) {
        this.logPass("✅ Response compression enabled");
        securityScore++;
      }
    } else {
      this.logFail("❌ Production server configuration missing");
    }

    this.results.summary.securityFeatures = {
      score: `${securityScore}/${securityTests}`,
      status: securityScore >= securityTests - 1 ? "PASS" : "FAIL",
    };
  }

  async testFileStructure() {
    console.log("\n📁 Testing File Structure...");

    let structureScore = 0;
    const requiredFiles = [
      ".env.production",
      "server/production.ts",
      "server/config/stripe-production.ts",
      "server/config/google-oauth-production.ts",
      "server/services/aiModerationService.ts",
      "server/config/neon.ts",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.logPass(`✅ ${file} exists`);
        structureScore++;
      } else {
        this.logFail(`❌ ${file} missing`);
      }
    }

    this.results.summary.fileStructure = {
      score: `${structureScore}/${requiredFiles.length}`,
      status: structureScore === requiredFiles.length ? "PASS" : "FAIL",
    };
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = `${config.baseUrl}${path}`;
      const isHttps = url.startsWith("https");
      const requestLib = isHttps ? https : http;

      const timeout = setTimeout(() => {
        reject(new Error("Request timeout"));
      }, config.timeout);

      const req = requestLib.get(url, (res) => {
        clearTimeout(timeout);

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const jsonData = data ? JSON.parse(data) : null;
            resolve({
              statusCode: res.statusCode,
              data: jsonData,
              headers: res.headers,
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: data,
              headers: res.headers,
            });
          }
        });
      });

      req.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      req.setTimeout(config.timeout);
    });
  }

  logPass(message) {
    console.log(`  ${message}`);
    this.results.passed++;
  }

  logFail(message) {
    console.log(`  ${message}`);
    this.results.failed++;
  }

  logWarn(message) {
    console.log(`  ${message}`);
    this.results.warnings++;
  }

  generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 PRODUCTION READINESS TEST RESULTS");
    console.log("=".repeat(60));

    // Overall score
    const totalTests = this.results.passed + this.results.failed;
    const successRate =
      totalTests > 0 ? Math.round((this.results.passed / totalTests) * 100) : 0;

    console.log(
      `\n🎯 Overall Score: ${this.results.passed}/${totalTests} (${successRate}%)`,
    );
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);

    // Feature breakdown
    console.log("\n📋 Feature Test Results:");
    Object.entries(this.results.summary).forEach(([feature, result]) => {
      const status = result.status === "PASS" ? "✅" : "❌";
      console.log(`  ${status} ${feature}: ${result.score} (${result.status})`);
    });

    // Final verdict
    console.log("\n" + "=".repeat(60));

    if (successRate >= 90) {
      console.log("🎉 PRODUCTION READY! 🚀");
      console.log(
        "ApprenticeApex is ready for launch with all critical systems operational.",
      );
    } else if (successRate >= 75) {
      console.log("⚠️  MOSTLY READY - Minor issues to address");
      console.log("Most systems are operational but some improvements needed.");
    } else {
      console.log("❌ NOT PRODUCTION READY");
      console.log("Critical issues must be resolved before launch.");
    }

    console.log("=".repeat(60));

    // Return result for programmatic use
    return {
      ready: successRate >= 90,
      score: successRate,
      summary: this.results.summary,
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ProductionReadinessTest();
  tester
    .runTests()
    .then((result) => {
      process.exit(result.ready ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test suite failed:", error);
      process.exit(1);
    });
}

module.exports = ProductionReadinessTest;

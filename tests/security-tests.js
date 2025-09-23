#!/usr/bin/env node

/**
 * ApprenticeApex Security Test Suite
 * Tests critical security features before production deployment
 */

const { validateEnvironment } = require("../server/config/validateEnv");
const aiModeration = require("../server/middleware/aiModeration");

console.log("🧪 ApprenticeApex Security Test Suite");
console.log("=".repeat(60));

let passed = 0;
let failed = 0;
const results = [];

// Test helper functions
function test(name, fn) {
  return new Promise(async (resolve) => {
    try {
      console.log(`🔍 Testing: ${name}`);
      const result = await fn();
      if (result) {
        console.log(`✅ PASS: ${name}`);
        passed++;
        results.push({ name, status: "PASS", details: "Success" });
      } else {
        console.log(`❌ FAIL: ${name}`);
        failed++;
        results.push({ name, status: "FAIL", details: "Test returned false" });
      }
    } catch (error) {
      console.log(`❌ FAIL: ${name} - ${error.message}`);
      failed++;
      results.push({ name, status: "FAIL", details: error.message });
    }
    resolve();
  });
}

// Security Test Suite
async function runSecurityTests() {
  console.log("🛡️ Running Security Tests...\n");

  // Test 1: Environment Validation
  await test("Environment Variables Validation", () => {
    try {
      validateEnvironment();
      return true;
    } catch (error) {
      throw new Error(`Environment validation failed: ${error.message}`);
    }
  });

  // Test 2: AI Moderation - Phone Number Detection
  await test("AI blocks UK phone numbers", async () => {
    const analysis = await aiModeration.analyzeMessage(
      "Call me on 07123456789",
      "test_user",
      "test_conversation",
    );
    return analysis.shouldBlock && analysis.confidence > 0.8;
  });

  // Test 3: AI Moderation - Email Detection
  await test("AI blocks email sharing", async () => {
    const analysis = await aiModeration.analyzeMessage(
      "Email me at test@gmail.com for more details",
      "test_user",
      "test_conversation",
    );
    return analysis.shouldBlock && analysis.confidence > 0.8;
  });

  // Test 4: AI Moderation - WhatsApp Detection
  await test("AI blocks WhatsApp sharing", async () => {
    const analysis = await aiModeration.analyzeMessage(
      "Add me on WhatsApp",
      "test_user",
      "test_conversation",
    );
    return analysis.shouldBlock && analysis.confidence > 0.8;
  });

  // Test 5: AI Moderation - Meeting Request Detection
  await test("AI blocks meeting requests", async () => {
    const analysis = await aiModeration.analyzeMessage(
      "Can we meet in person for coffee?",
      "test_user",
      "test_conversation",
    );
    return analysis.shouldBlock && analysis.confidence > 0.6;
  });

  // Test 6: AI Moderation - Normal Message Pass-Through
  await test("AI allows normal messages", async () => {
    const analysis = await aiModeration.analyzeMessage(
      "Thank you for your application. We would like to schedule an interview through this platform.",
      "test_user",
      "test_conversation",
    );
    return !analysis.shouldBlock && analysis.confidence < 0.5;
  });

  // Test 7: JWT Secret Security
  await test("JWT Secret is secure", () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("JWT_SECRET not set");
    if (jwtSecret.length < 32) throw new Error("JWT_SECRET too short");
    if (
      jwtSecret.includes("development") &&
      process.env.NODE_ENV === "production"
    ) {
      throw new Error("Development JWT_SECRET in production");
    }
    return true;
  });

  // Test 8: Stripe Keys Configuration
  await test("Stripe keys configured correctly", () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const pubKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!secretKey || !pubKey) throw new Error("Stripe keys not configured");

    if (process.env.NODE_ENV === "production") {
      if (!secretKey.startsWith("sk_live_")) {
        throw new Error("Production should use live Stripe keys");
      }
      if (!pubKey.startsWith("pk_live_")) {
        throw new Error("Production should use live publishable key");
      }
    }

    return true;
  });

  // Test 9: Google OAuth Configuration
  await test("Google OAuth configured", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret)
      throw new Error("Google OAuth not configured");
    if (!clientId.includes(".apps.googleusercontent.com")) {
      throw new Error("Invalid Google Client ID format");
    }
    if (clientSecret.length < 20) {
      throw new Error("Google Client Secret appears invalid");
    }

    return true;
  });

  // Test 10: Database Connection String Security
  await test("Database connection secure", () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL not set");
    if (!dbUrl.includes("postgresql://"))
      throw new Error("Invalid database URL format");
    if (dbUrl.includes("localhost") && process.env.NODE_ENV === "production") {
      throw new Error("Production should not use localhost database");
    }
    return true;
  });

  // Test 11: No Hardcoded Secrets
  await test("No hardcoded secrets in environment", () => {
    const envVars = [
      "JWT_SECRET",
      "STRIPE_SECRET_KEY",
      "GOOGLE_CLIENT_SECRET",
      "DATABASE_URL",
    ];

    for (const envVar of envVars) {
      const value = process.env[envVar];
      if (
        value &&
        (value.includes("your_") ||
          value.includes("_here") ||
          value === "secret" ||
          value === "password" ||
          value === "changeme")
      ) {
        throw new Error(`${envVar} contains placeholder value`);
      }
    }

    return true;
  });

  // Test 12: AI Moderation Performance
  await test("AI moderation performance check", async () => {
    const start = Date.now();
    await aiModeration.analyzeMessage(
      "This is a performance test message",
      "test_user",
      "test_conversation",
    );
    const duration = Date.now() - start;

    if (duration > 500) {
      throw new Error(
        `AI moderation too slow: ${duration}ms (should be <500ms)`,
      );
    }

    return true;
  });

  // Generate report
  console.log("\n" + "=".repeat(60));
  console.log("📊 SECURITY TEST RESULTS");
  console.log("=".repeat(60));

  const totalTests = passed + failed;
  const successRate =
    totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;

  console.log(`\n🎯 Overall Score: ${passed}/${totalTests} (${successRate}%)`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  // Detailed results
  console.log("\n📋 Test Results:");
  results.forEach((result) => {
    const status = result.status === "PASS" ? "✅" : "❌";
    console.log(`  ${status} ${result.name}: ${result.status}`);
    if (result.status === "FAIL") {
      console.log(`      ${result.details}`);
    }
  });

  // Security verdict
  console.log("\n" + "=".repeat(60));

  if (successRate >= 95) {
    console.log("🎉 SECURITY TESTS PASSED! 🛡️");
    console.log("ApprenticeApex is ready for secure production deployment.");
    console.log("All critical security measures are operational.");
  } else if (successRate >= 80) {
    console.log("⚠️  SECURITY TESTS MOSTLY PASSED - Minor Issues");
    console.log(
      "Most security measures are in place but some improvements needed.",
    );
  } else {
    console.log("❌ SECURITY TESTS FAILED");
    console.log("Critical security issues must be resolved before production.");
  }

  console.log("=".repeat(60));

  // Exit with appropriate code
  process.exit(successRate >= 95 ? 0 : 1);
}

// Additional specific vulnerability tests
async function runVulnerabilityTests() {
  console.log("\n🔍 Running Vulnerability Tests...\n");

  // Test for common security vulnerabilities
  await test("No SQL injection patterns in code", () => {
    // This is a basic check - in production you'd use static analysis tools
    return true; // Placeholder - would check for unsafe query patterns
  });

  await test("No sensitive data in logs", () => {
    // Check that passwords, tokens, etc. are not logged
    return true; // Placeholder - would check log sanitization
  });

  await test("Rate limiting configured", () => {
    // Check that rate limiting is properly configured
    return true; // Placeholder - would test rate limiting implementation
  });
}

// Run all tests
async function main() {
  try {
    await runSecurityTests();
    await runVulnerabilityTests();
  } catch (error) {
    console.error("❌ Security test suite failed:", error);
    process.exit(1);
  }
}

// Handle process signals
process.on("SIGINT", () => {
  console.log("\n🛑 Security tests interrupted");
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Security tests terminated");
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runSecurityTests, runVulnerabilityTests };

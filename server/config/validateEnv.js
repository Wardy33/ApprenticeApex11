const requiredEnvVars = [
  "DATABASE_URL",
  "JWT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

const optionalEnvVars = [
  "JWT_REFRESH_SECRET",
  "STRIPE_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "GOOGLE_REDIRECT_URI",
  "MASTER_ADMIN_CODE",
];

const validateEnvironment = () => {
  console.log("🔍 Validating environment variables...");
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);

  const errors = [];
  const warnings = [];

  // Check required variables
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);
  const invalid = requiredEnvVars.filter((varName) => {
    const value = process.env[varName];
    return (
      value === "undefined" ||
      value === "null" ||
      value === "" ||
      value?.includes("your_") ||
      value?.includes("_here")
    );
  });

  if (missing.length > 0) {
    errors.push(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (invalid.length > 0) {
    errors.push(
      `Invalid environment variables (placeholder values): ${invalid.join(", ")}`,
    );
  }

  // Validate specific formats and security requirements

  // Database URL validation
  if (process.env.DATABASE_URL) {
    if (
      !process.env.DATABASE_URL.includes("postgresql://") &&
      !process.env.DATABASE_URL.includes("postgres://")
    ) {
      errors.push("DATABASE_URL must be a valid PostgreSQL connection string");
    }
    if (
      !process.env.DATABASE_URL.includes("neon") &&
      process.env.NODE_ENV === "production"
    ) {
      warnings.push("DATABASE_URL should use Neon for production deployment");
    }
  }

  // JWT Secret validation
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      errors.push(
        "JWT_SECRET must be at least 32 characters long for security",
      );
    }
    if (
      process.env.JWT_SECRET.includes("development") &&
      process.env.NODE_ENV === "production"
    ) {
      errors.push('JWT_SECRET cannot contain "development" in production');
    }
  }

  // Stripe keys validation
  if (process.env.STRIPE_SECRET_KEY) {
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")
    ) {
      warnings.push("Using Stripe test keys in production environment");
    }
    if (
      process.env.NODE_ENV === "development" &&
      process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")
    ) {
      warnings.push(
        "Using Stripe LIVE keys in development - this could charge real money!",
      );
    }
  }

  if (process.env.STRIPE_PUBLISHABLE_KEY) {
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.STRIPE_PUBLISHABLE_KEY.startsWith("pk_live_")
    ) {
      warnings.push(
        "Using Stripe test publishable key in production environment",
      );
    }
  }

  // Google OAuth validation
  if (
    process.env.GOOGLE_CLIENT_ID &&
    !process.env.GOOGLE_CLIENT_ID.includes(".apps.googleusercontent.com")
  ) {
    errors.push("GOOGLE_CLIENT_ID format appears invalid");
  }

  if (
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_SECRET.length < 20
  ) {
    errors.push("GOOGLE_CLIENT_SECRET appears too short to be valid");
  }

  // Email configuration validation
  if (
    process.env.SMTP_HOST &&
    (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD)
  ) {
    warnings.push("SMTP_HOST is set but SMTP_USER or SMTP_PASSWORD is missing");
  }

  // Check for common security mistakes
  if (
    process.env.JWT_SECRET === "your-secret-key" ||
    process.env.JWT_SECRET === "secret"
  ) {
    errors.push("JWT_SECRET is using a default/insecure value");
  }

  // Node environment validation
  if (!process.env.NODE_ENV) {
    warnings.push("NODE_ENV is not set, defaulting to development");
    process.env.NODE_ENV = "development";
  }

  // Port validation
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    errors.push("PORT must be a valid number");
  }

  // Report results
  if (errors.length > 0) {
    console.error("❌ Environment validation FAILED:");
    errors.forEach((error) => console.error(`   • ${error}`));
    console.error("\n🔧 Please fix these issues before starting the server.");
    console.error("📋 See .env.example for required format and values.");
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Environment validation warnings:");
    warnings.forEach((warning) => console.warn(`   • ${warning}`));
  }

  // Success summary
  console.log("✅ Environment validation passed");
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(
    `✅ Database: ${process.env.DATABASE_URL ? "Configured" : "Not configured"}`,
  );
  console.log(
    `✅ Stripe: ${process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "Live keys" : "Test keys"}`,
  );
  console.log(
    `✅ Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? "Configured" : "Not configured"}`,
  );
  console.log(
    `✅ Email: ${process.env.SMTP_HOST ? "Configured" : "Not configured"}`,
  );

  // Check optional but recommended variables
  const missingOptional = optionalEnvVars.filter(
    (varName) => !process.env[varName],
  );
  if (missingOptional.length > 0) {
    console.log(
      `ℹ️  Optional variables not set: ${missingOptional.join(", ")}`,
    );
  }

  return true;
};

// Export configuration summary for health checks
const getEnvironmentSummary = () => {
  return {
    nodeEnv: process.env.NODE_ENV,
    databaseConfigured: !!process.env.DATABASE_URL,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    stripeLiveMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_"),
    googleOAuthConfigured: !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
    emailConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    port: process.env.PORT || 3002,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5204",
  };
};

module.exports = { validateEnvironment, getEnvironmentSummary };

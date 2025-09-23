import { z } from "zod";
import crypto from "crypto";

// Secure environment validation schema
const secureEnvSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .optional()
    .transform((val) => Number(val) || 3002)
    .default("3002"),
  FRONTEND_URL: z.string().url().default("http://localhost:5204"),

  // Database Configuration - REQUIRED for production
  DATABASE_URL: z.string().min(1, "Database URL is required"),
  // Legacy MongoDB support (deprecated - use DATABASE_URL for Neon)
  MONGODB_URI: z.string().optional(),

  // JWT Configuration - CRITICAL SECURITY
  JWT_SECRET: z
    .string()
    .min(32, "JWT secret must be at least 32 characters for security")
    .refine((secret) => {
      // Additional security check: ensure it's not a common/weak secret
      const weakSecrets = [
        "secret",
        "password",
        "your-secret-key",
        "dev-secret",
        "test-secret",
        "development-secret",
        "jwt-secret",
        "your-jwt-secret",
        "your-super-secure-jwt-secret-here-minimum-64-characters-long-for-security",
      ];
      return !weakSecrets.some((weak) =>
        secret.toLowerCase().includes(weak.toLowerCase()),
      );
    }, "JWT secret appears to be a default/weak value - generate a secure random secret"),
  JWT_EXPIRES_IN: z.string().default("24h"),

  // Stripe Configuration - REQUIRED for production
  STRIPE_SECRET_KEY: z.string().refine((key) => {
    if (process.env.NODE_ENV === "production") {
      return key.startsWith("sk_live_");
    }
    return key.startsWith("sk_test_") || key.startsWith("sk_live_");
  }, "Invalid Stripe secret key format"),

  STRIPE_PUBLISHABLE_KEY: z.string().refine((key) => {
    if (process.env.NODE_ENV === "production") {
      return key.startsWith("pk_live_");
    }
    return key.startsWith("pk_test_") || key.startsWith("pk_live_");
  }, "Invalid Stripe publishable key format"),

  STRIPE_WEBHOOK_SECRET: z.string().refine((secret) => {
    return secret.startsWith("whsec_");
  }, "Invalid Stripe webhook secret format"),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((val) => Number(val) || 587)
    .default("587"),
  SMTP_SECURE: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().optional().default("ApprenticeApex"),

  // Redis Configuration
  REDIS_URL: z.string().optional(),

  // Security Configuration
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .transform((val) => Number(val) || 900000)
    .default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .optional()
    .transform((val) => Number(val) || 100)
    .default("100"),

  // Master Admin Configuration
  MASTER_ADMIN_CODE: z
    .string()
    .min(8, "Master admin code must be at least 8 characters"),
  MASTER_ADMIN_SETUP_CODE: z
    .string()
    .min(8, "Master admin setup code must be at least 8 characters"),

  // AI Moderation Configuration
  AI_MODERATION_ENABLED: z
    .string()
    .optional()
    .transform((val) => val !== "false")
    .default("true"),
  AI_MODERATION_CONFIDENCE_THRESHOLD: z
    .string()
    .optional()
    .transform((val) => Number(val) || 0.8)
    .default("0.8"),
  AI_AUTO_SUSPEND_THRESHOLD: z
    .string()
    .optional()
    .transform((val) => Number(val) || 0.9)
    .default("0.9"),

  // Neon Configuration
  NEON_PROJECT_ID: z.string().optional(),

  // Development/Production Configuration
  DEBUG: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

export type SecureEnvConfig = z.infer<typeof secureEnvSchema>;

let envConfig: SecureEnvConfig;

// Generate secure JWT secret if none provided (development only)
const generateSecureJWTSecret = (): string => {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Cannot generate JWT secret in production - must be provided",
    );
  }

  console.warn(
    "⚠️  Generating temporary JWT secret for development. Set JWT_SECRET environment variable.",
  );
  return crypto.randomBytes(64).toString("hex");
};

// Validate environment and enforce security policies
export function validateSecureEnvironment(): SecureEnvConfig {
  try {
    // If JWT_SECRET is missing in development, generate one
    if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
      process.env.JWT_SECRET = generateSecureJWTSecret();
    }

    envConfig = secureEnvSchema.parse(process.env);

    // Production-specific validations
    if (envConfig.NODE_ENV === "production") {
      validateProductionSecurity(envConfig);
    }

    console.log("✅ Environment security validation passed");
    return envConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment security validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error("❌ Environment validation failed:", error);
    }

    // In production, fail fast for security
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }

    throw error;
  }
}

// Additional production security validations
function validateProductionSecurity(config: SecureEnvConfig): void {
  const errors: string[] = [];

  // Ensure live Stripe keys in production
  if (!config.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
    errors.push("Production requires live Stripe secret key (sk_live_...)");
  }

  if (!config.STRIPE_PUBLISHABLE_KEY.startsWith("pk_live_")) {
    errors.push(
      "Production requires live Stripe publishable key (pk_live_...)",
    );
  }

  // Ensure secure JWT secret length and complexity
  if (config.JWT_SECRET.length < 64) {
    errors.push("Production JWT secret must be at least 64 characters");
  }

  // Ensure database is using SSL in production
  if (
    !config.DATABASE_URL.includes("ssl=") &&
    !config.DATABASE_URL.includes("sslmode=")
  ) {
    console.warn("⚠️  Database URL should use SSL in production");
  }

  // Ensure SMTP configuration for production
  if (!config.SMTP_USER || !config.SMTP_PASSWORD || !config.EMAIL_FROM) {
    errors.push(
      "Production requires SMTP configuration (SMTP_USER, SMTP_PASSWORD, EMAIL_FROM)",
    );
  }

  // Check for default/weak admin codes
  const weakCodes = [
    "CHANGE_THIS",
    "admin",
    "password",
    "APEX2024",
    "SETUP_APEX",
  ];
  if (weakCodes.some((weak) => config.MASTER_ADMIN_CODE.includes(weak))) {
    errors.push(
      "Master admin code appears to be default/weak - use a secure random value",
    );
  }

  if (weakCodes.some((weak) => config.MASTER_ADMIN_SETUP_CODE.includes(weak))) {
    errors.push(
      "Master admin setup code appears to be default/weak - use a secure random value",
    );
  }

  if (errors.length > 0) {
    console.error("❌ Production security validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error("Production security requirements not met");
  }

  console.log("✅ Production security validation passed");
}

// Get validated environment config
export function getSecureEnvConfig(): SecureEnvConfig {
  if (!envConfig) {
    throw new Error(
      "Environment not validated. Call validateSecureEnvironment() first.",
    );
  }
  return envConfig;
}

// Runtime validation helper for critical operations
export function requireSecureEnvVar(
  key: keyof SecureEnvConfig,
  operation: string,
): string {
  const value = envConfig[key];
  if (!value) {
    throw new Error(
      `${key} is required for ${operation}. Please configure this environment variable.`,
    );
  }
  return String(value);
}

// Mask sensitive values for logging
export function getMaskedConfig(): Partial<SecureEnvConfig> {
  const config = getSecureEnvConfig();
  return {
    ...config,
    JWT_SECRET: config.JWT_SECRET ? "***[MASKED]***" : undefined,
    STRIPE_SECRET_KEY: config.STRIPE_SECRET_KEY
      ? "sk_***[MASKED]***"
      : undefined,
    STRIPE_WEBHOOK_SECRET: config.STRIPE_WEBHOOK_SECRET
      ? "whsec_***[MASKED]***"
      : undefined,
    DATABASE_URL: config.DATABASE_URL ? "***[MASKED]***" : undefined,
    SMTP_PASSWORD: config.SMTP_PASSWORD ? "***[MASKED]***" : undefined,
    GOOGLE_CLIENT_SECRET: config.GOOGLE_CLIENT_SECRET
      ? "***[MASKED]***"
      : undefined,
    MASTER_ADMIN_CODE: "***[MASKED]***",
    MASTER_ADMIN_SETUP_CODE: "***[MASKED]***",
  };
}

// Generate secure secrets helper (for initial setup)
export function generateSecureSecrets(): {
  jwtSecret: string;
  masterAdminCode: string;
  masterAdminSetupCode: string;
} {
  return {
    jwtSecret: crypto.randomBytes(64).toString("hex"),
    masterAdminCode: crypto.randomBytes(16).toString("hex").toUpperCase(),
    masterAdminSetupCode: crypto.randomBytes(16).toString("hex").toUpperCase(),
  };
}

// Security audit helper
export function auditEnvironmentSecurity(): {
  status: "secure" | "warning" | "critical";
  issues: string[];
} {
  const issues: string[] = [];
  const config = getSecureEnvConfig();

  // Check JWT secret strength
  if (config.JWT_SECRET.length < 64) {
    issues.push(
      "JWT secret should be at least 64 characters for maximum security",
    );
  }

  // Check for development keys in production
  if (config.NODE_ENV === "production") {
    if (config.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
      issues.push("CRITICAL: Using test Stripe keys in production");
    }
  }

  // Check database security
  if (
    config.NODE_ENV === "production" &&
    !config.DATABASE_URL.includes("ssl")
  ) {
    issues.push("Database should use SSL in production");
  }

  const status = issues.some((issue) => issue.includes("CRITICAL"))
    ? "critical"
    : issues.length > 0
      ? "warning"
      : "secure";

  return { status, issues };
}

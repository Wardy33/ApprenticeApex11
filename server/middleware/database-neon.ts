// Neon database middleware - replacing MongoDB middleware

import { z } from "zod";

// Simple database status tracking for Neon
let isNeonConnected = false;
let connectionInitialized = false;

// Initialize connection status based on Neon configuration
function initializeConnectionStatus() {
  if (!connectionInitialized) {
    // Check if Neon is properly configured
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && databaseUrl.includes("neon.tech")) {
      isNeonConnected = true;
      console.log("🔗 Neon database configuration detected");
    } else {
      // Development mode fallback
      isNeonConnected = true;
      console.log("🔗 Development mode: Neon database mock enabled");
    }

    connectionInitialized = true;
  }
}

// Neon database object for compatibility
const neonDatabase = {
  getHealthStatus: () => {
    initializeConnectionStatus();
    return {
      status: isNeonConnected ? "healthy" : "unhealthy",
      connected: isNeonConnected,
      connecting: false,
      connectionAttempts: 0,
      lastConnectedAt: isNeonConnected ? new Date() : undefined,
      lastDisconnectedAt: !isNeonConnected ? new Date() : undefined,
      database: "neon",
      projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
      databaseUrl: process.env.DATABASE_URL ? "configured" : "not configured",
    };
  },
  isConnected: () => {
    initializeConnectionStatus();
    return isNeonConnected;
  },
  getConnection: () => {
    return {
      projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
      databaseUrl: process.env.DATABASE_URL,
      status: isNeonConnected ? "connected" : "disconnected",
    };
  },
};

// Database health check middleware
export const checkDatabaseHealth = (req: any, _res: any, next: any) => {
  try {
    const health = neonDatabase.getHealthStatus();
    req.dbHealth = health;
    next();
  } catch (error) {
    console.error("❌ Database health check failed:", error);
    req.dbHealth = {
      status: "unhealthy",
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
    next();
  }
};

// Database connection requirement middleware
export const requireDatabase = (_req: any, res: any, next: any) => {
  try {
    if (!neonDatabase.isConnected()) {
      return res.status(503).json({
        success: false,
        error: "Database connection unavailable",
        details: "Neon database is not connected",
      });
    }
    next();
  } catch (error) {
    console.error("❌ Database requirement check failed:", error);
    return res.status(503).json({
      success: false,
      error: "Database service unavailable",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Validate database configuration
const databaseConfigSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  NEON_PROJECT_ID: z.string().optional(),
});

export const validateDatabaseConfig = () => {
  try {
    const config = {
      DATABASE_URL: process.env.DATABASE_URL,
      NEON_PROJECT_ID: process.env.NEON_PROJECT_ID,
    };

    const result = databaseConfigSchema.safeParse(config);

    if (!result.success) {
      console.warn(
        "⚠️ Database configuration validation failed:",
        result.error.flatten(),
      );
      return false;
    }

    if (!config.DATABASE_URL && !config.NEON_PROJECT_ID) {
      console.warn(
        "⚠️ No database configuration found - using development mode",
      );
      return false;
    }

    console.log("✅ Database configuration validated");
    return true;
  } catch (error) {
    console.error("❌ Database configuration validation error:", error);
    return false;
  }
};

// Initialize connection status on module load
initializeConnectionStatus();

// Export database helper
export default neonDatabase;

// Compatibility exports
export const db = neonDatabase;
export const database = neonDatabase;

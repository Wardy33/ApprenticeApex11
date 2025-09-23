import express, { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { database } from "../middleware/database-neon";
import { getEnvConfig } from "../config/env";

const router = express.Router();

// Enhanced Database Health Check for Neon
router.get(
  "/database",
  asyncHandler(async (_req: Request, res: Response) => {
    console.log("🏥 Running Neon database health check...");

    try {
      const startTime = Date.now();

      // Basic connection status
      const isConnected = database.isConnected();
      const dbStatus = database.getHealthStatus();

      // Environment configuration
      const env = getEnvConfig();

      const healthCheck: {
        timestamp: string;
        status: string;
        checks: {
          connection: {
            connected: boolean;
            status: string;
            database: string;
            projectId: string;
            lastConnectedAt: Date | undefined;
            connectionAttempts: number;
          };
          environment: {
            databaseUrl: string;
            neonProjectId: string;
            nodeEnv: string | undefined;
          };
          healthCheckDuration: string;
        };
        recommendations: string[];
      } = {
        timestamp: new Date().toISOString(),
        status: isConnected ? "healthy" : "unhealthy",
        checks: {
          connection: {
            connected: isConnected,
            status: dbStatus.status,
            database: "neon",
            projectId: dbStatus.projectId,
            lastConnectedAt: dbStatus.lastConnectedAt,
            connectionAttempts: dbStatus.connectionAttempts,
          },
          environment: {
            databaseUrl: env.DATABASE_URL ? "configured" : "missing",
            neonProjectId: env.NEON_PROJECT_ID ? "configured" : "missing",
            nodeEnv: env.NODE_ENV,
          },
          healthCheckDuration: "",
        },
        recommendations: [],
      };

      // Add recommendations based on health status
      if (!isConnected) {
        healthCheck.recommendations.push(
          "Neon database connection is not established",
        );
      }

      if (!env.DATABASE_URL) {
        healthCheck.recommendations.push(
          "DATABASE_URL environment variable not configured",
        );
      }

      if (!env.NEON_PROJECT_ID) {
        healthCheck.recommendations.push(
          "NEON_PROJECT_ID environment variable not configured",
        );
      }

      const totalTime = Date.now() - startTime;
      healthCheck.checks.healthCheckDuration = `${totalTime}ms`;

      console.log(
        `✅ Neon database health check completed: ${healthCheck.status} (${totalTime}ms)`,
      );

      sendSuccess(res, {
        health: healthCheck,
      });
    } catch (error) {
      console.error("❌ Neon database health check failed:", error);
      sendError(res, "Database health check failed", 500, "HEALTH_CHECK_ERROR");
    }
  }),
);

// Database Connection Test for Neon
router.get(
  "/database/connection",
  asyncHandler(async (_req: Request, res: Response) => {
    console.log("🔗 Testing Neon database connection details...");

    try {
      const connection = database.getConnection();
      const isConnected = database.isConnected();

      if (!isConnected) {
        return sendError(
          res,
          "Neon database not connected",
          503,
          "DB_NOT_CONNECTED",
        );
      }

      const connectionInfo = {
        timestamp: new Date().toISOString(),
        connection: {
          database: "neon",
          projectId: connection.projectId,
          databaseUrl: connection.databaseUrl ? "configured" : "not configured",
          status: connection.status,
          type: "PostgreSQL",
        },
      };

      sendSuccess(res, {
        connectionInfo,
      });
    } catch (error) {
      console.error("❌ Neon connection test failed:", error);
      sendError(res, "Connection test failed", 500, "CONNECTION_TEST_ERROR");
    }
  }),
);

// Database Tables Info for Neon
router.get(
  "/database/tables",
  asyncHandler(async (_req: Request, res: Response) => {
    console.log("📋 Getting Neon database tables information...");

    try {
      const isConnected = database.isConnected();
      if (!isConnected) {
        return sendError(
          res,
          "Neon database connection not available",
          503,
          "DB_CONNECTION_ERROR",
        );
      }

      const tablesInfo = {
        timestamp: new Date().toISOString(),
        database: "neon",
        type: "PostgreSQL",
        tables: [
          "users",
          "apprenticeships",
          "applications",
          "companies",
          "subscriptions",
          "payments",
        ],
        note: "Table details available through Neon console",
      };

      sendSuccess(res, {
        tablesInfo,
      });
    } catch (error) {
      console.error("❌ Tables info failed:", error);
      sendError(res, "Failed to get tables info", 500, "TABLES_INFO_ERROR");
    }
  }),
);

// Database Performance Metrics for Neon
router.get(
  "/database/performance",
  asyncHandler(async (_req: Request, res: Response) => {
    console.log("📊 Getting Neon database performance metrics...");

    try {
      const dbStatus = database.getHealthStatus();

      const performanceMetrics: {
        timestamp: string;
        status: string;
        metrics: {
          database: string;
          connected: boolean;
          projectId: string;
          lastConnectedAt: Date | undefined;
          connectionAttempts: number;
        };
        alerts: { level: "error" | "warning"; message: string }[];
      } = {
        timestamp: new Date().toISOString(),
        status: dbStatus.status,
        metrics: {
          database: "neon",
          connected: dbStatus.connected,
          projectId: dbStatus.projectId,
          lastConnectedAt: dbStatus.lastConnectedAt,
          connectionAttempts: dbStatus.connectionAttempts,
        },
        alerts: [],
      };

      // Add performance alerts
      if (!dbStatus.connected) {
        performanceMetrics.alerts.push({
          level: "error",
          message: "Neon database not connected",
        });
      }

      if (dbStatus.connectionAttempts > 3) {
        performanceMetrics.alerts.push({
          level: "warning",
          message: `Multiple connection attempts: ${dbStatus.connectionAttempts}`,
        });
      }

      sendSuccess(res, {
        performance: performanceMetrics,
      });
    } catch (error) {
      console.error("❌ Neon performance metrics failed:", error);
      sendError(
        res,
        "Failed to get performance metrics",
        500,
        "PERFORMANCE_METRICS_ERROR",
      );
    }
  }),
);

// Simple connectivity test
router.get(
  "/ping",
  asyncHandler(async (_req: Request, res: Response) => {
    const isConnected = database.isConnected();

    sendSuccess(res, {
      message: "Neon database ping",
      connected: isConnected,
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;

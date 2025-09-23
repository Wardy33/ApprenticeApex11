import express, { Response } from "express";
import express, { Response } from "express";
import { User } from "../models/User";
import {
  authenticateToken,
  requireMasterAdmin,
  requireAdminPermission,
  AuthenticatedRequest,
} from "../middleware/auth";
import { database } from "../middleware/database-neon";

const router = express.Router();

// System Configuration Management
router.get(
  "/config",
  authenticateToken,
  requireMasterAdmin,
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      // Current system configuration
      const systemConfig = {
        platformSettings: {
          registrationEnabled: true, // Would read from database/config
          maintenanceMode: false,
          maxApplicationsPerUser: 5,
          subscriptionRequired: true,
          emailVerificationRequired: true,
          debugMode: process.env.NODE_ENV === "development",
        },
        paymentSettings: {
          trialPeriodDays: 60,
          subscriptionPlans: {
            basic: 29.99,
            premium: 49.99,
            enterprise: 99.99,
          },
          stripeLiveMode: process.env.STRIPE_SECRET_KEY?.includes("live"),
          paymentsEnabled: !!process.env.STRIPE_SECRET_KEY,
        },
        featureFlags: {
          videoInterviewsEnabled: true,
          chatSystemEnabled: true,
          pushNotificationsEnabled: true,
          aiMatchingEnabled: false, // Placeholder for future AI features
          advancedAnalytics: true,
          geoLocationServices: true,
        },
        securitySettings: {
          passwordMinLength: 8,
          requireStrongPasswords: true,
          maxLoginAttempts: 5,
          sessionTimeoutMinutes: 480, // 8 hours
          twoFactorAuthEnabled: false,
        },
        emailSettings: {
          emailServiceConfigured: !!process.env.SMTP_HOST,
          fromAddress: process.env.EMAIL_FROM || "noreply@apprenticeapex.com",
          templatesEnabled: true,
          emailVerificationRequired: true,
        },
      };

      res.json({
        config: systemConfig,
        lastUpdated: new Date().toISOString(),
        configuredBy: "system",
      });
    } catch (error) {
      console.error("❌ Get system config error:", error);
      res.status(500).json({
        error: "Failed to retrieve system configuration",
        code: "GET_SYSTEM_CONFIG_ERROR",
      });
    }
  },
);

// Update System Configuration
router.put(
  "/config",
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        platformSettings,
        paymentSettings,
        featureFlags,
        securitySettings,
      } = req.body;

      // Validate configuration updates
      const updatedConfig: any = {};

      if (platformSettings) {
        updatedConfig.platformSettings = {
          registrationEnabled: Boolean(platformSettings.registrationEnabled),
          maintenanceMode: Boolean(platformSettings.maintenanceMode),
          maxApplicationsPerUser: Math.max(
            1,
            parseInt(platformSettings.maxApplicationsPerUser) || 5,
          ),
          subscriptionRequired: Boolean(platformSettings.subscriptionRequired),
          emailVerificationRequired: Boolean(
            platformSettings.emailVerificationRequired,
          ),
        };
      }

      if (paymentSettings) {
        updatedConfig.paymentSettings = {
          trialPeriodDays: Math.max(
            0,
            parseInt(paymentSettings.trialPeriodDays) || 60,
          ),
          subscriptionPlans: {
            basic: Math.max(
              0,
              parseFloat(paymentSettings.subscriptionPlans?.basic) || 29.99,
            ),
            premium: Math.max(
              0,
              parseFloat(paymentSettings.subscriptionPlans?.premium) || 49.99,
            ),
            enterprise: Math.max(
              0,
              parseFloat(paymentSettings.subscriptionPlans?.enterprise) ||
                99.99,
            ),
          },
        };
      }

      if (featureFlags) {
        updatedConfig.featureFlags = {
          videoInterviewsEnabled: Boolean(featureFlags.videoInterviewsEnabled),
          chatSystemEnabled: Boolean(featureFlags.chatSystemEnabled),
          pushNotificationsEnabled: Boolean(
            featureFlags.pushNotificationsEnabled,
          ),
          aiMatchingEnabled: Boolean(featureFlags.aiMatchingEnabled),
          advancedAnalytics: Boolean(featureFlags.advancedAnalytics),
          geoLocationServices: Boolean(featureFlags.geoLocationServices),
        };
      }

      if (securitySettings) {
        updatedConfig.securitySettings = {
          passwordMinLength: Math.max(
            6,
            parseInt(securitySettings.passwordMinLength) || 8,
          ),
          requireStrongPasswords: Boolean(
            securitySettings.requireStrongPasswords,
          ),
          maxLoginAttempts: Math.max(
            3,
            parseInt(securitySettings.maxLoginAttempts) || 5,
          ),
          sessionTimeoutMinutes: Math.max(
            30,
            parseInt(securitySettings.sessionTimeoutMinutes) || 480,
          ),
          twoFactorAuthEnabled: Boolean(securitySettings.twoFactorAuthEnabled),
        };
      }

      // In a real implementation, this would be saved to database
      // For now, we'll just log the changes
      console.log(
        `⚙️ System configuration updated by admin: ${req.user!.email}`,
      );
      console.log("Updated config:", JSON.stringify(updatedConfig, null, 2));

      res.json({
        success: true,
        message: "System configuration updated successfully",
        updatedConfig,
        updatedBy: req.user!.email,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Update system config error:", error);
      res.status(500).json({
        error: "Failed to update system configuration",
        code: "UPDATE_SYSTEM_CONFIG_ERROR",
      });
    }
  },
);

// Content Moderation - Get Flagged Content
router.get(
  "/moderation/flagged",
  authenticateToken,
  requireAdminPermission("canModerateContent"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string; // "pending", "approved", "rejected"
      const contentType = req.query.type as string; // "profile", "message", "job", "application"

      // Mock flagged content data (in real implementation, this would come from a moderation collection)
      const mockFlaggedContent = [
        {
          id: "flag_001",
          contentType: "profile",
          contentId: "user_123",
          flaggedBy: "user_456",
          reason: "Inappropriate content",
          description: "Profile contains inappropriate language",
          status: "pending",
          flaggedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          reviewedBy: null,
          reviewedAt: null,
          content: {
            userEmail: "example@email.com",
            profileData: "Sample profile data...",
          },
        },
        {
          id: "flag_002",
          contentType: "message",
          contentId: "msg_789",
          flaggedBy: "user_321",
          reason: "Spam",
          description: "User sending spam messages",
          status: "pending",
          flaggedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          reviewedBy: null,
          reviewedAt: null,
          content: {
            messageText: "Sample message content...",
            sender: "spammer@email.com",
          },
        },
      ];

      // Filter by status and content type
      let filteredContent = mockFlaggedContent;
      if (status) {
        filteredContent = filteredContent.filter(
          (item) => item.status === status,
        );
      }
      if (contentType) {
        filteredContent = filteredContent.filter(
          (item) => item.contentType === contentType,
        );
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const paginatedContent = filteredContent.slice(
        startIndex,
        startIndex + limit,
      );

      res.json({
        flaggedContent: paginatedContent,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filteredContent.length / limit),
          totalItems: filteredContent.length,
          hasNextPage: startIndex + limit < filteredContent.length,
          hasPrevPage: page > 1,
        },
        filters: {
          status,
          contentType,
        },
      });
    } catch (error) {
      console.error("❌ Get flagged content error:", error);
      res.status(500).json({
        error: "Failed to retrieve flagged content",
        code: "GET_FLAGGED_CONTENT_ERROR",
      });
    }
  },
);

// Content Moderation - Approve/Reject Content
router.post(
  "/moderation/:action/:id",
  authenticateToken,
  requireAdminPermission("canModerateContent"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const action = req.params.action; // "approve" or "reject"
      const flagId = req.params.id;
      const { reason, notes } = req.body;

      if (!["approve", "reject"].includes(action)) {
        res.status(400).json({
          error: "Action must be 'approve' or 'reject'",
          code: "INVALID_MODERATION_ACTION",
        });
      }

      // In a real implementation, this would update the moderation record in database
      const moderationAction = {
        flagId,
        action,
        moderatedBy: req.user!.email,
        moderatedAt: new Date(),
        reason,
        notes,
      };

      console.log(
        `🛡️ Content moderation action: ${action} on flag ${flagId} by admin: ${req.user!.email}`,
      );
      console.log("Moderation details:", moderationAction);

      res.json({
        success: true,
        message: `Content ${action}ed successfully`,
        moderationAction,
      });
    } catch (error) {
      console.error("❌ Content moderation action error:", error);
      res.status(500).json({
        error: "Failed to process moderation action",
        code: "MODERATION_ACTION_ERROR",
      });
    }
  },
);

// System Logs
router.get(
  "/logs",
  authenticateToken,
  requireAdminPermission("canAccessSystemLogs"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const logType = (req.query.type as string) || "all"; // "error", "access", "admin", "all"
      const limit = parseInt(req.query.limit as string) || 100;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Mock system logs (in real implementation, this would read from log files or log database)
      const mockLogs = [
        {
          timestamp: new Date().toISOString(),
          level: "info",
          type: "access",
          message: "User login successful",
          userId: "user_123",
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
        },
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          level: "error",
          type: "error",
          message: "Database connection timeout",
          error: "Connection timeout after 30s",
          stack: "Error stack trace...",
        },
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          level: "warn",
          type: "admin",
          message: "Admin configuration updated",
          adminEmail: req.user!.email,
          changes: ["featureFlags.aiMatchingEnabled"],
        },
      ];

      // Filter logs by type
      let filteredLogs = mockLogs;
      if (logType !== "all") {
        filteredLogs = filteredLogs.filter((log) => log.type === logType);
      }

      // Apply date filters
      if (startDate) {
        const start = new Date(startDate);
        filteredLogs = filteredLogs.filter(
          (log) => new Date(log.timestamp) >= start,
        );
      }
      if (endDate) {
        const end = new Date(endDate);
        filteredLogs = filteredLogs.filter(
          (log) => new Date(log.timestamp) <= end,
        );
      }

      // Limit results
      const limitedLogs = filteredLogs.slice(0, limit);

      res.json({
        logs: limitedLogs,
        totalLogs: filteredLogs.length,
        filters: {
          type: logType,
          startDate,
          endDate,
          limit,
        },
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Get system logs error:", error);
      res.status(500).json({
        error: "Failed to retrieve system logs",
        code: "GET_SYSTEM_LOGS_ERROR",
      });
    }
  },
);

// System Health Check
router.get(
  "/health",
  authenticateToken,
  requireAdminPermission("canAccessSystemLogs"),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      // Database health
      const dbHealth = {
        connected: database.isConnected(),
        collections: {
          users: await User.countDocuments(),
        },
        lastQuery: "SELECT 1", // Mock last query
        avgResponseTime: "45ms",
      };

      // System resources
      const systemHealth = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version,
      };

      // Service status
      const serviceStatus = {
        database: database.isConnected() ? "healthy" : "error",
        email: process.env.SMTP_HOST ? "configured" : "not configured",
        payments: process.env.STRIPE_SECRET_KEY
          ? "configured"
          : "not configured",
        videoService: process.env.DAILY_API_KEY
          ? "configured"
          : "not configured",
      };

      // Recent errors (mock)
      const recentErrors = [
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          type: "Authentication",
          message: "Failed login attempt",
          severity: "low",
          resolved: true,
        },
      ];

      res.json({
        status: "healthy",
        database: dbHealth,
        system: systemHealth,
        services: serviceStatus,
        recentErrors,
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ System health check error:", error);
      res.status(500).json({
        error: "Failed to retrieve system health",
        code: "SYSTEM_HEALTH_ERROR",
      });
    }
  },
);

// Backup and Maintenance
router.post(
  "/maintenance/:action",
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const action = req.params.action;
      const { reason, estimatedDuration } = req.body;

      if (!["enable", "disable"].includes(action)) {
        res.status(400).json({
          error: "Action must be 'enable' or 'disable'",
          code: "INVALID_MAINTENANCE_ACTION",
        });
      }

      // In a real implementation, this would update a maintenance mode flag
      const maintenanceAction = {
        action,
        reason,
        estimatedDuration,
        triggeredBy: req.user!.email,
        triggeredAt: new Date(),
      };

      console.log(
        `🔧 Maintenance mode ${action}d by admin: ${req.user!.email}`,
      );
      console.log("Maintenance details:", maintenanceAction);

      res.json({
        success: true,
        message: `Maintenance mode ${action}d successfully`,
        maintenanceAction,
      });
    } catch (error) {
      console.error("❌ Maintenance action error:", error);
      res.status(500).json({
        error: "Failed to process maintenance action",
        code: "MAINTENANCE_ACTION_ERROR",
      });
    }
  },
);

export default router;

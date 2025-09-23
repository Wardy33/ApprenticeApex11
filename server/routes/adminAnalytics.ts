import { Router, Request, Response } from "express";
import { User } from "../models/User";
import {
  authenticateToken,
  requireAdminPermission,
  AuthenticatedRequest,
} from "../middleware/auth";
import { database } from "../middleware/database-neon";

const router = Router();

// Platform Analytics Overview
router.get(
  "/platform",
  authenticateToken,
  requireAdminPermission("canViewAllUsers"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const timeframe = (req.query.timeframe as string) || "30d";

      let startDate: Date;
      switch (timeframe) {
        case "7d":
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // User growth analytics
      const userGrowth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            newStudents: {
              $sum: {
                $cond: [{ $eq: ["$role", "student"] }, 1, 0],
              },
            },
            newCompanies: {
              $sum: {
                $cond: [{ $eq: ["$role", "company"] }, 1, 0],
              },
            },
            totalNew: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // Active users (users who logged in within timeframe)
      const activeUsers = await User.countDocuments({
        lastLogin: { $gte: startDate },
        isActive: true,
      });

      // Email verification rates
      const emailVerificationStats = await User.aggregate([
        {
          $group: {
            _id: "$role",
            total: { $sum: 1 },
            verified: {
              $sum: {
                $cond: ["$isEmailVerified", 1, 0],
              },
            },
          },
        },
      ]);

      // Platform engagement metrics
      const engagementMetrics = {
        totalUsers: await User.countDocuments({ isActive: true }),
        activeUsers,
        activationRate:
          ((await User.countDocuments({ isActive: true })) /
            (await User.countDocuments())) *
          100,
        emailVerificationRate:
          (emailVerificationStats.reduce((acc, stat) => {
            return acc + stat.verified / stat.total;
          }, 0) /
            emailVerificationStats.length) *
          100,
      };

      res.json({
        userGrowth,
        engagementMetrics,
        emailVerificationStats,
        timeframe,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Platform analytics error:", error);
      res.status(500).json({
        error: "Failed to retrieve platform analytics",
        code: "PLATFORM_ANALYTICS_ERROR",
      });
    }
  },
);

// Financial Analytics (Mock data for now - will be populated with real payment data)
router.get(
  "/financial",
  authenticateToken,
  requireAdminPermission("canViewFinancials"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const timeframe = (req.query.timeframe as string) || "30d";

      // For now, we'll provide mock financial data
      // In a real implementation, this would pull from Stripe/payment records

      const totalCompanies = await User.countDocuments({
        role: "company",
        isActive: true,
      });
      const premiumSubscriptions = Math.floor(totalCompanies * 0.3); // Estimate 30% are premium
      const basicSubscriptions = Math.floor(totalCompanies * 0.2); // Estimate 20% are basic

      const monthlyRevenue =
        premiumSubscriptions * 99.99 + basicSubscriptions * 29.99;
      const annualRevenue = monthlyRevenue * 12;

      // Mock subscription analytics
      const subscriptionAnalytics = {
        total: premiumSubscriptions + basicSubscriptions,
        byPlan: {
          free: totalCompanies - premiumSubscriptions - basicSubscriptions,
          basic: basicSubscriptions,
          premium: premiumSubscriptions,
          enterprise: Math.floor(totalCompanies * 0.05), // 5% enterprise
        },
        monthlyRecurring: monthlyRevenue,
        annualProjected: annualRevenue,
        averageRevenuePerUser:
          totalCompanies > 0 ? monthlyRevenue / totalCompanies : 0,
      };

      // Mock revenue trends (would be real data from payment processor)
      const revenueTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split("T")[0],
          revenue: Math.floor(Math.random() * 500) + 100, // Mock daily revenue
          subscriptions: Math.floor(Math.random() * 5) + 1, // Mock daily new subscriptions
        };
      });

      // Payment success/failure rates (mock)
      const paymentMetrics = {
        successRate: 94.5,
        failureRate: 5.5,
        chargebackRate: 0.3,
        totalTransactions: premiumSubscriptions + basicSubscriptions,
        totalVolume: monthlyRevenue,
      };

      res.json({
        subscriptionAnalytics,
        revenueTrends,
        paymentMetrics,
        summary: {
          totalRevenue: monthlyRevenue,
          activeSubscriptions: premiumSubscriptions + basicSubscriptions,
          conversionRate: (
            ((premiumSubscriptions + basicSubscriptions) / totalCompanies) *
            100
          ).toFixed(1),
          churnRate: 2.3, // Mock churn rate
        },
        timeframe,
        note: "Financial data is currently estimated. Connect Stripe integration for real-time data.",
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Financial analytics error:", error);
      res.status(500).json({
        error: "Failed to retrieve financial analytics",
        code: "FINANCIAL_ANALYTICS_ERROR",
      });
    }
  },
);

// System Performance Analytics
router.get(
  "/system",
  authenticateToken,
  requireAdminPermission("canAccessSystemLogs"),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      // Database performance metrics
      const dbStats = {
        isConnected: database.isConnected(),
        collections: {
          users: await User.countDocuments(),
        },
        indexes: "Optimized", // Would check actual index performance
        queryPerformance: "Good", // Would analyze slow queries
      };

      // System health metrics
      const systemHealth = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: {
          usage: "Normal", // Would integrate with system monitoring
          load: "Low",
        },
        diskSpace: "Adequate", // Would check actual disk usage
        networkLatency: "Normal",
      };

      // API performance (mock data)
      const apiMetrics = {
        totalRequests: Math.floor(Math.random() * 10000) + 50000,
        averageResponseTime: 245,
        errorRate: 0.02,
        slowestEndpoints: [
          { endpoint: "/api/users", avgTime: 450 },
          { endpoint: "/api/applications", avgTime: 380 },
          { endpoint: "/api/apprenticeships", avgTime: 320 },
        ],
        mostUsedEndpoints: [
          { endpoint: "/api/auth/login", requests: 8942 },
          { endpoint: "/api/users/profile", requests: 6743 },
          { endpoint: "/api/apprenticeships", requests: 5234 },
        ],
      };

      // Error tracking (mock data)
      const errorMetrics = {
        totalErrors: Math.floor(Math.random() * 50) + 10,
        errorTypes: {
          "500": 12,
          "404": 8,
          "401": 15,
          "400": 9,
        },
        criticalErrors: 2,
        recentErrors: [
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            type: "Database Connection",
            severity: "Medium",
            resolved: true,
          },
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            type: "Authentication Failure",
            severity: "Low",
            resolved: true,
          },
        ],
      };

      res.json({
        database: dbStats,
        system: systemHealth,
        api: apiMetrics,
        errors: errorMetrics,
        lastChecked: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ System analytics error:", error);
      res.status(500).json({
        error: "Failed to retrieve system analytics",
        code: "SYSTEM_ANALYTICS_ERROR",
      });
    }
  },
);

// Geographic Analytics
router.get(
  "/geographic",
  authenticateToken,
  requireAdminPermission("canViewAllUsers"),
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      // User distribution by location
      const usersByLocation = await User.aggregate([
        {
          $match: {
            isActive: true,
            "profile.location.city": { $exists: true },
          },
        },
        {
          $group: {
            _id: {
              city: "$profile.location.city",
              role: "$role",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.city",
            students: {
              $sum: {
                $cond: [{ $eq: ["$_id.role", "student"] }, "$count", 0],
              },
            },
            companies: {
              $sum: {
                $cond: [{ $eq: ["$_id.role", "company"] }, "$count", 0],
              },
            },
            total: { $sum: "$count" },
          },
        },
        {
          $sort: { total: -1 },
        },
        {
          $limit: 20,
        },
      ]);

      // Top cities by user concentration
      const topCities = usersByLocation.slice(0, 10);

      // Growth by region (mock data for demonstration)
      const regionalGrowth = [
        { region: "London", growth: 15.3, users: 1250 },
        { region: "Manchester", growth: 12.7, users: 890 },
        { region: "Birmingham", growth: 10.2, users: 650 },
        { region: "Leeds", growth: 8.9, users: 420 },
        { region: "Glasgow", growth: 7.1, users: 380 },
      ];

      res.json({
        userDistribution: topCities,
        regionalGrowth,
        totalCitiesRepresented: usersByLocation.length,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Geographic analytics error:", error);
      res.status(500).json({
        error: "Failed to retrieve geographic analytics",
        code: "GEOGRAPHIC_ANALYTICS_ERROR",
      });
    }
  },
);

// Export analytics data
router.get(
  "/export/:type",
  authenticateToken,
  requireAdminPermission("canExportData"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const type = req.params.type;
      const format = (req.query.format as string) || "json";

      if (!["platform", "financial", "system", "geographic"].includes(type)) {
        res.status(400).json({
          error: "Invalid analytics type",
          code: "INVALID_ANALYTICS_TYPE",
        });
      }

      let data: any;
      let filename: string = "analytics";

      switch (type) {
        case "platform":
          // Get platform analytics data (reuse existing logic)
          data = {
            message: "Platform analytics export - implementation needed",
          };
          filename = `platform-analytics-${new Date().toISOString().split("T")[0]}`;
          break;
        case "financial":
          data = {
            message: "Financial analytics export - implementation needed",
          };
          filename = `financial-analytics-${new Date().toISOString().split("T")[0]}`;
          break;
        case "system":
          data = { message: "System analytics export - implementation needed" };
          filename = `system-analytics-${new Date().toISOString().split("T")[0]}`;
          break;
        case "geographic":
          data = {
            message: "Geographic analytics export - implementation needed",
          };
          filename = `geographic-analytics-${new Date().toISOString().split("T")[0]}`;
          break;
      }

      if (format === "csv") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.csv"`,
        );
        res.setHeader("Content-Type", "text/csv");
        res.send("Analytics CSV export - implementation needed");
      } else {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}.json"`,
        );
        res.setHeader("Content-Type", "application/json");
        res.json(data);
      }

      console.log(
        `📊 Analytics exported (${type}/${format}) by admin: ${req.user!.email}`,
      );
    } catch (error) {
      console.error("❌ Export analytics error:", error);
      res.status(500).json({
        error: "Failed to export analytics data",
        code: "EXPORT_ANALYTICS_ERROR",
      });
    }
  },
);

export default router;

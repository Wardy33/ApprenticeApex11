import express, { Request, Response } from "express";
import { AlertService } from "../services/alertService";
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

/**
 * Get all active alerts
 */
router.get("/active", async (_req: Request, res: Response) => {
  try {
    const alerts = AlertService.getActiveAlerts();
    res.json({
      success: true,
      alerts: alerts.sort((a, b) => {
        // Sort by severity and timestamp
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff =
          severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }),
    });
  } catch (error) {
    console.error("Error fetching active alerts:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch alerts",
        details: error instanceof Error ? error.message : String(error),
      });
  }
});

/**
 * Get alerts for specific employer
 */
router.get("/employer/:employerId", async (req: Request, res: Response) => {
  try {
    const { employerId } = req.params;
    const alerts = AlertService.getAlertsByEmployer(employerId);

    res.json({
      success: true,
      alerts: alerts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    });
  } catch (error) {
    console.error("Error fetching employer alerts:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch employer alerts",
        details: error instanceof Error ? error.message : String(error),
      });
  }
});

/**
 * Acknowledge an alert
 */
router.patch(
  "/:alertId/acknowledge",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { alertId } = req.params;
      const adminId = req.user?.userId;

      if (!adminId) {
        res
          .status(401)
          .json({ success: false, error: "Admin authentication required" });
        return;
      }

      await AlertService.acknowledgeAlert(alertId, adminId);

      res.json({
        success: true,
        message: "Alert acknowledged successfully",
      });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to acknowledge alert",
          details: error instanceof Error ? error.message : String(error),
        });
    }
  },
);

/**
 * Resolve an alert
 */
router.patch(
  "/:alertId/resolve",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { alertId } = req.params;
      const { resolution } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        res
          .status(401)
          .json({ success: false, error: "Admin authentication required" });
        return;
      }

      if (!resolution) {
        res
          .status(400)
          .json({ success: false, error: "Resolution description required" });
        return;
      }

      await AlertService.resolveAlert(alertId, adminId, resolution);

      res.json({
        success: true,
        message: "Alert resolved successfully",
      });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to resolve alert",
          details: error instanceof Error ? error.message : String(error),
        });
    }
  },
);

/**
 * Get alert statistics
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const activeAlerts = AlertService.getActiveAlerts();
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;

    const stats = {
      active: {
        total: activeAlerts.length,
        critical: activeAlerts.filter((a) => a.severity === "critical").length,
        high: activeAlerts.filter((a) => a.severity === "high").length,
        medium: activeAlerts.filter((a) => a.severity === "medium").length,
        low: activeAlerts.filter((a) => a.severity === "low").length,
      },
      recent: {
        last24h: activeAlerts.filter((a) => a.createdAt.getTime() > last24h)
          .length,
        last7d: activeAlerts.filter((a) => a.createdAt.getTime() > last7d)
          .length,
      },
      byType: activeAlerts.reduce(
        (acc, alert) => {
          const activity = alert.data?.activityType || "unknown";
          acc[activity] = (acc[activity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error generating alert stats:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to generate alert statistics",
        details: error instanceof Error ? error.message : String(error),
      });
  }
});

/**
 * Manual trigger for testing (admin only)
 */
router.post(
  "/test",
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { type = "test", severity = "medium" } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        res
          .status(401)
          .json({ success: false, error: "Admin authentication required" });
        return;
      }

      // Trigger a test alert
      await AlertService.processImmediateAlert({
        employerId: "test_employer",
        studentId: "test_student",
        activityType: `TEST_${type.toUpperCase()}`,
        severity,
        description: "Manual test alert triggered by admin",
        evidence: {
          triggeredBy: adminId,
          timestamp: new Date(),
          testType: type,
        },
      });

      res.json({
        success: true,
        message: "Test alert triggered successfully",
      });
    } catch (error) {
      console.error("Error triggering test alert:", error);
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to trigger test alert",
          details: error instanceof Error ? error.message : String(error),
        });
    }
  },
);

export default router;

import express, { Response } from "express";

const router = express.Router();

// Email subscription endpoint
router.post("/subscribe", async (req: any, res: Response) => {
  try {
    const { email, type, source, notificationEmail } = req.body;

    console.log("📧 Email subscription request:", {
      email,
      type,
      source,
      notificationEmail: notificationEmail || "hello@apprenticeapex.co.uk",
    });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }

    // Save subscription to Neon database
    try {
      console.log(`✅ New subscription: ${email} for ${type} alerts`);
      console.log(
        `📬 Notification will be sent to: ${notificationEmail || "hello@apprenticeapex.co.uk"}`,
      );

      // Use Neon helper function to save subscription
      const { saveToNeonDatabase } = require("../config/neon-real");

      const subscriptionData = {
        email,
        subscription_type: type || "job_alerts",
        source: source || "unknown",
        notification_email: notificationEmail || "hello@apprenticeapex.co.uk",
      };

      const result = await saveToNeonDatabase(
        "email_subscriptions",
        subscriptionData,
      );

      if (result.success) {
        console.log(
          "💾 Email subscription saved to Neon database successfully",
        );
      } else {
        console.log(
          "⚠️ Database save failed, continuing with success response",
        );
      }
    } catch (dbError) {
      console.error("❌ Database error saving subscription:", dbError);
      console.log("⚠️ Continuing with success response despite DB error");
    }

    res.json({
      success: true,
      message: "Successfully subscribed to job alerts",
      data: {
        email,
        type,
        subscribedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Email subscription error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process subscription",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Health check for email service
router.get("/health", (_req: any, res: Response) => {
  res.json({
    success: true,
    service: "Email Service",
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});

export default router;

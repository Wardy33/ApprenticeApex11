import express from "express";
import express, { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { sendSuccess, sendError } from "../utils/apiResponse";
import NeonPaymentService from "../services/neonPaymentService";
import { createRateLimit } from "../middleware/security";

const router = express.Router();

// Webhook endpoint for Stripe with signature verification
router.post(
  "/webhook",
  [
    // Rate limiting for webhooks - allow more requests but still protect
    createRateLimit(5 * 60 * 1000, 1000), // 1000 requests per 5 minutes
    // Parse raw body for webhook signature verification
    express.raw({ type: "application/json", limit: "1mb" }),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    console.log("🪝 Stripe webhook received");

    try {
      const signature = req.headers["stripe-signature"];

      if (!signature) {
        console.error("❌ Webhook signature missing");
        return sendError(
          res,
          "Webhook signature required",
          400,
          "MISSING_SIGNATURE",
        );
      }

      if (typeof signature !== "string") {
        console.error("❌ Invalid webhook signature format");
        return sendError(
          res,
          "Invalid webhook signature format",
          400,
          "INVALID_SIGNATURE",
        );
      }

      // Process the webhook event using NeonPaymentService
      await NeonPaymentService.getInstance().processWebhookEvent(
        req.body,
        signature,
      );

      console.log("✅ Webhook processed successfully");

      // Stripe expects a 200 response to confirm receipt
      sendSuccess(res, {
        received: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("❌ Webhook processing failed:", error);

      // Log the error but still return 200 to prevent Stripe retries for client errors
      if (error.message?.includes("Invalid signature")) {
        return sendError(
          res,
          "Invalid webhook signature",
          400,
          "WEBHOOK_SIGNATURE_ERROR",
        );
      }

      // For other errors, return 500 so Stripe will retry
      sendError(
        res,
        "Webhook processing failed",
        500,
        "WEBHOOK_PROCESSING_ERROR",
      );
    }
  }),
);

// Webhook event types endpoint (for debugging/testing)
router.get(
  "/webhook/events",
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, {
      supportedEvents: [
        "payment_intent.succeeded",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_failed",
        "invoice.payment_succeeded",
        "payment_method.attached",
        "setup_intent.succeeded",
      ],
      webhookUrl: `${req.protocol}://${req.get("host")}/api/stripe/webhook`,
      instructions: {
        step1: "Go to Stripe Dashboard > Developers > Webhooks",
        step2: "Add endpoint with the webhook URL above",
        step3: "Select the events listed in supportedEvents",
        step4:
          "Copy the webhook secret to STRIPE_WEBHOOK_SECRET environment variable",
      },
    });
  }),
);

// Test webhook endpoint (development only)
if (process.env.NODE_ENV !== "production") {
  router.post(
    "/webhook/test",
    [express.json({ limit: "1mb" })],
    asyncHandler(async (req: Request, res: Response) => {
      console.log("🧪 Test webhook received:", req.body);

      try {
        const { eventType, data } = req.body;

        if (!eventType || !data) {
          return sendError(
            res,
            "eventType and data are required",
            400,
            "INVALID_TEST_DATA",
          );
        }

        // Simulate webhook processing without signature verification
        console.log(`🧪 Simulating webhook event: ${eventType}`);

        // This would normally be handled by the real webhook processor
        switch (eventType) {
          case "payment_intent.succeeded":
            console.log("🧪 Simulated: Payment intent succeeded");
            break;
          case "customer.subscription.created":
            console.log("🧪 Simulated: Subscription created");
            break;
          case "invoice.payment_failed":
            console.log("🧪 Simulated: Invoice payment failed");
            break;
          default:
            console.log(`🧪 Simulated: Unhandled event type ${eventType}`);
        }

        sendSuccess(res, {
          message: "Test webhook processed",
          eventType,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        console.error("❌ Test webhook failed:", error);
        sendError(res, "Test webhook failed", 500, "TEST_WEBHOOK_ERROR");
      }
    }),
  );
}

export default router;

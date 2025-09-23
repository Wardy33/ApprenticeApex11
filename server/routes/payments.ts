import express, { Response } from "express";
import express, { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { sendSuccess, sendError } from "../utils/apiResponse";
import NeonPaymentService from "../services/neonPaymentService";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { createRateLimit } from "../middleware/security";
import { getSecureEnvConfig } from "../config/secureEnv";
import { neon_run_sql } from "../config/neon";

const router = express.Router();

// Apply authentication to all payment routes
router.use(authenticateToken);

// Apply rate limiting to prevent payment abuse
const paymentRateLimit = createRateLimit(15 * 60 * 1000, 20); // 20 requests per 15 minutes

// Get Stripe publishable key
router.get(
  "/config",
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const publishableKey =
        await NeonPaymentService.getInstance().getPublishableKey();

      sendSuccess(res, {
        publishableKey,
        currency: "GBP",
        country: "GB",
      });
    } catch (error: any) {
      console.error("❌ Failed to get payment config:", error);
      sendError(
        res,
        "Failed to get payment configuration",
        500,
        "PAYMENT_CONFIG_ERROR",
      );
    }
  }),
);

// Get job posting payment packages
router.get(
  "/packages",
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const packages =
        await NeonPaymentService.getInstance().getJobPaymentPackages();

      sendSuccess(res, {
        packages: packages.map((pkg) => ({
          id: pkg.id,
          type: pkg.package_type,
          name: pkg.package_name,
          description: pkg.description,
          price: pkg.price,
          currency: pkg.currency,
          duration_days: pkg.duration_days,
          features: pkg.features,
          popular: pkg.package_type === "featured", // Mark featured as popular
          savings: pkg.package_type === "premium" ? "Most Popular" : null,
        })),
      });
    } catch (error: any) {
      console.error("❌ Failed to get payment packages:", error);
      sendError(res, "Failed to get payment packages", 500, "PACKAGES_ERROR");
    }
  }),
);

// Create payment intent for job posting
router.post(
  "/job-posting",
  [paymentRateLimit],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const { jobId, packageType } = req.body;
      const userId = req.user?.userId as string;
      if (!userId) {
        return sendError(res, "Authentication required", 401, "UNAUTHORIZED");
      }

      // Validate request
      if (!jobId || !packageType) {
        return sendError(
          res,
          "jobId and packageType are required",
          400,
          "MISSING_REQUIRED_FIELDS",
        );
      }

      if (!["basic", "featured", "premium", "urgent"].includes(packageType)) {
        return sendError(
          res,
          "Invalid package type",
          400,
          "INVALID_PACKAGE_TYPE",
        );
      }

      // Verify user owns the job (security check)
      const paymentService = NeonPaymentService.getInstance();
      const jobs = await neon_run_sql({
        sql: "SELECT company_id FROM jobs WHERE id = $1",
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
        params: [jobId],
      });

      if (!jobs.length) {
        return sendError(res, "Job not found", 404, "JOB_NOT_FOUND");
      }

      if (jobs[0].company_id !== userId) {
        return sendError(
          res,
          "You can only pay for your own job postings",
          403,
          "UNAUTHORIZED_JOB_ACCESS",
        );
      }

      // Check if job already has a pending or successful payment
      const existingPayments = await neon_run_sql({
        sql: "SELECT status FROM payments WHERE job_id = $1 AND status IN ($2, $3)",
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
        params: [jobId, "pending", "succeeded"],
      });

      if (existingPayments.length > 0) {
        return sendError(
          res,
          "Job already has a payment in progress or completed",
          400,
          "PAYMENT_ALREADY_EXISTS",
        );
      }

      // Create payment intent
      const packageKey =
        packageType as keyof typeof NeonPaymentService.JOB_PACKAGES;
      const paymentResult = await paymentService.createJobPostingPayment({
        userId,
        jobId: parseInt(jobId, 10),
        packageType: packageKey,
        metadata: {
          source: "job_posting_ui",
          userAgent: req.headers["user-agent"] || "unknown",
        },
      });

      sendSuccess(res, {
        clientSecret: paymentResult.clientSecret,
        paymentIntentId: paymentResult.paymentIntent.id,
        amount: paymentResult.paymentIntent.amount,
        currency: paymentResult.paymentIntent.currency,
        packageInfo: {
          type: packageKey,
          name: NeonPaymentService.JOB_PACKAGES[packageKey].name,
          price: NeonPaymentService.JOB_PACKAGES[packageKey].price,
          features: NeonPaymentService.JOB_PACKAGES[packageKey].features,
        },
      });
    } catch (error: any) {
      console.error("❌ Failed to create job posting payment:", error);
      sendError(res, "Failed to create payment", 500, "PAYMENT_CREATION_ERROR");
    }
  }),
);

// Create subscription
router.post(
  "/subscription",
  [paymentRateLimit],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const { planType, paymentMethodId } = req.body;
      const userId = req.user?.userId as string;
      if (!userId) {
        return sendError(res, "Authentication required", 401, "UNAUTHORIZED");
      }

      // Validate request
      if (!planType) {
        return sendError(res, "planType is required", 400, "MISSING_PLAN_TYPE");
      }

      if (!["professional", "business", "enterprise"].includes(planType)) {
        return sendError(res, "Invalid plan type", 400, "INVALID_PLAN_TYPE");
      }

      // Check if user already has an active subscription
      const paymentService = NeonPaymentService.getInstance();
      const existingSubscriptions = await neon_run_sql({
        sql: "SELECT status FROM subscriptions WHERE user_id = $1 AND status IN ($2, $3)",
        projectId: process.env.NEON_PROJECT_ID || "winter-bread-79671472",
        params: [userId, "active", "trialing"],
      });

      if (existingSubscriptions.length > 0) {
        return sendError(
          res,
          "You already have an active subscription",
          400,
          "SUBSCRIPTION_ALREADY_EXISTS",
        );
      }

      // Create subscription
      const subscriptionResult = await paymentService.createSubscription(
        userId,
        planType,
        paymentMethodId,
      );

      const subscription = subscriptionResult.subscription;
      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent;

      sendSuccess(res, {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        status: subscription.status,
        planInfo: {
          type: planType,
          name: NeonPaymentService.SUBSCRIPTION_PLANS[
            planType as keyof typeof NeonPaymentService.SUBSCRIPTION_PLANS
          ].name,
          price:
            NeonPaymentService.SUBSCRIPTION_PLANS[
              planType as keyof typeof NeonPaymentService.SUBSCRIPTION_PLANS
            ].price,
          features:
            NeonPaymentService.SUBSCRIPTION_PLANS[
              planType as keyof typeof NeonPaymentService.SUBSCRIPTION_PLANS
            ].features,
        },
      });
    } catch (error: any) {
      console.error("❌ Failed to create subscription:", error);
      sendError(
        res,
        "Failed to create subscription",
        500,
        "SUBSCRIPTION_CREATION_ERROR",
      );
    }
  }),
);

// Get payment history
router.get(
  "/history",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const payments =
        await NeonPaymentService.getInstance().getPaymentHistory(userId);

      sendSuccess(res, {
        payments: payments.map((payment) => ({
          id: payment.id,
          type: payment.payment_type,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          description: payment.description,
          created_at: payment.created_at,
          processed_at: payment.processed_at,
          metadata: payment.metadata,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: payments.length,
        },
      });
    } catch (error: any) {
      console.error("❌ Failed to get payment history:", error);
      sendError(
        res,
        "Failed to get payment history",
        500,
        "PAYMENT_HISTORY_ERROR",
      );
    }
  }),
);

// Get current subscription status
router.get(
  "/subscription",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const userId = req.user.userId;

      const paymentService = NeonPaymentService.getInstance();
      const subscriptions = await paymentService.sql(
        `SELECT * FROM subscriptions 
       WHERE user_id = $1 AND status IN ('active', 'trialing', 'past_due') 
       ORDER BY created_at DESC LIMIT 1`,
        [userId],
      );

      if (subscriptions.length === 0) {
        return sendSuccess(res, {
          hasSubscription: false,
          subscription: null,
        });
      }

      const subscription = subscriptions[0];

      sendSuccess(res, {
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          planType: subscription.plan_type,
          planName: subscription.plan_name,
          status: subscription.status,
          amount: subscription.amount,
          currency: subscription.currency,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          nextBillingDate: subscription.next_billing_date,
          features: subscription.features,
          usage: subscription.usage,
        },
      });
    } catch (error: any) {
      console.error("❌ Failed to get subscription:", error);
      sendError(res, "Failed to get subscription", 500, "SUBSCRIPTION_ERROR");
    }
  }),
);

// Cancel subscription
router.post(
  "/subscription/cancel",
  [paymentRateLimit],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const userId = req.user.userId;

      const paymentService = NeonPaymentService.getInstance();
      const subscriptions = await paymentService.sql(
        "SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status = $2",
        [userId, "active"],
      );

      if (subscriptions.length === 0) {
        return sendError(
          res,
          "No active subscription found",
          404,
          "NO_ACTIVE_SUBSCRIPTION",
        );
      }

      const stripeSubscriptionId = subscriptions[0].stripe_subscription_id;

      // Cancel the subscription in Stripe (will trigger webhook)
      const stripe = paymentService.stripe;
      const canceledSubscription = await stripe.subscriptions.update(
        stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        },
      );

      sendSuccess(res, {
        message:
          "Subscription will be cancelled at the end of the billing period",
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
          currentPeriodEnd: new Date(
            canceledSubscription.current_period_end * 1000,
          ),
        },
      });
    } catch (error: any) {
      console.error("❌ Failed to cancel subscription:", error);
      sendError(
        res,
        "Failed to cancel subscription",
        500,
        "SUBSCRIPTION_CANCEL_ERROR",
      );
    }
  }),
);

// Verify payment status (for frontend polling)
router.get(
  "/status/:paymentIntentId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const { paymentIntentId } = req.params;
      const userId = req.user.userId;

      const paymentService = NeonPaymentService.getInstance();
      const payments = await paymentService.sql(
        "SELECT * FROM payments WHERE stripe_payment_intent_id = $1 AND user_id = $2",
        [paymentIntentId, userId],
      );

      if (payments.length === 0) {
        return sendError(res, "Payment not found", 404, "PAYMENT_NOT_FOUND");
      }

      const payment = payments[0];

      sendSuccess(res, {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        description: payment.description,
        processedAt: payment.processed_at,
        failedAt: payment.failed_at,
        jobActivated:
          payment.payment_type === "job_posting" &&
          payment.status === "succeeded",
      });
    } catch (error: any) {
      console.error("❌ Failed to get payment status:", error);
      sendError(
        res,
        "Failed to get payment status",
        500,
        "PAYMENT_STATUS_ERROR",
      );
    }
  }),
);

// === STRIPE CHECKOUT ENDPOINTS FOR PRICING PLANS ===

// Create checkout session for trial plan
router.post(
  "/checkout/trial",
  [paymentRateLimit],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const userId = req.user.userId;
      const env = getSecureEnvConfig();

      const paymentService = NeonPaymentService.getInstance();
      const customer = await paymentService.getOrCreateCustomer(userId);

      // Check if user already has an active subscription or trial
      const existingSubscriptions = await paymentService.sql(
        "SELECT status FROM subscriptions WHERE user_id = $1 AND status IN ($2, $3, $4)",
        [userId, "active", "trialing", "past_due"],
      );

      if (existingSubscriptions.length > 0) {
        return sendError(
          res,
          "You already have an active subscription or trial",
          400,
          "SUBSCRIPTION_ALREADY_EXISTS",
        );
      }

      const stripe = paymentService.stripe;

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "ApprenticeApex Trial Plan",
                description:
                  "60-day risk-free trial with up to 15 job postings",
              },
              unit_amount: 0, // Free trial
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 60,
          metadata: {
            userId,
            planType: "trial",
            createdVia: "pricing_page",
          },
        },
        success_url: `${env.FRONTEND_URL}/company?trial=success`,
        cancel_url: `${env.FRONTEND_URL}/company/pricing?trial=cancelled`,
        metadata: {
          userId,
          planType: "trial",
        },
      });

      sendSuccess(res, {
        url: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error("❌ Failed to create trial checkout session:", error);
      sendError(
        res,
        "Failed to create trial checkout session",
        500,
        "CHECKOUT_SESSION_ERROR",
      );
    }
  }),
);

// Create checkout session for starter plan
router.post(
  "/checkout/starter",
  [paymentRateLimit],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const userId = req.user.userId;
      const { mode = "monthly" } = req.query; // monthly or per-hire
      const env = getSecureEnvConfig();

      const paymentService = NeonPaymentService.getInstance();
      const customer = await paymentService.getOrCreateCustomer(userId);

      const stripe = paymentService.stripe;

      if (mode === "per-hire") {
        // Create one-time payment session for per-hire model
        const session = await stripe.checkout.sessions.create({
          customer: customer.id,
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "gbp",
                product_data: {
                  name: "ApprenticeApex Starter Plan - Pay Per Hire",
                  description: "One-time payment of £399 per successful hire",
                },
                unit_amount: 39900, // £399.00
              },
              quantity: 1,
            },
          ],
          success_url: `${env.FRONTEND_URL}/company?starter=success&mode=per-hire`,
          cancel_url: `${env.FRONTEND_URL}/company/pricing?starter=cancelled`,
          metadata: {
            userId,
            planType: "starter",
            paymentMode: "per-hire",
          },
        });

        sendSuccess(res, {
          url: session.url,
          sessionId: session.id,
        });
      } else {
        // Create monthly subscription session
        const session = await stripe.checkout.sessions.create({
          customer: customer.id,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "gbp",
                product_data: {
                  name: "ApprenticeApex Starter Plan",
                  description: "Monthly subscription with up to 5 job postings",
                },
                unit_amount: 4900, // £49.00
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          subscription_data: {
            metadata: {
              userId,
              planType: "starter",
              createdVia: "pricing_page",
            },
          },
          success_url: `${env.FRONTEND_URL}/company?starter=success&mode=monthly`,
          cancel_url: `${env.FRONTEND_URL}/company/pricing?starter=cancelled`,
          metadata: {
            userId,
            planType: "starter",
            paymentMode: "monthly",
          },
        });

        sendSuccess(res, {
          url: session.url,
          sessionId: session.id,
        });
      }
    } catch (error: any) {
      console.error("❌ Failed to create starter checkout session:", error);
      sendError(
        res,
        "Failed to create starter checkout session",
        500,
        "CHECKOUT_SESSION_ERROR",
      );
    }
  }),
);

// Create checkout session for professional plan
router.post(
  "/checkout/professional",
  [paymentRateLimit],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const userId = req.user.userId;
      const env = getSecureEnvConfig();

      const paymentService = NeonPaymentService.getInstance();
      const customer = await paymentService.getOrCreateCustomer(userId);

      const stripe = paymentService.stripe;

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "ApprenticeApex Professional Plan",
                description:
                  "Monthly subscription with up to 15 job postings and premium features",
              },
              unit_amount: 9900, // £99.00
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            userId,
            planType: "professional",
            createdVia: "pricing_page",
          },
        },
        success_url: `${env.FRONTEND_URL}/company?professional=success`,
        cancel_url: `${env.FRONTEND_URL}/company/pricing?professional=cancelled`,
        metadata: {
          userId,
          planType: "professional",
        },
      });

      sendSuccess(res, {
        url: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error(
        "❌ Failed to create professional checkout session:",
        error,
      );
      sendError(
        res,
        "Failed to create professional checkout session",
        500,
        "CHECKOUT_SESSION_ERROR",
      );
    }
  }),
);

// Create checkout session for business plan
router.post(
  "/checkout/business",
  [paymentRateLimit],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const userId = req.user.userId;
      const env = getSecureEnvConfig();

      const paymentService = NeonPaymentService.getInstance();
      const customer = await paymentService.getOrCreateCustomer(userId);

      const stripe = paymentService.stripe;

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "ApprenticeApex Business Plan",
                description:
                  "Monthly subscription with up to 30 job postings and advanced features",
              },
              unit_amount: 14900, // £149.00
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            userId,
            planType: "business",
            createdVia: "pricing_page",
          },
        },
        success_url: `${env.FRONTEND_URL}/company?business=success`,
        cancel_url: `${env.FRONTEND_URL}/company/pricing?business=cancelled`,
        metadata: {
          userId,
          planType: "business",
        },
      });

      sendSuccess(res, {
        url: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error("❌ Failed to create business checkout session:", error);
      sendError(
        res,
        "Failed to create business checkout session",
        500,
        "CHECKOUT_SESSION_ERROR",
      );
    }
  }),
);

// Create checkout session for enterprise plan
router.post(
  "/checkout/enterprise",
  [paymentRateLimit],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }
    try {
      const userId = req.user.userId;
      const env = getSecureEnvConfig();

      const paymentService = NeonPaymentService.getInstance();
      const customer = await paymentService.getOrCreateCustomer(userId);

      const stripe = paymentService.stripe;

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "ApprenticeApex Enterprise Plan",
                description:
                  "Custom enterprise solution with unlimited features",
              },
              unit_amount: 19900, // £199.00 as placeholder - will be customized
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            userId,
            planType: "enterprise",
            createdVia: "pricing_page",
          },
        },
        success_url: `${env.FRONTEND_URL}/company?enterprise=success`,
        cancel_url: `${env.FRONTEND_URL}/company/pricing?enterprise=cancelled`,
        metadata: {
          userId,
          planType: "enterprise",
        },
      });

      sendSuccess(res, {
        url: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error("❌ Failed to create enterprise checkout session:", error);
      sendError(
        res,
        "Failed to create enterprise checkout session",
        500,
        "CHECKOUT_SESSION_ERROR",
      );
    }
  }),
);

export default router;

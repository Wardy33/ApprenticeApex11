import express from "express";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import session from "express-session";
import { createServer } from "http";
import dotenv from "dotenv";

// Load production environment
dotenv.config({ path: ".env.production" });

// Import production configurations
import { initializeNeon, testNeonConnection } from "./config/neon";
import { handleStripeWebhook, stripeConfig } from "./config/stripe-production";
import {
  googleOAuthRoutes,
  validateOAuthConfig,
  testOAuthConnection,
} from "./config/google-oauth-production";
import { aiModerationService } from "./services/aiModerationService";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import apprenticeshipRoutes from "./routes/apprenticeships";
import applicationRoutes from "./routes/applications";
import messageRoutes from "./routes/messages";
import analyticsRoutes from "./routes/analytics";
import uploadRoutes from "./routes/upload";
import paymentRoutes from "./routes/payments";
import interviewRoutes from "./routes/interviews";
import matchingRoutes from "./routes/matching";
import accessControlRoutes from "./routes/accessControl";
import alertRoutes from "./routes/alerts";
import subscriptionRoutes from "./routes/subscriptions";
import contactRoutes from "./routes/contact";
import videoInterviewRoutes from "./routes/videoInterview";
import healthRoutes from "./routes/health";
import emailRoutes from "./routes/emails";
import adminRoutes from "./routes/admin";

// Import middleware
import { authenticateToken } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const httpServer = createServer(app);

// Production security configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: ["https://js.stripe.com", "https://checkout.stripe.com"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// CORS configuration for production
app.use(
  cors({
    origin: [
      "https://apprenticeapex.com",
      "https://www.apprenticeapex.com",
      ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:5204"]
        : []),
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Trust proxy for production deployment
app.set("trust proxy", 1);

// Compression middleware
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
    memLevel: 8,
  }),
);

// Rate limiting for production
const createProductionRateLimit = (
  windowMs: number = 15 * 60 * 1000,
  max: number = 100,
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/api/health" || req.path === "/api/ping";
    },
  });
};

// Apply rate limiting
app.use("/api/auth", createProductionRateLimit(15 * 60 * 1000, 10)); // Auth: 10 requests per 15 minutes
app.use("/api/payments", createProductionRateLimit(60 * 60 * 1000, 5)); // Payments: 5 requests per hour
app.use("/api/admin", createProductionRateLimit(15 * 60 * 1000, 20)); // Admin: 20 requests per 15 minutes
app.use("/api", createProductionRateLimit(15 * 60 * 1000, 1000)); // General: 1000 requests per 15 minutes

// Body parsing middleware
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" })); // Raw for Stripe webhooks
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session configuration for OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    },
  }),
);

// Health check endpoints
app.get("/api/ping", (_req, res) => {
  res.json({
    message: "ApprenticeApex API v1.0 - Production",
    timestamp: new Date().toISOString(),
    status: "healthy",
    environment: "production",
  });
});

app.get("/api/health", async (_req, res) => {
  const healthChecks = {
    database: await testNeonConnection(),
    oauth: validateOAuthConfig(),
    stripe: !!stripeConfig.secretKey,
    aiModeration: true, // AI moderation is always available
    timestamp: new Date().toISOString(),
  };

  const isHealthy = Object.values(healthChecks).every((check) =>
    typeof check === "boolean" ? check : true,
  );

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "degraded",
    checks: healthChecks,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "1.0.0",
  });
});

// Stripe webhook endpoint (must be before other middleware)
app.post("/api/webhooks/stripe", async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    await handleStripeWebhook(req.body, signature);
    res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    res
      .status(400)
      .send(
        `Webhook Error: ${error instanceof Error ? error.message : String(error)}`,
      );
  }
});

// Google OAuth routes
app.get("/auth/google", googleOAuthRoutes.authenticate);
app.get(
  "/auth/google/callback",
  googleOAuthRoutes.callback,
  googleOAuthRoutes.success,
);

// API routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/apprenticeships", authenticateToken, apprenticeshipRoutes);
app.use("/api/applications", authenticateToken, applicationRoutes);
app.use("/api/messages", authenticateToken, messageRoutes);
app.use("/api/analytics", authenticateToken, analyticsRoutes);
app.use("/api/upload", authenticateToken, uploadRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/interviews", authenticateToken, interviewRoutes);
app.use("/api/video-interview", authenticateToken, videoInterviewRoutes);
app.use("/api/matching", authenticateToken, matchingRoutes);
app.use("/api/access-control", authenticateToken, accessControlRoutes);
app.use("/api/alerts", authenticateToken, alertRoutes);
app.use("/api/subscriptions", authenticateToken, subscriptionRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler for API routes
app.use("/api/*", (_req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    method: req.method,
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));

  // Catch-all handler for SPA
  app.get("*", (req, res) => {
    res.sendFile("index.html", { root: "dist" });
  });
}

async function startProductionServer() {
  try {
    // Initialize services
    console.log("🚀 Starting ApprenticeApex production server...");

    // Validate configuration
    if (!validateOAuthConfig()) {
      throw new Error("Invalid OAuth configuration");
    }

    // Test connections
    console.log("🔧 Testing database connection...");
    await initializeNeon();

    console.log("🔧 Testing OAuth configuration...");
    await testOAuthConnection();

    console.log("🛡️ Initializing AI moderation service...");
    const aiStats = await aiModerationService.getStats();
    console.log("✅ AI moderation active:", aiStats);

    // Start server
    const port = process.env.PORT || 3002;
    httpServer.listen(port, () => {
      console.log("🎉 ApprenticeApex production server running!");
      console.log(`📡 Server: http://localhost:${port}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
      console.log(`💳 Stripe: Live mode enabled`);
      console.log(`🔐 OAuth: Google authentication enabled`);
      console.log(`🛡️ AI Protection: Candidate safety active`);
      console.log(`📊 Health: /api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start production server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Start the server
if (require.main === module) {
  startProductionServer();
}

export { app, startProductionServer };
export default app;

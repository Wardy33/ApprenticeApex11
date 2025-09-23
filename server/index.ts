import express from "express";
import compression from "compression";

// Import production database configuration
import { database, connectDatabase as dbConnect } from "./config/database.js";
import { initializeIndexes } from "./config/indexes";
import {
  databaseMiddleware,
  databaseHealthCheck,
  optimizeQueries,
} from "./middleware/database-neon";
import { createServer as createHttpServer } from "http";
import dotenv from "dotenv";
import session from "express-session";

// Import security middleware
import {
  helmetConfig,
  createRateLimit,
  secureRoutes,
  securityLogger,
} from "./middleware/security";

// Import environment validation
import { validateEnv, getEnvConfig } from "./config/env";
import { SecurityStartupValidator } from "./security/startupValidation";

// Import routes
import { handleDemo } from "./routes/demo";
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
import testRoutes from "./routes/test";
import testEndpointRoutes from "./routes/testEndpoints";
import healthRoutes from "./routes/health";
import stripeRoutes from "./routes/stripe";
import emailRoutes from "./routes/emails";
import adminRoutes from "./routes/admin";

// Import middleware
import { authenticateToken } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

// Import Socket.IO setup
import { initializeSocket } from "./socket/chat";

// Import alert system
import { AlertService } from "./services/alertService";

// Load environment variables
dotenv.config();

// Validate environment variables on startup (skip in Vite dev mode)
let env: any;
try {
  env = validateEnv();
} catch (error) {
  console.warn("⚠️  Environment validation skipped in development mode");
  env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT) || 3001,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5204",
    MONGODB_URI:
      process.env.MONGODB_URI || "mongodb://localhost:27017/apprenticeapex",
    JWT_SECRET:
      process.env.JWT_SECRET ||
      "development-secret-key-minimum-32-characters-long-for-security",
    RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  };
}

export function createApp() {
  const app = express();
  const httpServer = createHttpServer(app);

  // Initialize Socket.IO
  const io = initializeSocket(httpServer);

  // Make io available in request context
  app.set("io", io);

  // Trust proxy (important for rate limiting and IP detection)
  app.set("trust proxy", 1);

  // Compression middleware - Apply before other middleware for optimal performance
  app.use(
    compression({
      filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers["x-no-compression"]) {
          return false;
        }
        // Use compression default filter for all other responses
        return compression.filter(req, res);
      },
      level: 6, // Balanced compression level (1-9, where 6 is optimal)
      threshold: 1024, // Only compress responses larger than 1KB
      memLevel: 8, // Memory usage optimization
    }),
  );

  // Basic middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Database middleware
  app.use(databaseHealthCheck());
  app.use(optimizeQueries());

  // Apply security middleware only if environment is properly validated
  if (
    env.NODE_ENV &&
    typeof env.JWT_SECRET === "string" &&
    env.JWT_SECRET.length >= 32
  ) {
    // Security middleware (applied first)
    app.use(securityLogger());
    app.use(helmetConfig);

    // Basic CORS for development
    app.use((req: any, res: any, next: any) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "*");
      res.header("Access-Control-Allow-Methods", "*");
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Session configuration for CSRF protection
    app.use(
      session({
        secret: env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: env.NODE_ENV === "production", // HTTPS only in production
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
      }),
    );

    // Security routes middleware
    app.use(secureRoutes());
  } else {
    console.warn("⚠️  Security middleware disabled in development mode");
    // Basic CORS for development
    app.use((req: any, res: any, next: any) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "*");
      res.header("Access-Control-Allow-Methods", "*");
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  // Health check endpoints
  app.get("/api/ping", (_req, res) => {
    res.json({
      message: "ApprenticeApex API v1.0",
      timestamp: new Date().toISOString(),
      status: "healthy",
    });
  });

  // Comprehensive health check
  app.get("/api/health", async (_req, res) => {
    const dbStatus = database.getHealthStatus();
    const performanceMonitor = databaseMiddleware.monitor;
    const healthStatus = performanceMonitor.getHealthStatus();

    res.json({
      status:
        dbStatus.status === "healthy" && healthStatus.status === "healthy"
          ? "healthy"
          : "degraded",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      performance: healthStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: "1.0.0",
    });
  });

  // Enhanced health check routes
  app.use("/api/health", healthRoutes);

  // Rate limiting (only if security middleware is enabled)
  if (
    env.NODE_ENV &&
    typeof env.JWT_SECRET === "string" &&
    env.JWT_SECRET.length >= 32
  ) {
    app.use("/api/auth", createRateLimit(15 * 60 * 1000, 5)); // Auth rate limit
    app.use("/api/payments", createRateLimit(60 * 60 * 1000, 10)); // Payment rate limit
    app.use("/api/admin", createRateLimit(15 * 60 * 1000, 10)); // Admin rate limit (more permissive)
    // Apply general rate limit to all other API routes (excluding admin)
    app.use(/^\/api\/(?!admin).*/, createRateLimit());
  }

  // Public routes
  app.use("/api/auth", authRoutes);

  // Protected routes (require authentication)
  app.use("/api/users", authenticateToken, userRoutes);

  // Apprenticeships route - conditional authentication for development mode
  if (
    !database.isConnected() &&
    (!process.env.MONGODB_URI || process.env.MONGODB_URI === "")
  ) {
    console.log(
      "🔓 Apprenticeships routes running without global authentication in development mode",
    );
    app.use("/api/apprenticeships", apprenticeshipRoutes);
  } else {
    app.use("/api/apprenticeships", authenticateToken, apprenticeshipRoutes);
  }

  app.use("/api/applications", authenticateToken, applicationRoutes);
  app.use("/api/messages", authenticateToken, messageRoutes);
  app.use("/api/analytics", authenticateToken, analyticsRoutes);
  app.use("/api/upload", authenticateToken, uploadRoutes);
  app.use("/api/payments", paymentRoutes); // Some endpoints require auth, handled individually
  app.use("/api/stripe", stripeRoutes); // Stripe webhooks and utilities
  app.use("/api/interviews", authenticateToken, interviewRoutes);
  app.use("/api/video-interview", authenticateToken, videoInterviewRoutes);
  app.use("/api/matching", authenticateToken, matchingRoutes);
  app.use("/api/access-control", authenticateToken, accessControlRoutes);
  app.use("/api/alerts", authenticateToken, alertRoutes);
  app.use("/api/subscriptions", authenticateToken, subscriptionRoutes);
  app.use("/api/contact", contactRoutes); // Public route, no auth required
  app.use("/api/emails", emailRoutes); // Email management (mixed auth requirements)

  console.log("🔧 Mounting admin routes at /api/admin...");
  app.use("/api/admin", adminRoutes); // Master Admin routes (special authentication)
  console.log("✅ Admin routes mounted successfully at /api/admin");

  // Database testing routes (development and staging only)
  if (env.NODE_ENV !== "production") {
    app.use("/api/test", testRoutes);
    app.use("/api/test", testEndpointRoutes);
    console.log("🧪 Database test endpoints enabled at /api/test/*");
  }

  // Legacy demo route
  app.get("/api/demo", handleDemo);

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler
  app.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  return { app, httpServer, io };
}

// Production-ready database connection
export async function connectToDatabase() {
  try {
    // Check if MongoDB URI is provided
    if (!process.env.MONGODB_URI) {
      console.warn(
        "⚠️  MONGODB_URI not provided. Using development mode with mock data.",
      );
      console.log("🗄️  Database connection established (mock)");
      return true;
    }

    // Connect to production MongoDB
    await dbConnect();

    // Initialize database indexes
    await initializeIndexes();

    // Initialize alert system after database connection
    AlertService.initialize();
    AlertService.integrateWithMonitoring();
    console.log("🚨 Anti-poaching alert system initialized");

    // Register graceful shutdown handlers
    database.registerShutdownHandler(async () => {
      console.log("🚨 Shutting down alert system...");
      // Add any alert system cleanup here
    });

    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Legacy function for backwards compatibility
export async function connectDatabase() {
  return connectToDatabase();
}

// Export environment config for other modules
export { getEnvConfig };

// Legacy exports for backwards compatibility (will be removed)
export const JWT_SECRET = env.JWT_SECRET;
export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  mongoUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  stripe: {
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  daily: {
    apiKey: env.DAILY_API_KEY,
    domainName: env.DAILY_DOMAIN_NAME,
  },
  email: {
    service: env.EMAIL_SERVICE,
    user: env.EMAIL_USER,
    password: env.EMAIL_PASSWORD,
    from: env.EMAIL_FROM,
  },
  frontend: {
    url: env.FRONTEND_URL,
  },
};

// JWT utilities - using secure JWT service
import {
  generateToken as secureGenerateToken,
  verifyToken as secureVerifyToken,
  type JWTPayload,
} from "./services/secureJWTService";

export function generateToken(
  userId: string,
  role: "student" | "company" | "admin" | "master_admin",
  email: string,
): string {
  return secureGenerateToken({ userId, role, email });
}

export function verifyToken(token: string): JWTPayload {
  return secureVerifyToken(token);
}

// Password utilities - using secure password service
import {
  hashPassword as secureHashPassword,
  verifyPassword as secureVerifyPassword,
} from "./services/securePasswordService";

export async function hashPassword(password: string): Promise<string> {
  return secureHashPassword(password);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return secureVerifyPassword(password, hashedPassword);
}

// Export createServer function for serverless deployment
export function createServer() {
  const env = validateEnv();
  const app = express();

  // Trust proxy (important for serverless environments)
  app.set("trust proxy", 1);

  // Compression middleware for serverless
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
      threshold: 1024,
      memLevel: 8,
    }),
  );

  // Basic middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Database middleware with graceful degradation
  app.use(databaseHealthCheck());
  app.use(optimizeQueries());

  // Security middleware for production
  if (env.NODE_ENV === "production") {
    app.use(securityLogger());
    app.use(helmetConfig);

    // CORS for production
    app.use((req: any, res: any, next: any) => {
      const allowedOrigins = [env.FRONTEND_URL, "https://app.builder.io"];
      const origin = req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
      }
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      );
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }
      next();
    });
  }

  // Basic health check endpoints
  app.get("/api/ping", (_req, res) => {
    res.json({
      message: "ApprenticeApex API v1.0",
      timestamp: new Date().toISOString(),
      status: "healthy",
    });
  });

  // Enhanced health check routes
  app.use("/api/health", healthRoutes);

  // Public routes
  app.use("/api/auth", authRoutes);

  // Protected routes (require authentication)
  app.use("/api/users", authenticateToken, userRoutes);

  // Apprenticeships route - conditional authentication for development mode
  if (
    !database.isConnected() &&
    (!process.env.MONGODB_URI || process.env.MONGODB_URI === "")
  ) {
    console.log(
      "🔓 Apprenticeships routes running without global authentication in development mode",
    );
    app.use("/api/apprenticeships", apprenticeshipRoutes);
  } else {
    app.use("/api/apprenticeships", authenticateToken, apprenticeshipRoutes);
  }

  app.use("/api/applications", authenticateToken, applicationRoutes);
  app.use("/api/messages", authenticateToken, messageRoutes);
  app.use("/api/analytics", authenticateToken, analyticsRoutes);
  app.use("/api/upload", authenticateToken, uploadRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/stripe", stripeRoutes);
  app.use("/api/interviews", authenticateToken, interviewRoutes);
  app.use("/api/matching", authenticateToken, matchingRoutes);
  app.use("/api/access-control", authenticateToken, accessControlRoutes);
  app.use("/api/alerts", authenticateToken, alertRoutes);
  app.use("/api/subscriptions", authenticateToken, subscriptionRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/emails", emailRoutes);

  // Demo endpoints
  app.get("/api/demo", authenticateToken, (req, res) => {
    handleDemo(req, res);
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

// =============================================================================
// SERVER STARTUP CODE - ADD THIS TO THE BOTTOM OF YOUR index.ts
// =============================================================================

// Add global error handlers to prevent crashes
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  console.error("Stack:", error.stack);
  // Don't exit in development, just log the error
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason: any, promise) => {
  console.error("❌ Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
  // Don't exit in development, just log the error
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

// Only start server if this file is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  async function startServer() {
    try {
      const PORT = process.env.PORT || 3001;

      console.log("🚀 Starting ApprenticeApex Server...");
      console.log("📍 Environment:", process.env.NODE_ENV || "development");
      console.log("🔌 Port:", PORT);
      console.log(
        "🗄️  MongoDB URI:",
        process.env.MONGODB_URI ? "Set" : "Not set",
      );

      // CRITICAL: Run comprehensive security validation before starting
      console.log("🛡️  Running security validation...");
      const securityResult =
        await SecurityStartupValidator.validateSecurityOnStartup();

      if (!securityResult.passed) {
        console.error(
          "🚨 DEPLOYMENT BLOCKED: Critical security vulnerabilities detected",
        );
        console.error("🚨 Server startup aborted for security reasons");
        process.exit(1);
      }

      console.log("✅ Security validation passed - server startup authorized");

      // Create Express app with better error handling
      const { app, httpServer } = createApp();

      // Connect to database (with fallback)
      console.log("🔗 Attempting database connection...");
      const dbConnected = await connectToDatabase().catch((err) => {
        console.warn("⚠️  Database connection failed:", err.message);
        console.log("📝 Continuing without database (using mock data)...");
        return false;
      });

      if (dbConnected) {
        console.log("✅ Database connection successful");
      } else {
        console.log("📝 Running in development mode without database");
      }

      // Start the HTTP server with error handling
      const server = httpServer.listen(PORT, () => {
        console.log("🎯 ================================");
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌐 API available at: http://localhost:${PORT}/api`);
        console.log(`🏥 Health check: http://localhost:${PORT}/api/ping`);
        console.log(
          `📋 Registration: http://localhost:${PORT}/api/auth/register`,
        );
        console.log("🎯 ================================");
        console.log("🟢 Server is ready to accept requests");
      });

      // Handle server errors gracefully
      server.on("error", (error: any) => {
        console.error("❌ Server error:", error.message);
        if (error.code === "EADDRINUSE") {
          console.error(`❌ Port ${PORT} is already in use`);
          console.log("💡 Try a different port or kill the existing process");
          process.exit(1);
        }
      });

      // Handle client disconnections gracefully
      server.on("clientError", (err: any, socket: any) => {
        console.warn("⚠️  Client error:", err.message);
        if (!socket.destroyed) {
          socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
        }
      });

      // Graceful shutdown handlers
      const gracefulShutdown = (signal: string) => {
        console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);

        server.close((err) => {
          if (err) {
            console.error("❌ Error during server shutdown:", err);
          } else {
            console.log("🔒 HTTP server closed gracefully");
          }

          console.log("✅ Shutdown completed");
          process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
          console.error(
            "❌ Could not close connections in time, forcefully shutting down",
          );
          process.exit(1);
        }, 10000);
      };

      // Listen for termination signals
      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));

      return server;
    } catch (error: any) {
      console.error("❌ Failed to start server:", error.message);
      console.error("Stack trace:", error.stack);
      process.exit(1);
    }
  }

  // Start the server
  console.log("🎬 Initializing server startup...");
  startServer().catch((error) => {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  });
}

import { Request, Response, NextFunction } from "express";

// Performance monitoring middleware
export const performanceMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to response locals
  res.locals.requestId = requestId;

  console.log(`🚀 [${requestId}] ${req.method} ${req.url} - Started`);

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log performance metrics
    console.log(
      `📊 [${requestId}] ${req.method} ${req.url} - ${statusCode} - ${duration}ms`,
    );

    // Performance analysis
    if (duration > 1000) {
      console.warn(`⚠️ [${requestId}] Slow request detected: ${duration}ms`);
    }

    if (statusCode >= 500) {
      console.error(`❌ [${requestId}] Server error: ${statusCode}`);
    }

    // Could send to analytics service here
    if (process.env.ANALYTICS_ID) {
      // Analytics.track('api_request', {
      //   method: req.method,
      //   url: req.url,
      //   statusCode,
      //   duration,
      //   requestId
      // });
    }
  });

  next();
};

// Error tracking middleware
export const errorTracking = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = res.locals.requestId || "unknown";

  // Log error details
  console.error(`❌ [${requestId}] Production Error:`, {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  });

  // Send to error tracking service (Sentry, etc.)
  if (process.env.ERROR_TRACKING_DSN) {
    // Sentry.captureException(err, {
    //   tags: {
    //     requestId,
    //     method: req.method,
    //     url: req.url
    //   }
    // });
  }

  // Send user-friendly error response
  if (!res.headersSent) {
    const statusCode = (err as any).statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
      requestId: requestId,
    });
  }
};

// Health check middleware
export const healthCheck = (req: Request, res: Response) => {
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    services: {
      database: "connected", // You could check actual DB connection here
      auth: "operational",
      api: "operational",
    },
  };

  res.json(healthStatus);
};

// Security headers middleware
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Basic security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  next();
};

// Rate limiting (simple implementation)
const requestCounts = new Map();

export const rateLimit = (
  windowMs: number = 15 * 60 * 1000,
  max: number = 100,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    const requests = requestCounts.get(ip) || [];
    const validRequests = requests.filter((time: number) => time > windowStart);

    if (validRequests.length >= max) {
      return res.status(429).json({
        success: false,
        error: "Too many requests",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    validRequests.push(now);
    requestCounts.set(ip, validRequests);

    next();
  };
};

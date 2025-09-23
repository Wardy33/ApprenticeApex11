import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import { getSecureEnvConfig } from "../config/secureEnv";

// Security configuration based on environment
interface SecurityConfig {
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableSlowDown: boolean;
  enableHSTS: boolean;
  enableCSP: boolean;
}

export class ComprehensiveSecurityMiddleware {
  private static config: SecurityConfig;

  // Initialize security configuration
  static initialize(): void {
    const env = getSecureEnvConfig();

    this.config = {
      corsOrigins:
        env.NODE_ENV === "production"
          ? [env.FRONTEND_URL]
          : [
              env.FRONTEND_URL,
              "http://localhost:5204",
              "http://localhost:3000",
              "http://localhost:5173",
            ],
      rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
      rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS || 100,
      enableSlowDown: env.NODE_ENV === "production",
      enableHSTS: env.NODE_ENV === "production",
      enableCSP: env.NODE_ENV === "production",
    };

    console.log("🛡️  Comprehensive security middleware initialized");
  }

  // Helmet security headers configuration
  static getHelmetConfig() {
    if (!this.config) this.initialize();

    return helmet({
      // Content Security Policy
      contentSecurityPolicy: this.config.enableCSP
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: [
                "'self'",
                "'unsafe-inline'", // Required for some UI libraries
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
              ],
              fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
              ],
              imgSrc: ["'self'", "data:", "https:", "blob:"],
              scriptSrc: [
                "'self'",
                "https://js.stripe.com",
                "https://checkout.stripe.com",
                "'unsafe-eval'", // Required for some build tools in development
              ],
              connectSrc: [
                "'self'",
                "https://api.stripe.com",
                "https://checkout.stripe.com",
                "wss:",
              ],
              frameSrc: [
                "'self'",
                "https://js.stripe.com",
                "https://checkout.stripe.com",
              ],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,

      // HTTP Strict Transport Security
      hsts: this.config.enableHSTS
        ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
          }
        : false,

      // X-Frame-Options
      frameguard: { action: "deny" },

      // X-Content-Type-Options
      noSniff: true,

      // X-XSS-Protection
      xssFilter: true,

      // Referrer Policy
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },

      // X-Permitted-Cross-Domain-Policies
      permittedCrossDomainPolicies: false,

      // X-DNS-Prefetch-Control
      dnsPrefetchControl: { allow: false },

      // Hide X-Powered-By header
      hidePoweredBy: true,
    });
  }

  // CORS configuration
  static getCORSConfig() {
    if (!this.config) this.initialize();

    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        if (this.config.corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`🚨 CORS violation: ${origin} not in allowed origins`);
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "X-CSRF-Token",
        "Stripe-Signature",
      ],
      exposedHeaders: ["X-Total-Count"],
      maxAge: 86400, // 24 hours
    });
  }

  // Rate limiting configuration
  static getRateLimitConfig(
    windowMs?: number,
    max?: number,
    skipOptions?: (req: Request) => boolean,
  ) {
    if (!this.config) this.initialize();

    return rateLimit({
      windowMs: windowMs || this.config.rateLimitWindowMs,
      max: max || this.config.rateLimitMaxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      skip: skipOptions,
      message: {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(
          (windowMs || this.config.rateLimitWindowMs) / 1000,
        ),
      },
      handler: (req: Request, res: Response) => {
        console.warn(
          `🚨 Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`,
        );
        res.status(429).json({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil(
            (windowMs || this.config.rateLimitWindowMs) / 1000,
          ),
        });
      }
    });
  }

  // Slow down middleware for progressive delay
  static getSlowDownConfig() {
    if (!this.config) this.initialize();

    if (!this.config.enableSlowDown) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return slowDown({
      windowMs: this.config.rateLimitWindowMs,
      delayAfter: Math.floor(this.config.rateLimitMaxRequests * 0.5), // Start slowing down at 50%
      delayMs: 500, // Start with 500ms delay
      maxDelayMs: 20000, // Maximum 20 second delay
      skipFailedRequests: false,
      skipSuccessfulRequests: false
    });
  }

  // Authentication rate limiting (stricter)
  static getAuthRateLimitConfig() {
    return this.getRateLimitConfig(
      15 * 60 * 1000, // 15 minutes
      5, // 5 attempts per window
      (req: Request) => {
        // Skip rate limiting for successful authentication
        return false;
      },
    );
  }

  // Payment rate limiting (very strict)
  static getPaymentRateLimitConfig() {
    return this.getRateLimitConfig(
      60 * 60 * 1000, // 1 hour
      10, // 10 payment attempts per hour
    );
  }

  // Admin rate limiting (moderate)
  static getAdminRateLimitConfig() {
    return this.getRateLimitConfig(
      15 * 60 * 1000, // 15 minutes
      50, // 50 requests per window for admin operations
    );
  }

  // Input sanitization middleware
  static inputSanitization() {
    return (req: Request, _res: Response, next: NextFunction) => {
      // Sanitize request body
      if (req.body && typeof req.body === "object") {
        req.body = this.sanitizeObject(req.body);
      }

      // Sanitize query parameters
      if (req.query && typeof req.query === "object") {
        req.query = this.sanitizeObject(req.query);
      }

      next();
    };
  }

  // Security headers middleware
  static securityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Additional security headers
      res.setHeader("X-Request-ID", Math.random().toString(36).substring(7));
      res.setHeader("X-API-Version", "1.0.0");

      // Prevent caching of sensitive endpoints
      if (req.path.includes("/api/auth/") || req.path.includes("/api/admin/")) {
        res.setHeader(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, private",
        );
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }

      next();
    };
  }

  // Request logging middleware
  static requestLogging() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      // Log request
      console.log(`📡 ${req.method} ${req.path} from ${req.ip}`);

      // Log response
      res.on("finish", () => {
        const duration = Date.now() - startTime;
        const statusColor = res.statusCode >= 400 ? "❌" : "✅";
        console.log(
          `${statusColor} ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`,
        );

        // Log slow requests
        if (duration > 1000) {
          console.warn(
            `🐌 Slow request: ${req.method} ${req.path} took ${duration}ms`,
          );
        }
      });

      next();
    };
  }

  // Suspicious activity detection
  static suspiciousActivityDetection() {
    const suspiciousPatterns = [
      /(\.\.\/.*){3,}/, // Path traversal attempts
      /<script|javascript:/i, // XSS attempts
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i, // SQL injection
      /\b(eval|document\.cookie|window\.location)/i, // JavaScript injection
    ];

    return (req: Request, res: Response, next: NextFunction) => {
      const fullUrl = req.url;
      const body = JSON.stringify(req.body || {});

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(fullUrl) || pattern.test(body)) {
          console.error(
            `🚨 Suspicious activity detected from ${req.ip}: ${req.method} ${req.path}`,
          );
          console.error(`🚨 Pattern matched: ${pattern}`);

          res.status(403).json({
            error: "Forbidden",
            message: "Suspicious activity detected",
            code: "SECURITY_VIOLATION",
          });
          return;
        }
      }

      next();
    };
  }

  // Utility function to sanitize objects
  private static sanitizeObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Remove potentially dangerous keys
        if (["__proto__", "constructor", "prototype"].includes(key)) {
          continue;
        }

        // Recursively sanitize nested objects
        sanitized[key] =
          typeof obj[key] === "object"
            ? this.sanitizeObject(obj[key])
            : obj[key];
      }
    }

    return sanitized;
  }

  // Get all security middleware in correct order
  static getAllMiddleware() {
    return [
      this.requestLogging(),
      this.getHelmetConfig(),
      this.getCORSConfig(),
      this.securityHeaders(),
      this.inputSanitization(),
      this.suspiciousActivityDetection(),
      this.getSlowDownConfig(),
      this.getRateLimitConfig(),
    ];
  }

  // Get security configuration for debugging
  static getSecurityConfig() {
    if (!this.config) this.initialize();
    return { ...this.config };
  }
}

// Initialize on module load
ComprehensiveSecurityMiddleware.initialize();

// Export individual middleware functions
export const helmetConfig = ComprehensiveSecurityMiddleware.getHelmetConfig();
export const corsConfig = ComprehensiveSecurityMiddleware.getCORSConfig();
export const rateLimitConfig =
  ComprehensiveSecurityMiddleware.getRateLimitConfig();
export const authRateLimit =
  ComprehensiveSecurityMiddleware.getAuthRateLimitConfig();
export const paymentRateLimit =
  ComprehensiveSecurityMiddleware.getPaymentRateLimitConfig();
export const adminRateLimit =
  ComprehensiveSecurityMiddleware.getAdminRateLimitConfig();
export const inputSanitization =
  ComprehensiveSecurityMiddleware.inputSanitization();
export const securityHeaders =
  ComprehensiveSecurityMiddleware.securityHeaders();
export const requestLogging = ComprehensiveSecurityMiddleware.requestLogging();
export const suspiciousActivityDetection =
  ComprehensiveSecurityMiddleware.suspiciousActivityDetection();
export const allSecurityMiddleware =
  ComprehensiveSecurityMiddleware.getAllMiddleware();

// Exported via class declaration above

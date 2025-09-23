import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { sendError, sendValidationError } from "../utils/apiResponse";

// PCI Compliance security headers
export function addPCIHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure HTTPS in production
    if (
      process.env.NODE_ENV === "production" &&
      !req.secure &&
      req.get("x-forwarded-proto") !== "https"
    ) {
      return sendError(
        res,
        "HTTPS required for payment processing",
        400,
        "HTTPS_REQUIRED",
      );
    }

    // Add security headers for payment pages
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // CSP for Stripe integration
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://js.stripe.com; " +
        "connect-src 'self' https://api.stripe.com; " +
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; " +
        "style-src 'self' 'unsafe-inline';",
    );

    next();
  };
}

// Validate payment amounts
export function validatePaymentAmount(fieldName: string = "amount") {
  return [
    body(fieldName)
      .isInt({ min: 50, max: 50000000 }) // £0.50 to £500,000
      .withMessage("Payment amount must be between £0.50 and £500,000"),

    (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(
          res,
          errors
            .array()
            .map((e: any) => ({
              field: e.path || e.param || "field",
              message: e.msg || "Invalid",
            })),
          "Invalid payment amount",
        );
      }
      next();
    },
  ];
}

// Validate currency codes
export function validateCurrency(fieldName: string = "currency") {
  return [
    body(fieldName)
      .isIn(["GBP", "USD", "EUR", "gbp", "usd", "eur"])
      .withMessage("Currency must be GBP, USD, or EUR"),

    (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendValidationError(
          res,
          errors
            .array()
            .map((e: any) => ({
              field: e.path || e.param || "field",
              message: e.msg || "Invalid",
            })),
          "Invalid currency",
        );
      }

      // Normalize currency to uppercase
      if (req.body.currency) {
        req.body.currency = req.body.currency.toUpperCase();
      }

      next();
    },
  ];
}

// Sanitize payment metadata
export function sanitizePaymentMetadata() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.body.metadata && typeof req.body.metadata === "object") {
      const sanitized: Record<string, string> = {};

      Object.keys(req.body.metadata).forEach((key) => {
        // Only allow alphanumeric keys
        if (/^[a-zA-Z0-9_]+$/.test(key) && key.length <= 40) {
          const value = req.body.metadata[key];
          // Convert value to string and limit length
          if (typeof value === "string" || typeof value === "number") {
            sanitized[key] = String(value).substring(0, 500);
          }
        }
      });

      req.body.metadata = sanitized;
    }

    next();
  };
}

// Rate limiting for payment endpoints
export function createPaymentRateLimit() {
  return (_req: Request, res: Response, next: NextFunction) => {
    // This would integrate with your existing rate limiting middleware
    // For now, we'll just add headers to indicate rate limiting is active
    res.setHeader("X-RateLimit-Payment", "active");
    next();
  };
}

// Stripe error handler
export function handleStripeError(error: any): {
  message: string;
  code: string;
  statusCode: number;
} {
  console.error("Stripe Error:", error);

  if (error.type === "StripeCardError") {
    // Card was declined
    return {
      message: getCardDeclineMessage(error.decline_code),
      code: "CARD_DECLINED",
      statusCode: 400,
    };
  }

  if (error.type === "StripeRateLimitError") {
    return {
      message: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
      statusCode: 429,
    };
  }

  if (error.type === "StripeInvalidRequestError") {
    return {
      message: "Invalid payment request. Please check your information.",
      code: "INVALID_REQUEST",
      statusCode: 400,
    };
  }

  if (error.type === "StripeAPIError") {
    return {
      message: "Payment service temporarily unavailable. Please try again.",
      code: "API_ERROR",
      statusCode: 502,
    };
  }

  if (error.type === "StripeConnectionError") {
    return {
      message: "Network error occurred. Please check your connection.",
      code: "NETWORK_ERROR",
      statusCode: 502,
    };
  }

  if (error.type === "StripeAuthenticationError") {
    return {
      message: "Payment authentication failed. Please contact support.",
      code: "AUTH_ERROR",
      statusCode: 401,
    };
  }

  // Default error
  return {
    message: "Payment processing failed. Please try again.",
    code: "PAYMENT_ERROR",
    statusCode: 500,
  };
}

// User-friendly card decline messages
function getCardDeclineMessage(declineCode?: string): string {
  const messages: Record<string, string> = {
    insufficient_funds: "Your card has insufficient funds.",
    card_declined: "Your card was declined. Please contact your bank.",
    expired_card: "Your card has expired. Please use a different card.",
    incorrect_cvc: "Your card's security code is incorrect.",
    processing_error:
      "An error occurred processing your card. Please try again.",
    call_issuer: "Please contact your bank to authorize this payment.",
    pickup_card: "Your card cannot be used for this payment.",
    restricted_card: "Your card cannot be used for this type of payment.",
    security_violation:
      "Your payment was flagged by security. Please contact support.",
    service_not_allowed: "This type of payment is not supported by your card.",
    stop_payment_order: "This payment has been stopped by your bank.",
    testmode_decline: "This is a test card decline (test mode only).",
    approve_with_id: "The payment cannot be authorized.",
  };

  return (
    messages[declineCode || ""] ||
    "Your payment was declined. Please try a different card."
  );
}

// Validate Stripe webhook signature
export function validateWebhookSignature() {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return sendError(
        res,
        "Webhook signature required",
        400,
        "MISSING_SIGNATURE",
      );
    }

    if (typeof signature !== "string") {
      return sendError(
        res,
        "Invalid webhook signature format",
        400,
        "INVALID_SIGNATURE",
      );
    }

    // Store signature for processing
    req.stripeSignature = signature;
    next();
  };
}

// Audit logging for payment operations
export function auditPaymentOperation(operation: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auditData = {
      operation,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: (req as any).user?.userId,
      path: req.path,
      method: req.method,
    };

    console.log(`💳 Payment Audit: ${operation}`, auditData);

    // In production, this would be sent to a security logging service
    next();
  };
}

// Payment idempotency check
export function ensureIdempotency() {
  return (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers["idempotency-key"] as string;

    if (!idempotencyKey && ["POST", "PUT"].includes(req.method)) {
      // Generate idempotency key if not provided
      req.headers["idempotency-key"] =
        `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    next();
  };
}

// Declare module augmentation for custom request properties
declare global {
  namespace Express {
    interface Request {
      stripeSignature?: string;
    }
  }
}

// Functions are already exported above, removing duplicate exports

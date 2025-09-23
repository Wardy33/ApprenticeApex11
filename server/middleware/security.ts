import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { getEnvConfig } from '../config/env';

// Configure Helmet for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.daily.co"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://*.daily.co"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Daily.co video calls
});

// Configure CORS
export const corsConfig = cors({
  origin: (origin, callback) => {
    const env = getEnvConfig();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      env.FRONTEND_URL,
      'https://apprenticeapex.com',
      'https://www.apprenticeapex.com',
      'https://app.apprenticeapex.com',
      // Add development origins
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ];

    // In development, be more permissive
    if (env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3001');
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

// Rate limiting configuration
export function createRateLimit(windowMs?: number, max?: number) {
  const defaultWindowMs = windowMs || 900000; // 15 minutes
  const defaultMax = max || 100;

  try {
    const env = getEnvConfig();

    return rateLimit({
      windowMs: windowMs || env.RATE_LIMIT_WINDOW_MS,
      max: max || env.RATE_LIMIT_MAX_REQUESTS,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((windowMs || env.RATE_LIMIT_WINDOW_MS) / 1000 / 60),
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        console.warn(`🚨 Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
        res.status(429).json({
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil((windowMs || env.RATE_LIMIT_WINDOW_MS) / 1000 / 60),
        });
      },
    });
  } catch (error) {
    // Fallback for development when environment isn't validated
    return rateLimit({
      windowMs: defaultWindowMs,
      max: defaultMax,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(defaultWindowMs / 1000 / 60),
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}

// Stricter rate limiting for authentication endpoints
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes

// Payment endpoint rate limiting
export const paymentRateLimit = createRateLimit(60 * 60 * 1000, 10); // 10 requests per hour

// Basic CSRF protection middleware (simple token-based)
export function createCSRFProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for GET requests and API endpoints that use Bearer tokens
    if (req.method === 'GET' || req.headers.authorization?.startsWith('Bearer ')) {
      return next();
    }

    // For now, we'll implement a simple CSRF check
    // In production, consider using a more robust solution
    const token = req.headers['x-csrf-token'] || req.body._token;
    const sessionToken = (req.session as any)?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      console.warn(`🚨 CSRF token mismatch for ${req.ip} on ${req.path}`);
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    next();
  };
}

// Security headers middleware for specific routes
export function secureRoutes() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add additional security headers for sensitive routes
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
  };
}

// Request logging for security monitoring
export function securityLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Log suspicious activity
    if (req.path.includes('admin') || req.path.includes('.env') || req.path.includes('config')) {
      console.warn(`🚨 Suspicious request: ${timestamp} - ${ip} - ${req.method} ${req.path} - ${userAgent}`);
    }
    
    next();
  };
}

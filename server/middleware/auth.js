const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { neonQuery } = require("../config/database");

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 attempts per windowMs
  message: {
    error: "Too many authentication attempts",
    message: "Please try again later",
    retryAfter: Math.ceil((15 * 60 * 1000) / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/api/health" || req.path === "/api/ping";
  },
});

// Admin-specific rate limiting (more restrictive)
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 admin attempts per windowMs
  message: {
    error: "Too many admin authentication attempts",
    message: "Admin account access temporarily restricted",
    retryAfter: Math.ceil((15 * 60 * 1000) / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced JWT verification middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Access token required",
        code: "NO_TOKEN",
        message: "Please provide a valid authentication token",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token expiration (additional check)
    if (decoded.exp <= Date.now() / 1000) {
      return res.status(401).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
        message: "Please login again",
      });
    }

    // Validate required token fields
    if (!decoded.userId || !decoded.email || !decoded.role) {
      return res.status(401).json({
        error: "Invalid token format",
        code: "INVALID_TOKEN",
        message: "Token is missing required information",
      });
    }

    // Check for suspicious token characteristics
    if (
      typeof decoded.userId !== "number" &&
      typeof decoded.userId !== "string"
    ) {
      return res.status(401).json({
        error: "Invalid token format",
        code: "INVALID_TOKEN",
        message: "Invalid user ID format",
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      isMasterAdmin: decoded.isMasterAdmin || false,
      adminPermissions: decoded.adminPermissions,
      tokenIssued: decoded.iat,
      tokenExpires: decoded.exp,
    };

    console.log(`🔐 Authenticated user: ${decoded.email} (${decoded.role})`);
    next();
  } catch (error) {
    console.error("❌ JWT verification error:", error.message);

    // Handle different JWT errors specifically
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        error: "Invalid token",
        code: "INVALID_TOKEN",
        message: "Token signature is invalid",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
        message: "Please login again",
      });
    }

    if (error.name === "NotBeforeError") {
      return res.status(401).json({
        error: "Token not active",
        code: "TOKEN_NOT_ACTIVE",
        message: "Token is not yet valid",
      });
    }

    return res.status(500).json({
      error: "Authentication error",
      code: "AUTH_ERROR",
      message: "An error occurred during authentication",
    });
  }
};

// Master admin authentication with enhanced security
const requireMasterAdmin = async (req, res, next) => {
  try {
    // Verify user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "NO_AUTH",
        message: "Please login first",
      });
    }

    // Check for master admin role
    if (req.user.role !== "master_admin" && !req.user.isMasterAdmin) {
      console.warn(
        `🚨 Unauthorized admin access attempt: ${req.user.email} from IP: ${req.ip}`,
      );
      return res.status(403).json({
        error: "Master admin access required",
        code: "INSUFFICIENT_PERMISSIONS",
        message: "This action requires master admin privileges",
      });
    }

    // Additional security: verify admin exists and is active in database
    try {
      const adminExists = await neonQuery(
        `SELECT id, is_master_admin, role, account_locked, last_login_at 
         FROM users 
         WHERE id = $1 AND (is_master_admin = true OR role = 'master_admin') 
         AND account_locked != true`,
        [req.user.userId],
      );

      if (adminExists.length === 0) {
        console.error(
          `🚨 Admin account not found or locked: ${req.user.email}`,
        );
        return res.status(403).json({
          error: "Admin account not found or suspended",
          code: "ADMIN_NOT_FOUND",
          message: "Admin account is not available",
        });
      }

      // Log admin access for security auditing
      await neonQuery(
        `INSERT INTO admin_logs 
         (admin_id, action, target_type, target_id, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          req.user.userId,
          `ACCESS_${req.method}_${req.path}`,
          "system",
          "admin_access",
          req.ip,
          req.headers["user-agent"] || "unknown",
        ],
      );

      console.log(`✅ Master admin access granted: ${req.user.email}`);
      next();
    } catch (dbError) {
      console.error("❌ Database error during admin verification:", dbError);
      return res.status(500).json({
        error: "Authentication verification failed",
        code: "AUTH_DB_ERROR",
        message: "Could not verify admin permissions",
      });
    }
  } catch (error) {
    console.error("❌ Master admin auth error:", error);
    res.status(500).json({
      error: "Authentication error",
      code: "AUTH_ERROR",
      message: "An error occurred during authentication",
    });
  }
};

// Role-based access control
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "NO_AUTH",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        message: `This action requires one of: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

// Generate secure JWT token
const generateToken = (user, expiresIn = "7d") => {
  try {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isMasterAdmin: user.is_master_admin || user.role === "master_admin",
      adminPermissions: user.admin_permissions,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      issuer: "apprenticeapex",
      audience: "apprenticeapex-users",
    });
  } catch (error) {
    console.error("❌ Token generation error:", error);
    throw new Error("Failed to generate authentication token");
  }
};

// Verify token without throwing errors (for optional auth)
const verifyTokenOptional = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    req.user = null;
  }

  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  // Remove server info
  res.removeHeader("X-Powered-By");

  next();
};

module.exports = {
  authenticateToken,
  requireMasterAdmin,
  requireRole,
  authLimiter,
  adminAuthLimiter,
  generateToken,
  verifyTokenOptional,
  securityHeaders,
};

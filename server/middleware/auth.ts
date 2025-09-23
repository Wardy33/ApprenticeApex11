import { Request, Response, NextFunction } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyTokenNotBlacklisted } from "../services/secureJWTService";

// Define user types (updated to match secure JWT service)
export interface User {
  userId: string;
  role: 'student' | 'company' | 'admin' | 'master_admin';
  email: string;
  sessionId?: string;
  permissions?: string[];
  isMasterAdmin?: boolean;
  adminPermissions?: {
    canViewAllUsers: boolean;
    canViewFinancials: boolean;
    canModerateContent: boolean;
    canAccessSystemLogs: boolean;
    canExportData: boolean;
    canManageAdmins: boolean;
    canConfigureSystem: boolean;
  };
}

export type AuthenticatedRequest = Request;

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      error: "Access token required",
      code: "MISSING_TOKEN"
    });
    return;
  }

  try {
    // Use secure JWT verification with blacklist checking
    const decoded = verifyTokenNotBlacklisted(token);

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      sessionId: decoded.sessionId,
      permissions: decoded.permissions,
      isMasterAdmin: decoded.role === 'master_admin',
      // Map permissions for backward compatibility
      adminPermissions: decoded.permissions ? {
        canViewAllUsers: decoded.permissions.includes('view_users'),
        canViewFinancials: decoded.permissions.includes('view_financials'),
        canModerateContent: decoded.permissions.includes('moderate_content'),
        canAccessSystemLogs: decoded.permissions.includes('access_logs'),
        canExportData: decoded.permissions.includes('export_data'),
        canManageAdmins: decoded.permissions.includes('manage_admins'),
        canConfigureSystem: decoded.permissions.includes('configure_system'),
      } : undefined,
    };

    next();
  } catch (error) {
    console.warn(`🚨 Invalid token attempt from IP: ${req.ip}`);
    console.warn(`🚨 Token error: ${error instanceof Error ? error.message : 'Unknown error'}`);

    // Provide specific error messages for different token issues
    let errorCode = "INVALID_TOKEN";
    let errorMessage = "Invalid or expired token";

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorCode = "TOKEN_EXPIRED";
        errorMessage = "Authentication token expired";
      } else if (error.message.includes('revoked')) {
        errorCode = "TOKEN_REVOKED";
        errorMessage = "Authentication token revoked";
      } else if (error.message.includes('Invalid')) {
        errorCode = "INVALID_TOKEN";
        errorMessage = "Invalid authentication token";
      }
    }

    res.status(403).json({
      error: errorMessage,
      code: errorCode
    });
    return;
  }
}

export function requireRole(roles: Array<'student' | 'company' | 'admin' | 'master_admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        code: "NO_AUTH"
      });
      return;
    }

    // Support both 'candidate' and 'student' for backward compatibility
    const userRole = req.user.role === 'candidate' ? 'student' : req.user.role;
    const compatibleRoles = roles.map(role => role === 'student' ? ['student', 'candidate'] : [role]).flat();

    if (!compatibleRoles.includes(userRole as any)) {
      console.warn(`🚨 Unauthorized access attempt: ${req.user.email} (${req.user.role}) tried to access ${req.path}`);
      res.status(403).json({
        error: "Insufficient permissions for this action",
        code: "INSUFFICIENT_PERMISSIONS",
        required: roles,
        current: req.user.role
      });
      return;
    }

    next();
  };
}

export function requireStudentRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  requireRole(["student"])(req, res, next);
}

// Backward compatibility
export function requireCandidateRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  requireRole(["student"])(req, res, next);
}

export function requireCompanyRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  requireRole(["company"])(req, res, next);
}

export function requireAdminRole(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  requireRole(["admin", "master_admin"])(req, res, next);
}

export function requireMasterAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      error: "Authentication required",
      code: "NO_AUTH"
    });
    return;
  }

  if (req.user.role !== 'master_admin' || !req.user.isMasterAdmin) {
    console.warn(`🚨 Master admin access denied: ${req.user.email} (${req.user.role}) tried to access ${req.path}`);
    res.status(403).json({
      error: "Master admin access required",
      code: "MASTER_ADMIN_REQUIRED",
      message: "This endpoint requires Master Admin privileges"
    });
    return;
  }

  next();
}

export function requireAdminPermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        code: "NO_AUTH"
      });
      return;
    }

    if (req.user.role !== 'master_admin' && req.user.role !== 'admin') {
      res.status(403).json({
        error: "Admin access required",
        code: "ADMIN_ACCESS_REQUIRED"
      });
      return;
    }

    // Master admin has all permissions
    if (req.user.role === 'master_admin') {
      next();
      return;
    }

    // Check specific permission for regular admin
    const hasPermission = req.user.adminPermissions && (req.user.adminPermissions as any)[permission];
    if (!hasPermission) {
      res.status(403).json({
        error: `Permission '${permission}' required`,
        code: "INSUFFICIENT_ADMIN_PERMISSIONS"
      });
      return;
    }

    next();
  };
}

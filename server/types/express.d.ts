import "express-serve-static-core";

// Augment Express Request with authenticated user info used across the app
declare module "express-serve-static-core" {
  interface AuthUser {
    id: string; // legacy alias used in some routes
    userId: string; // primary identifier used in most services
    role: "student" | "candidate" | "company" | "admin" | "master_admin";
    email: string;
    name?: string;
    permissions?: string[];
    isMasterAdmin?: boolean;
    adminPermissions?: Record<string, boolean>;
  }
  interface Request {
    user?: AuthUser;
  }
}

import express, { Response } from "express";
import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  sendSuccess,
  sendError,
  sendValidationError,
} from "../utils/apiResponse";
import { requireDatabase } from "../middleware/database-neon";
import rateLimit from "express-rate-limit";

// Import production schemas and services
import { User } from "../models/User";
import EmailService from "../services/emailService";
// emailTemplates import not used in this simplified flow
import { getEnvConfig } from "../config/env";

const router = express.Router();

// Rate limiting for email endpoints
const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 emails per 15 minutes per user
  message: {
    error: "Too many email requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request, _res: Response) => {
    // Use user ID if authenticated, otherwise use a simple fallback
    return (req as any).user?.userId || "anonymous";
  },
});

// Stricter rate limiting for password reset
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset attempts per hour
  message: {
    error: "Too many password reset attempts. Please try again in an hour.",
    code: "PASSWORD_RESET_LIMIT_EXCEEDED",
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request, _res: Response) => {
    // Use email from request body for password reset limiting
    return (req as any).body.email || "anonymous";
  },
});

// Validation middleware
const emailVerificationValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
];

const passwordResetValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
];

const emailPreferencesValidation = [
  body("applicationNotifications").optional().isBoolean(),
  body("paymentNotifications").optional().isBoolean(),
  body("marketingEmails").optional().isBoolean(),
  body("weeklyDigest").optional().isBoolean(),
  body("interviewReminders").optional().isBoolean(),
];

// Send Email Verification
router.post(
  "/verification/send",
  emailRateLimit,
  emailVerificationValidation,
  requireDatabase,
  asyncHandler(async (req: any, res: Response) => {
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
        "Validation failed",
      );
    }

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal whether email exists for security
        return sendSuccess(res, {
          message:
            "If an account with this email exists, a verification email has been sent.",
        });
      }

      if (user.isEmailVerified) {
        return sendError(
          res,
          "Email is already verified",
          400,
          "EMAIL_ALREADY_VERIFIED",
        );
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      const template = {
        subject: "Verify your ApprenticeApex email",
        html: `<p>Hello ${user.email},</p><p>Please verify your email using this token:</p><p><strong>${verificationToken}</strong></p>`,
        text: `Verify your email with token: ${verificationToken}`,
      };

      await EmailService.getInstance().sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`📧 Email verification sent to: ${user.email}`);

      sendSuccess(res, {
        message: "Verification email sent successfully",
      });
    } catch (error) {
      console.error("Email verification send error:", error);
      return sendError(
        res,
        "Failed to send verification email",
        500,
        "EMAIL_SEND_ERROR",
      );
    }
  }),
);

// Verify Email
router.post(
  "/verification/verify",
  requireDatabase,
  asyncHandler(async (req: any, res: Response) => {
    const { token } = req.body;

    if (!token) {
      return sendError(
        res,
        "Verification token is required",
        400,
        "TOKEN_REQUIRED",
      );
    }

    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      });

      if (!user) {
        return sendError(
          res,
          "Invalid or expired verification token",
          400,
          "INVALID_TOKEN",
        );
      }

      // Verify email
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      user.emailVerifiedAt = new Date();

      await user.save();

      console.log(`✅ Email verified for user: ${user.email}`);

      sendSuccess(res, {
        message: "Email verified successfully",
        user: {
          id: user._id,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (error) {
      console.error("Email verification error:", error);
      return sendError(
        res,
        "Email verification failed",
        500,
        "VERIFICATION_ERROR",
      );
    }
  }),
);

// Send Password Reset Email
router.post(
  "/password-reset/send",
  passwordResetRateLimit,
  passwordResetValidation,
  requireDatabase,
  asyncHandler(async (req: any, res: Response) => {
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
        "Validation failed",
      );
    }

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal whether email exists for security
        return sendSuccess(res, {
          message:
            "If an account with this email exists, a password reset email has been sent.",
        });
      }

      // Generate password reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      const template = {
        subject: "Reset your ApprenticeApex password",
        html: `<p>Hello ${user.email},</p><p>Use this token to reset your password:</p><p><strong>${resetToken}</strong></p>`,
        text: `Reset token: ${resetToken}`,
      };

      await EmailService.getInstance().sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`📧 Password reset email sent to: ${user.email}`);

      sendSuccess(res, {
        message: "Password reset email sent successfully",
      });
    } catch (error) {
      console.error("Password reset email error:", error);
      return sendError(
        res,
        "Failed to send password reset email",
        500,
        "EMAIL_SEND_ERROR",
      );
    }
  }),
);

// Update Email Preferences
router.patch(
  "/preferences",
  authenticateToken,
  emailPreferencesValidation,
  requireDatabase,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
        "Validation failed",
      );
    }

    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "Authentication required", 401, "UNAUTHORIZED");
    }

    try {
      const updateData = {
        emailPreferences: {
          applicationNotifications: req.body.applicationNotifications,
          paymentNotifications: req.body.paymentNotifications,
          marketingEmails: req.body.marketingEmails,
          weeklyDigest: req.body.weeklyDigest,
          interviewReminders: req.body.interviewReminders,
          updatedAt: new Date(),
        },
      };

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return sendError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      console.log(`📧 Email preferences updated for user: ${user.email}`);

      sendSuccess(res, {
        emailPreferences: user.emailPreferences,
      });
    } catch (error) {
      console.error("Email preferences update error:", error);
      return sendError(
        res,
        "Failed to update email preferences",
        500,
        "UPDATE_ERROR",
      );
    }
  }),
);

// Get Email Preferences
router.get(
  "/preferences",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, "Authentication required", 401, "UNAUTHORIZED");
    }

    try {
      const user = await User.findById(userId).select("emailPreferences");
      if (!user) {
        return sendError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      sendSuccess(res, {
        emailPreferences: user.emailPreferences || {
          applicationNotifications: true,
          paymentNotifications: true,
          marketingEmails: true,
          weeklyDigest: true,
          interviewReminders: true,
        },
      });
    } catch (error) {
      console.error("Email preferences fetch error:", error);
      return sendError(
        res,
        "Failed to fetch email preferences",
        500,
        "FETCH_ERROR",
      );
    }
  }),
);

// Unsubscribe from all emails
router.post(
  "/unsubscribe",
  body("email").isEmail().normalizeEmail(),
  body("token").optional().isLength({ min: 10 }),
  requireDatabase,
  asyncHandler(async (req: any, res: Response) => {
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
        "Validation failed",
      );
    }

    const { email, token } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return sendSuccess(res, {
          message:
            "If an account with this email exists, you have been unsubscribed.",
        });
      }

      // Verify unsubscribe token if provided (more secure)
      if (token && user.unsubscribeToken !== token) {
        return sendError(
          res,
          "Invalid unsubscribe token",
          400,
          "INVALID_TOKEN",
        );
      }

      // Unsubscribe from all non-essential emails
      user.emailPreferences = {
        applicationNotifications: true, // Keep essential notifications
        paymentNotifications: true, // Keep essential notifications
        marketingEmails: false,
        weeklyDigest: false,
        interviewReminders: true, // Keep essential notifications
        unsubscribedAt: new Date(),
      };

      await user.save();

      console.log(`📧 User unsubscribed: ${user.email}`);

      sendSuccess(res, {
        message:
          "You have been unsubscribed from marketing emails successfully. You will still receive essential notifications about your applications and account.",
      });
    } catch (error) {
      console.error("Unsubscribe error:", error);
      return sendError(
        res,
        "Failed to process unsubscribe request",
        500,
        "UNSUBSCRIBE_ERROR",
      );
    }
  }),
);

// Get Email Queue Status (Admin only)
router.get(
  "/queue/status",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== "admin") {
      return sendError(res, "Admin access required", 403, "FORBIDDEN");
    }

    try {
      const queueStatus = EmailService.getInstance().getQueueStatus();

      sendSuccess(res, {
        queue: queueStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Email queue status error:", error);
      return sendError(res, "Failed to fetch queue status", 500, "QUEUE_ERROR");
    }
  }),
);

// Send Test Email (Admin only)
router.post(
  "/test",
  authenticateToken,
  body("to").isEmail().normalizeEmail(),
  body("type").isIn(["welcome_student", "welcome_employer", "notification"]),
  requireDatabase,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== "admin") {
      return sendError(res, "Admin access required", 403, "FORBIDDEN");
    }

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
        "Validation failed",
      );
    }

    const { to, type } = req.body;

    try {
      let template: { subject: string; html: string; text: string };
      const testUser = {
        email: to,
        firstName: "Test",
        lastName: "User",
        companyName: "Test Company",
      };

      switch (type) {
        case "welcome_student":
          template = {
            subject: "Welcome to ApprenticeApex",
            html: `<p>Welcome ${testUser.firstName}!</p>`,
            text: `Welcome ${testUser.firstName}!`,
          };
          break;
        case "welcome_employer":
          template = {
            subject: "Welcome to ApprenticeApex (Employer)",
            html: `<p>Welcome ${testUser.companyName}!</p>`,
            text: `Welcome ${testUser.companyName}!`,
          };
          break;
        case "notification":
          template = {
            subject: "Test Notification",
            html: `<p>This is a test email.</p><p><a href="${getEnvConfig().FRONTEND_URL}">Visit ApprenticeApex</a></p>`,
            text: `This is a test email. Visit: ${getEnvConfig().FRONTEND_URL}`,
          };
          break;
        default:
          return sendError(res, "Invalid email type", 400, "INVALID_TYPE");
      }

      await EmailService.getInstance().sendEmail({
        to,
        subject: `[TEST] ${template.subject}`,
        html: template.html,
        text: template.text,
      });

      console.log(`📧 Test email sent: ${type} to ${to}`);

      sendSuccess(res, {
        message: "Test email sent successfully",
        type,
        to,
      });
    } catch (error) {
      console.error("Test email error:", error);
      return sendError(
        res,
        "Failed to send test email",
        500,
        "TEST_EMAIL_ERROR",
      );
    }
  }),
);

export default router;

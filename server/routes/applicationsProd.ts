import express, { Response } from "express";
import { body, validationResult } from "express-validator";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import {
  sendSuccess,
  sendError,
  sendValidationError,
} from "../utils/apiResponse";
import { requireDatabase } from "../middleware/database-neon";

// Import production schemas
import { Application } from "../models/Application";
import { Apprenticeship } from "../models/Apprenticeship";
import { User } from "../models/User";
import EmailService from "../services/emailService";

const router = express.Router();

// Application creation validation
const applicationValidation = [
  body("apprenticeshipId")
    .isMongoId()
    .withMessage("Valid apprenticeship ID is required"),
  body("coverLetter")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Cover letter cannot exceed 2000 characters"),
  body("portfolioUrls")
    .optional()
    .isArray()
    .withMessage("Portfolio URLs must be an array"),
  body("portfolioUrls.*")
    .optional()
    .isURL()
    .withMessage("Invalid portfolio URL"),
  body("documents")
    .optional()
    .isArray()
    .withMessage("Documents must be an array"),
];

// Status update validation
const statusUpdateValidation = [
  body("status")
    .isIn([
      "draft",
      "submitted",
      "under_review",
      "shortlisted",
      "interview_scheduled",
      "interview_completed",
      "technical_assessment",
      "background_check",
      "offer_pending",
      "offer_made",
      "offer_accepted",
      "offer_declined",
      "hired",
      "rejected",
      "withdrawn",
    ])
    .withMessage("Invalid application status"),
  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),
  body("interviewDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid interview date"),
  body("interviewLocation")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Interview location too long"),
];

// Submit Application
router.post(
  "/submit",
  authenticateToken,
  applicationValidation,
  requireDatabase,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(
        res,
        errors.array().map((e: any) => ({
          field: e.path || e.param || "field",
          message: e.msg || "Invalid",
        })),
        "Validation failed",
      );
    }

    const { apprenticeshipId, coverLetter, portfolioUrls, documents } =
      req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, "Authentication required", 401, "UNAUTHORIZED");
    }

    try {
      // Verify the apprenticeship exists and is active
      const apprenticeship = await Apprenticeship.findById(apprenticeshipId);
      if (!apprenticeship) {
        return sendError(
          res,
          "Apprenticeship not found",
          404,
          "APPRENTICESHIP_NOT_FOUND",
        );
      }

      if (!(apprenticeship as any).isActive) {
        return sendError(
          res,
          "This apprenticeship is no longer accepting applications",
          400,
          "APPRENTICESHIP_INACTIVE",
        );
      }

      // Check if user already applied to this apprenticeship
      const existingApplication = await Application.findOne({
        student: userId,
        apprenticeship: apprenticeshipId,
      });

      if (existingApplication) {
        return sendError(
          res,
          "You have already applied to this apprenticeship",
          400,
          "DUPLICATE_APPLICATION",
        );
      }

      // Get user information for matching
      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      // Create new application
      const applicationData: any = {
        student: userId,
        apprenticeship: apprenticeshipId,
        // company handled via apprenticeship ref
        status: "pending" as const,
        applicationData: {
          coverLetter,
          portfolioUrl:
            Array.isArray(portfolioUrls) && portfolioUrls.length
              ? portfolioUrls[0]
              : undefined,
          additionalDocuments: Array.isArray(documents) ? documents : [],
        },
        submittedAt: new Date(),
        // availabilityNotes not stored in current schema
        // userLocation not stored in current schema
        // preferredStartDate not stored in current schema
      };

      const application = new Application(applicationData);

      const savedApplication = await application.save();

      // Update apprenticeship application count
      await Apprenticeship.findByIdAndUpdate(apprenticeshipId, {
        $inc: { applicationCount: 1 },
      });

      // Send application confirmation email to student
      try {
        await EmailService.getInstance().sendApplicationSubmitted(
          user,
          savedApplication,
          apprenticeship,
        );
        console.log(`📧 Application confirmation email sent to ${user.email}`);
      } catch (emailError) {
        console.warn(
          "⚠️  Failed to send application confirmation email:",
          emailError,
        );
      }

      // Notify employer of new application (if they have notifications enabled)
      try {
        const employer = await User.findById((apprenticeship as any).company);
        if (
          employer &&
          employer.emailPreferences?.applicationNotifications !== false
        ) {
          const template = {
            subject: "New Application Received",
            html: `<p>You have received a new application for ${(apprenticeship as any).title} from ${user.profile?.firstName || "a candidate"}.</p><p><a href="${process.env.FRONTEND_URL}/employer/applications/${savedApplication._id}">Review Application</a></p>`,
            text: `New application for ${(apprenticeship as any).title}. Review: ${process.env.FRONTEND_URL}/employer/applications/${savedApplication._id}`,
          };

          await EmailService.getInstance().sendEmail({
            to: employer.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          console.log(
            `📧 New application notification sent to employer ${employer.email}`,
          );
        }
      } catch (emailError) {
        console.warn(
          "⚠️  Failed to send employer notification email:",
          emailError,
        );
      }

      console.log(
        `✅ Application submitted successfully: ${savedApplication._id}`,
      );

      sendSuccess(
        res,
        {
          application: {
            id: savedApplication._id,
            status: savedApplication.status,
            submittedAt: savedApplication.submittedAt,
            matchScore: (savedApplication as any).matchScore || null,
            apprenticeship: {
              title: (apprenticeship as any).title,
              companyName: (apprenticeship as any).companyName,
              location: (apprenticeship as any).location,
            },
          },
        },
        undefined,
        201,
      );
    } catch (error: any) {
      console.error("Application submission error:", error);

      return sendError(
        res,
        "Failed to submit application",
        500,
        "APPLICATION_ERROR",
      );
    }
  }),
);

// Update Application Status (for employers)
router.patch(
  "/:applicationId/status",
  authenticateToken,
  statusUpdateValidation,
  requireDatabase,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(
        res,
        errors.array().map((e: any) => ({
          field: e.path || e.param || "field",
          message: e.msg || "Invalid",
        })),
        "Validation failed",
      );
    }

    const { applicationId } = req.params;
    const {
      status,
      interviewDate,
      interviewLocation,
      interviewType,
      rejectionReason,
    } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, "Authentication required", 401, "UNAUTHORIZED");
    }

    try {
      const application = await Application.findById(applicationId)
        .populate("apprenticeship")
        .populate("student");

      if (!application) {
        return sendError(
          res,
          "Application not found",
          404,
          "APPLICATION_NOT_FOUND",
        );
      }

      // Check if user has permission to update this application
      const apprenticeship = (application as any).apprenticeship as any;
      if (
        apprenticeship.company?.toString() !== userId &&
        req.user?.role !== "admin"
      ) {
        return sendError(
          res,
          "Not authorized to update this application",
          403,
          "FORBIDDEN",
        );
      }

      // Update application status
      const updateData: any = {
        status,
        lastUpdated: new Date(),
        // statusHistory is managed by schema middleware
      };

      // Handle interview scheduling
      if (status === "interview_scheduled" && interviewDate) {
        updateData.interview = {
          scheduledDate: new Date(interviewDate),
          location: interviewLocation,
          type: interviewType || "in_person",
          status: "scheduled",
        };
      }

      // Handle rejection
      if (status === "rejected" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      const updatedApplication = await Application.findByIdAndUpdate(
        applicationId,
        updateData,
        { new: true, runValidators: true },
      );

      // Send status update email to student
      try {
        const student = (application as any).student as any;
        await EmailService.getInstance().sendApplicationStatusUpdate(
          student,
          updatedApplication,
          apprenticeship,
        );
        console.log(`📧 Status update email sent to ${student.email}`);

        // Send interview reminder email if interview scheduled
        if (status === "interview_scheduled" && interviewDate) {
          // Schedule reminder email for 24 hours before interview
          const reminderTime =
            new Date(interviewDate).getTime() - 24 * 60 * 60 * 1000;
          if (reminderTime > Date.now()) {
            setTimeout(async () => {
              try {
                const template = {
                  subject: `Interview Reminder for ${apprenticeship.title}`,
                  html: `<p>Reminder: Your interview is scheduled for ${new Date(interviewDate).toLocaleString()}.</p>`,
                  text: `Interview reminder: ${new Date(interviewDate).toLocaleString()}`,
                };

                await EmailService.getInstance().sendEmail({
                  to: student.email,
                  subject: template.subject,
                  html: template.html,
                  text: template.text,
                });
                console.log(
                  `📧 Interview reminder email sent to ${student.email}`,
                );
              } catch (reminderError) {
                console.warn(
                  "⚠️  Failed to send interview reminder email:",
                  reminderError,
                );
              }
            }, reminderTime - Date.now());
          }
        }
      } catch (emailError) {
        console.warn("⚠️  Failed to send status update email:", emailError);
      }

      console.log(
        `✅ Application status updated: ${applicationId} -> ${status}`,
      );

      sendSuccess(res, {
        application: {
          id: updatedApplication!._id,
          status: updatedApplication!.status,
          lastUpdated: updatedApplication!.lastUpdated,
          interview: (updatedApplication as any)!.interview,
        },
      });
    } catch (error: any) {
      console.error("Application status update error:", error);

      if ((error as any)?.name === "ValidationError") {
        return sendError(
          res,
          "Update validation failed",
          400,
          "VALIDATION_ERROR",
        );
      }
      return sendError(
        res,
        "Failed to update application status",
        500,
        "UPDATE_ERROR",
      );
    }
  }),
);

// Get User Applications
router.get(
  "/my-applications",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, "Authentication required", 401, "UNAUTHORIZED");
    }

    try {
      const applications = await Application.find({ student: userId })
        .populate("apprenticeship", "title companyName location salary")
        .sort({ submittedAt: -1 })
        .limit(50);

      sendSuccess(res, {
        applications: applications.map((app: any) => ({
          id: app._id,
          // applicationId not used
          status: app.status,
          submittedAt: app.submittedAt,
          matchScore: (app as any).matchScore,
          lastUpdated: app.lastUpdated,
          apprenticeship: (app as any).apprenticeship,
          interview: (app as any).interview,
        })),
      });
    } catch (error) {
      console.error("Error fetching user applications:", error);
      return sendError(res, "Failed to fetch applications", 500, "FETCH_ERROR");
    }
  }),
);

// Get Application Details
router.get(
  "/:applicationId",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { applicationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, "Authentication required", 401, "UNAUTHORIZED");
    }

    try {
      const application = await Application.findById(applicationId)
        .populate("apprenticeship")
        .populate("student", "profile email");

      if (!application) {
        return sendError(
          res,
          "Application not found",
          404,
          "APPLICATION_NOT_FOUND",
        );
      }

      // Check if user has permission to view this application
      const apprenticeship = (application as any).apprenticeship as any;
      const isOwner =
        ((application as any).student as any)._id.toString() === userId;
      const isEmployer = apprenticeship.company?.toString() === userId;
      const isAdmin = req.user?.role === "admin";

      if (!isOwner && !isEmployer && !isAdmin) {
        return sendError(
          res,
          "Not authorized to view this application",
          403,
          "FORBIDDEN",
        );
      }

      sendSuccess(res, {
        application: {
          id: application._id,
          // applicationId not used
          status: application.status,
          submittedAt: application.submittedAt,
          lastUpdated: application.lastUpdated,
          matchScore: (application as any).matchScore,
          applicationData: (application as any).applicationData,
          statusHistory: application.statusHistory,
          interview: (application as any).interview,
          apprenticeship: (application as any).apprenticeship,
          student:
            isEmployer || isAdmin ? (application as any).student : undefined,
          matchingData: undefined as any,
        },
      });
    } catch (error) {
      console.error("Error fetching application details:", error);
      return sendError(
        res,
        "Failed to fetch application details",
        500,
        "FETCH_ERROR",
      );
    }
  }),
);

export default router;

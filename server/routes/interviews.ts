import express, { Response } from "express";
import { body, validationResult } from "express-validator";
import {
  authenticateToken,
  AuthenticatedRequest,
  requireRole,
} from "../middleware/auth";
import { asyncHandler, CustomError } from "../middleware/errorHandler";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Mock data for development
const mockInterviews: any[] = [
  {
    _id: "int_1",
    applicationId: "app_1",
    studentId: "student1",
    companyId: "company1",
    jobTitle: "Software Developer Apprentice",
    scheduledDateTime: new Date("2024-01-25T14:00:00Z"),
    duration: 45,
    type: "video",
    status: "scheduled",
    videoCall: {
      platform: "daily",
      roomId: "room_mock_1",
      roomUrl: "https://apprenticeapex.daily.co/room_mock_1",
    },
    notes: {},
    reminders: [],
    rescheduleHistory: [],
  },
  {
    _id: "int_2",
    applicationId: "app_2",
    studentId: "student2",
    companyId: "company1",
    jobTitle: "Digital Marketing Apprentice",
    scheduledDateTime: new Date("2024-01-26T10:30:00Z"),
    duration: 30,
    type: "video",
    status: "scheduled",
    videoCall: {
      platform: "daily",
      roomId: "room_mock_2",
      roomUrl: "https://apprenticeapex.daily.co/room_mock_2",
    },
    notes: {},
    reminders: [],
    rescheduleHistory: [],
  },
];

// Get all interviews for a user
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, role } = req.user!;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    let filteredInterviews = mockInterviews;

    // Filter by user role
    if (role === "student") {
      filteredInterviews = mockInterviews.filter(
        (interview) => interview.studentId === userId,
      );
    } else if (role === "company") {
      filteredInterviews = mockInterviews.filter(
        (interview) => interview.companyId === userId,
      );
    }

    // Filter by status if provided
    if (status) {
      filteredInterviews = filteredInterviews.filter(
        (interview) => interview.status === status,
      );
    }

    const total = filteredInterviews.length;
    const interviews = filteredInterviews.slice(
      (page - 1) * limit,
      page * limit,
    );

    res.json({
      interviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  }),
);

// Get specific interview
router.get(
  "/:interviewId",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { interviewId } = req.params;
    const { userId, role } = req.user!;

    const interview = mockInterviews.find((int) => int._id === interviewId);

    if (!interview) {
      throw new CustomError("Interview not found", 404);
    }

    // Check if user has access to this interview
    const hasAccess =
      (role === "student" && interview.studentId === userId) ||
      (role === "company" && interview.companyId === userId);

    if (!hasAccess) {
      throw new CustomError("Access denied", 403);
    }

    res.json({ interview });
  }),
);

// Schedule new interview
router.post(
  "/",
  authenticateToken,
  requireRole(["company"]),
  [
    body("applicationId").notEmpty(),
    body("studentId").notEmpty(),
    body("jobTitle").notEmpty(),
    body("scheduledDateTime").isISO8601(),
    body("duration").isInt({ min: 15, max: 180 }),
    body("type").isIn(["video", "phone", "in-person"]),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError("Validation failed", 400);
    }

    const { userId: companyId } = req.user!;
    const {
      applicationId,
      studentId,
      jobTitle,
      scheduledDateTime,
      duration,
      type,
      location,
      notes,
    } = req.body;

    const interviewId = "int_" + uuidv4();
    let videoCall = undefined;

    // Create video call room if type is video
    if (type === "video") {
      const roomId = "room_" + uuidv4();
      videoCall = {
        platform: "daily" as const,
        roomId,
        roomUrl: `https://apprenticeapex.daily.co/${roomId}`,
        // In production, generate actual access tokens
        accessToken: "token_" + uuidv4(),
      };
    }

    const newInterview = {
      _id: interviewId,
      applicationId,
      studentId,
      companyId,
      jobTitle,
      scheduledDateTime: new Date(scheduledDateTime),
      duration,
      type,
      status: "scheduled" as const,
      videoCall,
      location,
      notes: {
        companyNotes: notes?.companyNotes || "",
      },
      reminders: [],
      rescheduleHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In production, save to database and send notifications
    mockInterviews.push(newInterview);

    res.status(201).json({
      interview: newInterview,
      message: "Interview scheduled successfully",
    });
  }),
);

// Update interview
router.put(
  "/:interviewId",
  authenticateToken,
  [
    body("scheduledDateTime").optional().isISO8601(),
    body("duration").optional().isInt({ min: 15, max: 180 }),
    body("status")
      .optional()
      .isIn(["scheduled", "completed", "cancelled", "rescheduled", "no-show"]),
    body("notes").optional().isObject(),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError("Validation failed", 400);
    }

    const { interviewId } = req.params;
    const { userId, role } = req.user!;
    const updateData = req.body;

    const interviewIndex = mockInterviews.findIndex(
      (int) => int._id === interviewId,
    );

    if (interviewIndex === -1) {
      throw new CustomError("Interview not found", 404);
    }

    const interview = mockInterviews[interviewIndex];

    // Check permissions
    const hasAccess =
      (role === "student" && interview.studentId === userId) ||
      (role === "company" && interview.companyId === userId);

    if (!hasAccess) {
      throw new CustomError("Access denied", 403);
    }

    // Handle rescheduling
    if (
      updateData.scheduledDateTime &&
      updateData.scheduledDateTime !== interview.scheduledDateTime.toISOString()
    ) {
      const rescheduleEntry = {
        previousDateTime: interview.scheduledDateTime,
        reason: updateData.rescheduleReason || "Time change requested",
        requestedBy: role as "student" | "company",
        requestedAt: new Date(),
      };

      interview.rescheduleHistory.push(rescheduleEntry);
      interview.status = "rescheduled";
    }

    // Update interview
    Object.assign(interview, updateData, { updatedAt: new Date() });
    mockInterviews[interviewIndex] = interview;

    res.json({
      interview,
      message: "Interview updated successfully",
    });
  }),
);

// Delete/Cancel interview
router.delete(
  "/:interviewId",
  authenticateToken,
  requireRole(["company"]),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { interviewId } = req.params;
    const { userId: companyId } = req.user!;

    const interviewIndex = mockInterviews.findIndex(
      (int) => int._id === interviewId,
    );

    if (interviewIndex === -1) {
      throw new CustomError("Interview not found", 404);
    }

    const interview = mockInterviews[interviewIndex];

    if (interview.companyId !== companyId) {
      throw new CustomError("Access denied", 403);
    }

    // Mark as cancelled instead of deleting
    interview.status = "cancelled";
    interview.updatedAt = new Date();

    res.json({
      message: "Interview cancelled successfully",
    });
  }),
);

// Get video call access
router.get(
  "/:interviewId/video-access",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { interviewId } = req.params;
    const { userId, role } = req.user!;

    const interview = mockInterviews.find((int) => int._id === interviewId);

    if (!interview) {
      throw new CustomError("Interview not found", 404);
    }

    // Check access
    const hasAccess =
      (role === "student" && interview.studentId === userId) ||
      (role === "company" && interview.companyId === userId);

    if (!hasAccess) {
      throw new CustomError("Access denied", 403);
    }

    if (interview.type !== "video" || !interview.videoCall) {
      throw new CustomError("This interview is not a video call", 400);
    }

    // Check if interview is starting soon (within 30 minutes)
    const now = new Date();
    const interviewTime = new Date(interview.scheduledDateTime);
    const timeDiff = interviewTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 30) {
      throw new CustomError("Video call access not yet available", 403);
    }

    if (minutesDiff < -60) {
      throw new CustomError("Video call access has expired", 403);
    }

    // In production, generate fresh access token
    const accessToken = "token_" + uuidv4() + "_" + Date.now();

    res.json({
      roomUrl: interview.videoCall.roomUrl,
      accessToken,
      roomId: interview.videoCall.roomId,
      platform: interview.videoCall.platform,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    });
  }),
);

// Submit interview feedback
router.post(
  "/:interviewId/feedback",
  authenticateToken,
  [
    body("rating").isInt({ min: 1, max: 5 }),
    body("feedback").optional().isLength({ max: 1000 }),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError("Validation failed", 400);
    }

    const { interviewId } = req.params;
    const { userId, role } = req.user!;
    const { rating, feedback } = req.body;

    const interview = mockInterviews.find((int) => int._id === interviewId);

    if (!interview) {
      throw new CustomError("Interview not found", 404);
    }

    // Check access
    const hasAccess =
      (role === "student" && interview.studentId === userId) ||
      (role === "company" && interview.companyId === userId);

    if (!hasAccess) {
      throw new CustomError("Access denied", 403);
    }

    if (interview.status !== "completed") {
      throw new CustomError(
        "Can only provide feedback for completed interviews",
        400,
      );
    }

    // Update feedback
    if (!interview.feedback) {
      interview.feedback = {};
    }

    if (role === "student") {
      interview.feedback.studentRating = rating;
      interview.feedback.studentFeedback = feedback;
    } else {
      interview.feedback.companyRating = rating;
      interview.feedback.companyFeedback = feedback;
    }

    interview.updatedAt = new Date();

    res.json({
      message: "Feedback submitted successfully",
      feedback: interview.feedback,
    });
  }),
);

// Get interview statistics
router.get(
  "/stats/overview",
  authenticateToken,
  requireRole(["company"]),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId: companyId } = req.user!;

    const companyInterviews = mockInterviews.filter(
      (interview) => interview.companyId === companyId,
    );

    const stats = {
      total: companyInterviews.length,
      scheduled: companyInterviews.filter((int) => int.status === "scheduled")
        .length,
      completed: companyInterviews.filter((int) => int.status === "completed")
        .length,
      cancelled: companyInterviews.filter((int) => int.status === "cancelled")
        .length,
      noShow: companyInterviews.filter((int) => int.status === "no-show")
        .length,
      averageRating: 4.2, // Mock average
      thisWeek: companyInterviews.filter(
        (int) =>
          new Date(int.scheduledDateTime) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ).length,
      thisMonth: companyInterviews.filter(
        (int) =>
          new Date(int.scheduledDateTime) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ).length,
    };

    res.json({ stats });
  }),
);

// Send interview reminder
router.post(
  "/:interviewId/reminder",
  authenticateToken,
  requireRole(["company"]),
  [
    body("type").isIn(["email", "sms", "push"]),
    body("recipient").isIn(["student", "company", "both"]),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError("Validation failed", 400);
    }

    const { interviewId } = req.params;
    const { type, recipient } = req.body;
    const { userId: companyId } = req.user!;

    const interview = mockInterviews.find((int) => int._id === interviewId);

    if (!interview) {
      throw new CustomError("Interview not found", 404);
    }

    if (interview.companyId !== companyId) {
      throw new CustomError("Access denied", 403);
    }

    // Add reminder to history
    const reminder = {
      sentAt: new Date(),
      type,
      recipient,
    };

    interview.reminders.push(reminder);

    // In production, send actual notifications
    console.log(
      `Sending ${type} reminder for interview ${interviewId} to ${recipient}`,
    );

    res.json({
      message: "Reminder sent successfully",
      reminder,
    });
  }),
);

export default router;

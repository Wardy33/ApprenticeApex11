import express from "express";
import { body, validationResult } from "express-validator";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler, CustomError } from "../middleware/errorHandler";
// Mock data removed - now using real MongoDB data

const router = express.Router();

// Get current user profile
router.get(
  "/profile",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const users = userRole === "student" ? mockStudents : mockCompanies;
    const user = users.find((u) => u._id === userId);

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  }),
);

// Update user profile
router.put(
  "/profile",
  [
    // Student validation
    body("firstName").optional().trim().isLength({ min: 1 }),
    body("lastName").optional().trim().isLength({ min: 1 }),
    body("bio").optional().trim().isLength({ max: 500 }),
    body("skills").optional().isArray(),
    body("location.city").optional().trim().isLength({ min: 1 }),
    // Company validation
    body("companyName").optional().trim().isLength({ min: 1 }),
    body("industry").optional().isString(),
    body("description").optional().trim().isLength({ max: 1000 }),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError("Validation failed", 400);
    }

    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const users = userRole === "student" ? mockStudents : mockCompanies;
    const userIndex = users.findIndex((u) => u._id === userId);

    if (userIndex === -1) {
      throw new CustomError("User not found", 404);
    }

    // Update profile
    users[userIndex].profile = {
      ...users[userIndex].profile,
      ...req.body,
    };

    res.json({
      message: "Profile updated successfully",
      profile: users[userIndex].profile,
    });
  }),
);

// Upload profile video (student only)
router.post(
  "/profile/video",
  [body("videoUrl").isURL(), body("thumbnailUrl").optional().isURL()],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.user!.role !== "student") {
      throw new CustomError("Only students can upload video profiles", 403);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError("Invalid video data", 400);
    }

    const { videoUrl, thumbnailUrl, cloudinaryId } = req.body;
    const userId = req.user!.userId;

    const userIndex = mockStudents.findIndex((u) => u._id === userId);
    if (userIndex === -1) {
      throw new CustomError("Student not found", 404);
    }

    // Update video profile
    (mockStudents[userIndex].profile as any).videoProfile = {
      url: videoUrl,
      cloudinaryId: cloudinaryId || `video_${Date.now()}`,
      thumbnail: thumbnailUrl || videoUrl.replace(".mp4", "_thumb.jpg"),
    };

    res.json({
      message: "Video profile uploaded successfully",
      videoProfile: (mockStudents[userIndex].profile as any).videoProfile,
    });
  }),
);

// Generate AI CV (student only)
router.post(
  "/profile/generate-cv",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.user!.role !== "student") {
      throw new CustomError("Only students can generate CVs", 403);
    }

    const userId = req.user!.userId;
    const student = mockStudents.find((u) => u._id === userId);

    if (!student) {
      throw new CustomError("Student not found", 404);
    }

    // Mock AI CV generation using OpenAI
    const cvData = {
      personalInfo: {
        name: `${(student.profile as any).firstName} ${(student.profile as any).lastName}`,
        email: student.email,
        location: (student.profile as any).location.city,
        bio: (student.profile as any).bio,
      },
      skills: (student.profile as any).skills,
      education: (student.profile as any).education,
      experience: (student.profile as any).experience,
      generatedSummary:
        "Motivated and passionate individual with strong technical skills and a drive for continuous learning. Demonstrated ability to work collaboratively in team environments while maintaining attention to detail and problem-solving capabilities.",
      suggestedImprovements: [
        "Consider adding more specific examples of projects",
        "Quantify achievements where possible",
        "Include relevant certifications or courses",
      ],
    };

    // Mock PDF URL
    const cvUrl = `https://mock-storage.com/cvs/${userId}_${Date.now()}.pdf`;

    // Update user profile with CV URL
    (student.profile as any).cvUrl = cvUrl;

    res.json({
      message: "CV generated successfully",
      cvData,
      cvUrl,
      downloadReady: true,
    });
  }),
);

// Get user statistics
router.get(
  "/stats",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (userRole === "student") {
      // Mock student statistics
      const stats = {
        totalSwipes: 45,
        rightSwipes: 18,
        leftSwipes: 27,
        matches: 12,
        activeConversations: 5,
        profileViews: 34,
        cvDownloads: 8,
        interviewsScheduled: 3,
        swipeAccuracy: Math.round((18 / 45) * 100),
        responseRate: 67,
      };

      res.json({ stats });
    } else {
      // Mock company statistics
      const stats = {
        activeListings: 3,
        totalApplications: 127,
        newApplicationsThisWeek: 23,
        interviewsScheduled: 8,
        hiredCandidates: 2,
        averageTimeToHire: 21, // days
        topPerformingListing: "Software Developer Apprentice",
        conversionRate: 37, // swipe to application rate
      };

      res.json({ stats });
    }
  }),
);

// Delete user account (GDPR compliance)
router.delete(
  "/account",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const users = userRole === "student" ? mockStudents : mockCompanies;
    const userIndex = users.findIndex((u) => u._id === userId);

    if (userIndex === -1) {
      throw new CustomError("User not found", 404);
    }

    // In real app, this would:
    // 1. Delete all user data
    // 2. Remove from conversations
    // 3. Anonymize applications
    // 4. Delete uploaded files from Cloudinary
    // 5. Send confirmation email

    users.splice(userIndex, 1);

    res.json({
      message:
        "Account deleted successfully. All personal data has been removed.",
    });
  }),
);

// Export user data (GDPR compliance)
router.get(
  "/export",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const users = userRole === "student" ? mockStudents : mockCompanies;
    const user = users.find((u) => u._id === userId);

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Mock exported data
    const exportedData = {
      personalData: {
        email: user.email,
        role: user.role,
        profile: user.profile,
        accountCreated: "2024-01-01T00:00:00Z",
      },
      activityData: {
        swipes: [], // Would contain swipe history
        applications: [], // Would contain application history
        messages: [], // Would contain message history
      },
      privacySettings: {
        dataProcessingConsent: true,
        marketingConsent: false,
        lastUpdated: "2024-01-01T00:00:00Z",
      },
    };

    res.json({
      message: "Data export ready",
      data: exportedData,
      exportedAt: new Date().toISOString(),
    });
  }),
);

export default router;

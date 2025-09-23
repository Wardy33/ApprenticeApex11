import express from "express";
import multer from "multer";
import { body, validationResult } from "express-validator";
import { AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler, CustomError } from "../middleware/errorHandler";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

// Upload profile video (students only)
router.post(
  "/video-profile",
  upload.single("video"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.user!.role !== "student") {
      throw new CustomError("Only students can upload video profiles", 403);
    }

    if (!req.file) {
      throw new CustomError("No video file provided", 400);
    }

    const file = req.file;

    // Validate video file
    if (!file.mimetype.startsWith("video/")) {
      throw new CustomError("File must be a video", 400);
    }

    if (file.size > 30 * 1024 * 1024) {
      // 30MB limit for videos
      throw new CustomError("Video file too large (max 30MB)", 400);
    }

    // Mock Cloudinary upload
    const mockCloudinaryResponse = {
      public_id: `video_profiles/${req.user!.userId}_${Date.now()}`,
      secure_url: `https://res.cloudinary.com/mock/video/upload/v1/${req.user!.userId}_profile.mp4`,
      thumbnail_url: `https://res.cloudinary.com/mock/video/upload/v1/${req.user!.userId}_profile.jpg`,
      duration: 28.5, // seconds
      width: 1080,
      height: 1920,
      format: "mp4",
      resource_type: "video",
      bytes: file.size,
    };

    // In real app:
    // 1. Upload to Cloudinary with video compression
    // 2. Generate thumbnail
    // 3. Update user profile in database
    // 4. Implement GDPR compliance for video data

    res.json({
      message: "Video profile uploaded successfully",
      video: {
        url: mockCloudinaryResponse.secure_url,
        thumbnailUrl: mockCloudinaryResponse.thumbnail_url,
        cloudinaryId: mockCloudinaryResponse.public_id,
        duration: mockCloudinaryResponse.duration,
        size: file.size,
      },
      uploadedAt: new Date().toISOString(),
    });
  }),
);

// Upload profile picture
router.post(
  "/profile-picture",
  upload.single("image"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.file) {
      throw new CustomError("No image file provided", 400);
    }

    const file = req.file;

    // Validate image file
    if (!file.mimetype.startsWith("image/")) {
      throw new CustomError("File must be an image", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit for images
      throw new CustomError("Image file too large (max 5MB)", 400);
    }

    // Mock Cloudinary upload
    const mockCloudinaryResponse = {
      public_id: `profile_pictures/${req.user!.userId}_${Date.now()}`,
      secure_url: `https://res.cloudinary.com/mock/image/upload/v1/${req.user!.userId}_profile.jpg`,
      width: 400,
      height: 400,
      format: "jpg",
      resource_type: "image",
      bytes: file.size,
    };

    res.json({
      message: "Profile picture uploaded successfully",
      image: {
        url: mockCloudinaryResponse.secure_url,
        cloudinaryId: mockCloudinaryResponse.public_id,
        size: file.size,
      },
      uploadedAt: new Date().toISOString(),
    });
  }),
);

// Upload CV/Resume file
router.post(
  "/cv",
  upload.single("cv"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.user!.role !== "student") {
      throw new CustomError("Only students can upload CVs", 403);
    }

    if (!req.file) {
      throw new CustomError("No CV file provided", 400);
    }

    const file = req.file;

    // Validate CV file
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new CustomError("CV must be a PDF, DOC, or DOCX file", 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit for CVs
      throw new CustomError("CV file too large (max 10MB)", 400);
    }

    // Mock file upload to S3 or similar
    const mockUploadResponse = {
      key: `cvs/${req.user!.userId}/${Date.now()}_${file.originalname}`,
      url: `https://mock-bucket.s3.amazonaws.com/cvs/${req.user!.userId}/${Date.now()}_${file.originalname}`,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };

    res.json({
      message: "CV uploaded successfully",
      cv: {
        url: mockUploadResponse.url,
        key: mockUploadResponse.key,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
      uploadedAt: new Date().toISOString(),
    });
  }),
);

// Upload company logo
router.post(
  "/company-logo",
  upload.single("logo"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.user!.role !== "company") {
      throw new CustomError("Only companies can upload logos", 403);
    }

    if (!req.file) {
      throw new CustomError("No logo file provided", 400);
    }

    const file = req.file;

    // Validate logo file
    if (!file.mimetype.startsWith("image/")) {
      throw new CustomError("Logo must be an image", 400);
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit for logos
      throw new CustomError("Logo file too large (max 2MB)", 400);
    }

    // Mock Cloudinary upload
    const mockCloudinaryResponse = {
      public_id: `company_logos/${req.user!.userId}_${Date.now()}`,
      secure_url: `https://res.cloudinary.com/mock/image/upload/v1/${req.user!.userId}_logo.png`,
      width: 200,
      height: 200,
      format: "png",
      resource_type: "image",
      bytes: file.size,
    };

    res.json({
      message: "Company logo uploaded successfully",
      logo: {
        url: mockCloudinaryResponse.secure_url,
        cloudinaryId: mockCloudinaryResponse.public_id,
        size: file.size,
      },
      uploadedAt: new Date().toISOString(),
    });
  }),
);

// Upload message attachment
router.post(
  "/message-attachment",
  upload.single("attachment"),
  [body("conversationId").isString().isLength({ min: 1 })],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError("Conversation ID required", 400);
    }

    if (!req.file) {
      throw new CustomError("No attachment file provided", 400);
    }

    const file = req.file;
    const { conversationId } = req.body;

    if (file.size > 25 * 1024 * 1024) {
      // 25MB limit for attachments
      throw new CustomError("Attachment file too large (max 25MB)", 400);
    }

    // Determine file type and appropriate storage
    let uploadResponse;
    if (file.mimetype.startsWith("image/")) {
      uploadResponse = {
        type: "image",
        url: `https://res.cloudinary.com/mock/image/upload/v1/attachments/${conversationId}_${Date.now()}.jpg`,
      };
    } else if (file.mimetype.startsWith("video/")) {
      uploadResponse = {
        type: "video",
        url: `https://res.cloudinary.com/mock/video/upload/v1/attachments/${conversationId}_${Date.now()}.mp4`,
      };
    } else {
      uploadResponse = {
        type: "file",
        url: `https://mock-bucket.s3.amazonaws.com/attachments/${conversationId}/${Date.now()}_${file.originalname}`,
      };
    }

    res.json({
      message: "Attachment uploaded successfully",
      attachment: {
        ...uploadResponse,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
      uploadedAt: new Date().toISOString(),
    });
  }),
);

// Delete uploaded file (GDPR compliance)
router.delete(
  "/files/:fileId",
  [body("reason").optional().isString()],
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fileId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;

    // In real app:
    // 1. Verify user owns the file
    // 2. Delete from Cloudinary/S3
    // 3. Update database records
    // 4. Log deletion for audit trail

    console.log(
      `Deleting file ${fileId} for user ${userId}. Reason: ${reason || "User request"}`,
    );

    res.json({
      message: "File deleted successfully",
      fileId,
      deletedAt: new Date().toISOString(),
      reason: reason || "User request",
    });
  }),
);

// Get upload statistics
router.get(
  "/stats",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Mock upload statistics
    const stats = {
      userId,
      totalUploads: userRole === "student" ? 5 : 3,
      totalSize: userRole === "student" ? 45 * 1024 * 1024 : 2 * 1024 * 1024, // bytes
      fileTypes:
        userRole === "student"
          ? {
              videos: 1,
              images: 2,
              documents: 2,
            }
          : {
              images: 2,
              documents: 1,
            },
      storageQuota: {
        used: userRole === "student" ? 45 * 1024 * 1024 : 2 * 1024 * 1024,
        limit: 100 * 1024 * 1024, // 100MB
        percentage: userRole === "student" ? 45 : 2,
      },
      recentUploads: [
        {
          filename:
            userRole === "student" ? "profile_video.mp4" : "company_logo.png",
          size: userRole === "student" ? 28 * 1024 * 1024 : 1.2 * 1024 * 1024,
          uploadedAt: new Date().toISOString(),
          type: userRole === "student" ? "video" : "image",
        },
      ],
    };

    res.json({
      stats,
      generatedAt: new Date().toISOString(),
    });
  }),
);

export default router;

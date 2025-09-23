import express from "express";
import mongoose from "mongoose";
import { Apprenticeship } from "../models/Apprenticeship";
import { Application } from "../models/Application";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// GET /api/applications - Get applications for current user
router.get("/", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { page = 1, limit = 10, status, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query: any = {};

    if (userRole === "student") {
      query.student = userId;
    } else if (userRole === "company") {
      // Get applications for company's apprenticeships
      const companyApprenticeships = await Apprenticeship.find({
        company: userId,
      }).select("_id");
      const apprenticeshipIds = companyApprenticeships.map((app) => app._id);
      query.apprenticeship = { $in: apprenticeshipIds };
    } else {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    if (status) {
      query.status = status;
    }

    let applications = Application.find(query)
      .populate("student", "profile.firstName profile.lastName email")
      .populate("apprenticeship", "title company location salary")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (search) {
      applications = applications.populate({
        path: "apprenticeship",
        match: { title: { $regex: search, $options: "i" } },
      });
    }

    const results = await applications.exec();
    const totalApplications = await Application.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications: results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalApplications / parseInt(limit)),
          totalItems: totalApplications,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch applications",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/applications - Submit new application
router.post("/", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== "student") {
      return res.status(403).json({
        success: false,
        error: "Only students can submit applications",
      });
    }

    const {
      apprenticeshipId,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      customAnswers,
    } = req.body;

    // Validate required fields
    if (!apprenticeshipId || !coverLetter) {
      return res.status(400).json({
        success: false,
        error: "Apprenticeship ID and cover letter are required",
      });
    }

    // Check if apprenticeship exists and is active
    const apprenticeship = await Apprenticeship.findById(apprenticeshipId);
    if (!apprenticeship || !apprenticeship.isActive) {
      return res.status(404).json({
        success: false,
        error: "Apprenticeship not found or not active",
      });
    }

    // Check if application deadline has passed
    if (new Date() > apprenticeship.applicationDeadline) {
      return res.status(400).json({
        success: false,
        error: "Application deadline has passed",
      });
    }

    // Check if student has already applied
    const existingApplication = await Application.findOne({
      student: userId,
      apprenticeship: apprenticeshipId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: "You have already applied to this apprenticeship",
      });
    }

    // Create new application
    const newApplication = new Application({
      student: userId,
      apprenticeship: apprenticeshipId,
      status: "pending",
      applicationData: {
        coverLetter,
        resumeUrl,
        portfolioUrl,
        customAnswers: customAnswers || [],
      },
      submittedAt: new Date(),
    });

    await newApplication.save();

    // Update apprenticeship application count
    await Apprenticeship.findByIdAndUpdate(apprenticeshipId, {
      $inc: { applicationCount: 1 },
    });

    // Populate the response
    const populatedApplication = await Application.findById(newApplication._id)
      .populate("student", "profile.firstName profile.lastName email")
      .populate("apprenticeship", "title company location salary");

    res.status(201).json({
      success: true,
      data: populatedApplication,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit application",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/applications/:id - Get specific application
router.get("/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid application ID",
      });
    }

    const application = await Application.findById(applicationId)
      .populate(
        "student",
        "profile.firstName profile.lastName email profile.phone profile.skills",
      )
      .populate(
        "apprenticeship",
        "title company location salary requirements description",
      );

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    // Check access permissions
    const canAccess =
      (userRole === "student" &&
        (application.student as any)._id.toString() === userId) ||
      (userRole === "company" &&
        (application.apprenticeship as any).company.toString() === userId) ||
      userRole === "admin";

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: "Access denied to this application",
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch application",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// PUT /api/applications/:id/status - Update application status (company only)
router.put("/:id/status", authenticateToken, async (req: any, res: any) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status, reason, interviewDetails } = req.body;

    if (userRole !== "company" && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only companies can update application status",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid application ID",
      });
    }

    const validStatuses = [
      "pending",
      "reviewing",
      "interviewed",
      "accepted",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const application = await Application.findById(applicationId).populate(
      "apprenticeship",
      "company",
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    // Check if company owns the apprenticeship
    if (
      userRole === "company" &&
      (application.apprenticeship as any).company.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        error: "You can only update applications for your apprenticeships",
      });
    }

    // Update application status
    const updateData: any = {
      status,
      lastUpdated: new Date(),
    };

    // Add interview details if status is 'interviewed'
    if (status === "interviewed" && interviewDetails) {
      updateData.interview = {
        scheduledDate: interviewDetails.scheduledDate,
        type: interviewDetails.type,
        location: interviewDetails.location,
        meetingLink: interviewDetails.meetingLink,
        notes: interviewDetails.notes,
        completed: false,
      };
    }

    // Add status to history
    updateData.$push = {
      statusHistory: {
        status,
        changedAt: new Date(),
        changedBy: userId,
        reason,
      },
    };

    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      updateData,
      { new: true, runValidators: true },
    )
      .populate("student", "profile.firstName profile.lastName email")
      .populate("apprenticeship", "title company");

    res.json({
      success: true,
      data: updatedApplication,
      message: `Application status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update application status",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// PUT /api/applications/:id/withdraw - Withdraw application (student only)
router.put("/:id/withdraw", authenticateToken, async (req: any, res: any) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { reason } = req.body;

    if (userRole !== "student") {
      return res.status(403).json({
        success: false,
        error: "Only students can withdraw applications",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid application ID",
      });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    // Check if student owns the application
    if (application.student.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only withdraw your own applications",
      });
    }

    // Check if application can be withdrawn
    if (application.status === "withdrawn") {
      return res.status(400).json({
        success: false,
        error: "Application is already withdrawn",
      });
    }

    if (application.status === "accepted") {
      return res.status(400).json({
        success: false,
        error: "Cannot withdraw an accepted application",
      });
    }

    // Update application
    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      {
        status: "withdrawn",
        withdrawalReason: reason,
        lastUpdated: new Date(),
        $push: {
          statusHistory: {
            status: "withdrawn",
            changedAt: new Date(),
            changedBy: userId,
            reason,
          },
        },
      },
      { new: true, runValidators: true },
    ).populate("apprenticeship", "title company");

    // Decrease apprenticeship application count
    await Apprenticeship.findByIdAndUpdate(application.apprenticeship, {
      $inc: { applicationCount: -1 },
    });

    res.json({
      success: true,
      data: updatedApplication,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    console.error("Error withdrawing application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to withdraw application",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/applications/stats - Get application statistics
router.get("/stats", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let stats: any = {};

    if (userRole === "student") {
      const studentApplications = await Application.aggregate([
        { $match: { student: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      stats = {
        total: await Application.countDocuments({ student: userId }),
        byStatus: studentApplications.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentApplications: await Application.countDocuments({
          student: userId,
          submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
      };
    } else if (userRole === "company") {
      const companyApprenticeships = await Apprenticeship.find({
        company: userId,
      }).select("_id");
      const apprenticeshipIds = companyApprenticeships.map((app) => app._id);

      const companyApplications = await Application.aggregate([
        { $match: { apprenticeship: { $in: apprenticeshipIds } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      stats = {
        total: await Application.countDocuments({
          apprenticeship: { $in: apprenticeshipIds },
        }),
        byStatus: companyApplications.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentApplications: await Application.countDocuments({
          apprenticeship: { $in: apprenticeshipIds },
          submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
      };
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching application stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch application statistics",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

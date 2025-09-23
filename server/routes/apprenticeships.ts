import express from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Apprenticeship } from "../models/Apprenticeship";
import { Application } from "../models/Application";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// GET /api/apprenticeships/public - Get public job listings for SEO (no auth required)
router.get("/public", async (req: any, res: any) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      location,
      salaryMin,
      salaryMax,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query: any = {
      isActive: true,
      applicationDeadline: { $gte: new Date() },
    };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "requirements.skills": { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Filter by category (industry)
    if (category && category !== "all") {
      query.industry = category;
    }

    // Filter by location
    if (location && location !== "all") {
      query["location.city"] = { $regex: location, $options: "i" };
    }

    // Salary range filter
    if (salaryMin || salaryMax) {
      if (salaryMin) query["salary.min"] = { $gte: parseInt(salaryMin) };
      if (salaryMax) query["salary.max"] = { $lte: parseInt(salaryMax) };
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    const apprenticeships = await Apprenticeship.find(query)
      .select({
        // Include limited public information only
        title: 1,
        description: 1,
        industry: 1,
        "location.city": 1,
        "location.state": 1,
        "salary.min": 1,
        "salary.max": 1,
        "salary.currency": 1,
        "salary.type": 1,
        "requirements.education": 1,
        "requirements.experience": 1,
        "requirements.skills": 1,
        applicationDeadline: 1,
        isRemote: 1,
        employmentType: 1,
        createdAt: 1,
        viewCount: 1,
        applicationCount: 1,
        // Exclude company information for privacy
        company: 0,
        companyName: 0,
      })
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Generate SEO-friendly URLs for each job
    const apprenticeshipsWithUrls = apprenticeships.map((job) => ({
      ...job,
      seoUrl: `/apprenticeships/${job.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")}-${job.location.city
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")}-${job._id}`,
      // Limit description for preview
      shortDescription:
        job.description?.substring(0, 200) +
        (job.description?.length > 200 ? "..." : ""),
      // Get key requirements (first 4)
      keyRequirements: job.requirements?.skills?.slice(0, 4) || [],
    }));

    const totalCount = await Apprenticeship.countDocuments(query);

    // Get filter options for public use
    const availableCategories = await Apprenticeship.distinct("industry", {
      isActive: true,
      applicationDeadline: { $gte: new Date() },
    });
    const availableLocations = await Apprenticeship.distinct("location.city", {
      isActive: true,
      applicationDeadline: { $gte: new Date() },
    });

    res.json({
      success: true,
      data: {
        jobs: apprenticeshipsWithUrls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNext: skip + apprenticeships.length < totalCount,
          hasPrev: parseInt(page) > 1,
        },
        filters: {
          categories: availableCategories.sort(),
          locations: availableLocations.sort(),
        },
      },
      message: `Found ${totalCount} apprenticeship opportunities`,
    });
  } catch (error) {
    console.error("Error fetching public job listings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch job listings",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/apprenticeships/public/:id - Get public job details by ID
router.get("/public/:id", async (req: any, res: any) => {
  try {
    const jobId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid job ID",
      });
    }

    const job = await Apprenticeship.findById(jobId)
      .select({
        // Include limited public information only
        title: 1,
        description: 1,
        industry: 1,
        "location.city": 1,
        "location.state": 1,
        "location.address": 1,
        "salary.min": 1,
        "salary.max": 1,
        "salary.currency": 1,
        "salary.type": 1,
        "requirements.education": 1,
        "requirements.experience": 1,
        "requirements.skills": 1,
        "requirements.certifications": 1,
        benefits: 1,
        "duration.months": 1,
        "duration.startDate": 1,
        applicationDeadline: 1,
        isRemote: 1,
        employmentType: 1,
        createdAt: 1,
        viewCount: 1,
        applicationCount: 1,
        // Exclude company information for privacy
        company: 0,
        companyName: 0,
      })
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    // Check if job is still active and accepting applications
    if (!job.isActive || new Date(job.applicationDeadline) < new Date()) {
      return res.status(410).json({
        success: false,
        error: "This job listing is no longer accepting applications",
      });
    }

    // Increment view count
    await Apprenticeship.findByIdAndUpdate(jobId, { $inc: { viewCount: 1 } });

    // Generate SEO-friendly URL
    const jobWithMeta = {
      ...job,
      seoUrl: `/apprenticeships/${job.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")}-${job.location.city
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")}-${job._id}`,
      // Format salary for display
      formattedSalary: job.salary
        ? `${job.salary.currency === "GBP" ? "£" : "$"}${job.salary.min?.toLocaleString()} - ${job.salary.currency === "GBP" ? "£" : "$"}${job.salary.max?.toLocaleString()} ${job.salary.type}`
        : "Competitive salary",
      // Days until deadline
      daysUntilDeadline: Math.ceil(
        (new Date(job.applicationDeadline).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    };

    res.json({
      success: true,
      data: jobWithMeta,
    });
  } catch (error) {
    console.error("Error fetching public job details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch job details",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/apprenticeships/discover - Get apprenticeships for discovery/swiping
router.get("/discover", async (req: any, res: any) => {
  try {
    const {
      page = 1,
      limit = 20,
      industry,
      location,
      salaryMin,
      salaryMax,
      maxDistance = 50000,
      workType,
      isRemote,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query: any = {
      isActive: true,
      applicationDeadline: { $gte: new Date() },
    };

    // Filter by industry
    if (industry) {
      query.industry = industry;
    }

    // Filter by work type
    if (workType && workType !== "both") {
      query.employmentType = workType;
    }

    // Filter by remote work
    if (isRemote === "true") {
      query.isRemote = true;
    }

    // Filter by salary range
    if (salaryMin || salaryMax) {
      query["salary.min"] = {};
      if (salaryMin) query["salary.min"].$gte = parseInt(salaryMin);
      if (salaryMax) query["salary.max"] = { $lte: parseInt(salaryMax) };
    }

    // Location-based filtering (if coordinates provided)
    if (location) {
      try {
        const [lng, lat] = location.split(",").map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          query["location.coordinates"] = {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
              $maxDistance: parseInt(maxDistance),
            },
          };
        }
      } catch (error) {
        console.warn("Invalid location format:", location);
      }
    }

    const apprenticeships = await Apprenticeship.find(query)
      .populate(
        "company",
        "profile.companyName profile.logo profile.industry profile.location",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalCount = await Apprenticeship.countDocuments(query);

    res.json({
      success: true,
      data: {
        apprenticeships,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          hasNext: skip + apprenticeships.length < totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching apprenticeships for discovery:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch apprenticeships",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/apprenticeships/swipe - Get apprenticeships for swiping interface
router.get("/swipe", async (req: any, res: any) => {
  try {
    const userId = req.user?.userId;
    const { location, industries, maxDistance = 50000 } = req.query;

    let query: any = {
      isActive: true,
      applicationDeadline: { $gte: new Date() },
    };

    // Exclude apprenticeships user has already applied to
    if (userId) {
      const appliedApprenticeships = await Application.find({
        student: userId,
      }).distinct("apprenticeship");
      query._id = { $nin: appliedApprenticeships };
    }

    // Filter by user's preferred industries
    if (industries) {
      const industriesArray = Array.isArray(industries)
        ? industries
        : [industries];
      query.industry = { $in: industriesArray };
    }

    // Location-based filtering
    if (location) {
      try {
        const [lng, lat] = location.split(",").map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          query["location.coordinates"] = {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
              $maxDistance: parseInt(maxDistance),
            },
          };
        }
      } catch (error) {
        console.warn("Invalid location format:", location);
      }
    }

    const apprenticeships = await Apprenticeship.find(query)
      .populate(
        "company",
        "profile.companyName profile.logo profile.industry profile.isVerified",
      )
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: apprenticeships,
    });
  } catch (error) {
    console.error("Error fetching apprenticeships for swiping:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch apprenticeships for swiping",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/apprenticeships - Get all apprenticeships with filtering
router.get("/", async (req: any, res: any) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      industry,
      location,
      salaryMin,
      salaryMax,
      employmentType,
      isRemote,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query: any = { isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "requirements.skills": { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Filters
    if (industry) query.industry = industry;
    if (employmentType) query.employmentType = employmentType;
    if (isRemote === "true") query.isRemote = true;
    if (location) query["location.city"] = { $regex: location, $options: "i" };

    // Salary range filter
    if (salaryMin || salaryMax) {
      if (salaryMin) query["salary.min"] = { $gte: parseInt(salaryMin) };
      if (salaryMax) query["salary.max"] = { $lte: parseInt(salaryMax) };
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    const apprenticeships = await Apprenticeship.find(query)
      .populate(
        "company",
        "profile.companyName profile.logo profile.industry profile.location profile.isVerified",
      )
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalCount = await Apprenticeship.countDocuments(query);

    res.json({
      success: true,
      data: {
        apprenticeships,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
        },
        filters: {
          availableIndustries: await Apprenticeship.distinct("industry", {
            isActive: true,
          }),
          availableLocations: await Apprenticeship.distinct("location.city", {
            isActive: true,
          }),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching apprenticeships:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch apprenticeships",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/apprenticeships/:id - Get specific apprenticeship
router.get("/:id", async (req: any, res: any) => {
  try {
    const apprenticeshipId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(apprenticeshipId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid apprenticeship ID",
      });
    }

    const apprenticeship = await Apprenticeship.findById(apprenticeshipId)
      .populate(
        "company",
        "profile.companyName profile.logo profile.industry profile.description profile.website profile.location profile.isVerified",
      )
      .lean();

    if (!apprenticeship) {
      return res.status(404).json({
        success: false,
        error: "Apprenticeship not found",
      });
    }

    // Increment view count
    await Apprenticeship.findByIdAndUpdate(apprenticeshipId, {
      $inc: { viewCount: 1 },
    });

    // Check if user has applied (if authenticated)
    let hasApplied = false;
    if (req.user?.userId) {
      const application = await Application.findOne({
        student: req.user.userId,
        apprenticeship: apprenticeshipId,
      });
      hasApplied = !!application;
    }

    res.json({
      success: true,
      data: {
        ...apprenticeship,
        hasApplied,
      },
    });
  } catch (error) {
    console.error("Error fetching apprenticeship:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch apprenticeship",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/apprenticeships - Create new apprenticeship (company only)
router.post("/", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== "company") {
      return res.status(403).json({
        success: false,
        error: "Only companies can create apprenticeships",
      });
    }

    // Get company details
    const company = await User.findById(userId);
    if (!company || !company.profile) {
      return res.status(400).json({
        success: false,
        error: "Company profile not found",
      });
    }

    const companyProfile = company.profile as any;

    const {
      title,
      description,
      industry,
      location,
      salary,
      requirements,
      benefits = [],
      duration,
      applicationDeadline,
      isRemote = false,
      employmentType = "full-time",
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !industry ||
      !salary ||
      !duration ||
      !applicationDeadline
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Create new apprenticeship
    const newApprenticeship = new Apprenticeship({
      title: title.trim(),
      description: description.trim(),
      industry,
      company: userId,
      companyName: companyProfile.companyName,
      location: {
        type: "Point",
        coordinates:
          location.coordinates || companyProfile.location.coordinates,
        address: location.address || companyProfile.location.address,
        city: location.city || companyProfile.location.city,
        state: location.state || "Unknown",
        zipCode: location.zipCode || "Unknown",
      },
      salary: {
        min: salary.min,
        max: salary.max,
        currency: salary.currency || "USD",
        type: salary.type || "annually",
      },
      requirements: {
        education: requirements.education || "No specific requirements",
        experience: requirements.experience || "No experience required",
        skills: requirements.skills || [],
        certifications: requirements.certifications || [],
      },
      benefits,
      duration: {
        months: duration.months,
        startDate: new Date(duration.startDate),
        endDate: new Date(duration.endDate),
      },
      applicationDeadline: new Date(applicationDeadline),
      isRemote,
      employmentType,
      isActive: true,
      applicationCount: 0,
      viewCount: 0,
    });

    await newApprenticeship.save();

    const populatedApprenticeship = await Apprenticeship.findById(
      newApprenticeship._id,
    )
      .populate("company", "profile.companyName profile.logo profile.industry")
      .lean();

    res.status(201).json({
      success: true,
      data: populatedApprenticeship,
      message: "Apprenticeship created successfully",
    });
  } catch (error) {
    console.error("Error creating apprenticeship:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create apprenticeship",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// PUT /api/apprenticeships/:id - Update apprenticeship (company only)
router.put("/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const apprenticeshipId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== "company" && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only companies can update apprenticeships",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(apprenticeshipId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid apprenticeship ID",
      });
    }

    const apprenticeship = await Apprenticeship.findById(apprenticeshipId);
    if (!apprenticeship) {
      return res.status(404).json({
        success: false,
        error: "Apprenticeship not found",
      });
    }

    // Check ownership
    if (
      userRole === "company" &&
      apprenticeship.company.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        error: "You can only update your own apprenticeships",
      });
    }

    // Update apprenticeship
    const updatedApprenticeship = await Apprenticeship.findByIdAndUpdate(
      apprenticeshipId,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true },
    ).populate("company", "profile.companyName profile.logo profile.industry");

    res.json({
      success: true,
      data: updatedApprenticeship,
      message: "Apprenticeship updated successfully",
    });
  } catch (error) {
    console.error("Error updating apprenticeship:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update apprenticeship",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/apprenticeships/:id - Delete apprenticeship (company only)
router.delete("/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const apprenticeshipId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== "company" && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Only companies can delete apprenticeships",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(apprenticeshipId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid apprenticeship ID",
      });
    }

    const apprenticeship = await Apprenticeship.findById(apprenticeshipId);
    if (!apprenticeship) {
      return res.status(404).json({
        success: false,
        error: "Apprenticeship not found",
      });
    }

    // Check ownership
    if (
      userRole === "company" &&
      apprenticeship.company.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own apprenticeships",
      });
    }

    // Soft delete - mark as inactive instead of actually deleting
    await Apprenticeship.findByIdAndUpdate(apprenticeshipId, {
      isActive: false,
    });

    res.json({
      success: true,
      message: "Apprenticeship deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting apprenticeship:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete apprenticeship",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/apprenticeships/company/my - Get company's own apprenticeships
router.get("/company/my", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== "company") {
      return res.status(403).json({
        success: false,
        error: "Only companies can access this endpoint",
      });
    }

    const { page = 1, limit = 10, status = "all" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query: any = { company: userId };
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const apprenticeships = await Apprenticeship.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get application counts for each apprenticeship
    const apprenticeshipIds = apprenticeships.map((app) => app._id);
    const applicationCounts = await Application.aggregate([
      { $match: { apprenticeship: { $in: apprenticeshipIds } } },
      {
        $group: {
          _id: "$apprenticeship",
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          accepted: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
          },
        },
      },
    ]);

    // Add application stats to apprenticeships
    const apprenticeshipsWithStats = apprenticeships.map((app) => {
      const stats = applicationCounts.find(
        (stat) => stat._id.toString() === app._id.toString(),
      );
      return {
        ...app,
        applicationStats: stats || { total: 0, pending: 0, accepted: 0 },
      };
    });

    const totalCount = await Apprenticeship.countDocuments(query);

    res.json({
      success: true,
      data: {
        apprenticeships: apprenticeshipsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching company apprenticeships:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch company apprenticeships",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

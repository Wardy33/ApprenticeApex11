import express from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Apprenticeship } from "../models/Apprenticeship";
import { Application } from "../models/Application";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Calculate match score between student and apprenticeship
function calculateMatchScore(student: any, apprenticeship: any): number {
  let score = 0;
  const studentProfile = student.profile;

  // Industry match (30 points)
  if (
    studentProfile.preferences?.industries?.includes(apprenticeship.industry)
  ) {
    score += 30;
  }

  // Skills match (25 points)
  const studentSkills: string[] = (studentProfile.skills || []) as string[];
  const requiredSkills: string[] = (apprenticeship.requirements?.skills ||
    []) as string[];
  if (requiredSkills.length > 0) {
    const matchingSkills = studentSkills.filter((skill) =>
      requiredSkills.some((reqSkill) =>
        reqSkill.toLowerCase().includes(skill.toLowerCase()),
      ),
    );
    score += Math.min(25, (matchingSkills.length / requiredSkills.length) * 25);
  } else {
    score += 10; // Base points if no specific skills required
  }

  // Location match (20 points)
  if (apprenticeship.isRemote || studentProfile.preferences?.maxDistance) {
    if (apprenticeship.isRemote) {
      score += 20;
    } else if (
      studentProfile.location?.coordinates &&
      apprenticeship.location?.coordinates
    ) {
      const distance = calculateDistance(
        studentProfile.location.coordinates,
        apprenticeship.location.coordinates,
      );
      const maxDistance = studentProfile.preferences?.maxDistance || 25;
      if (distance <= maxDistance) {
        score += Math.max(0, 20 - (distance / maxDistance) * 10);
      }
    }
  }

  // Salary match (15 points)
  if (studentProfile.preferences?.salaryRange && apprenticeship.salary) {
    const studentMin = studentProfile.preferences.salaryRange.min || 0;
    const studentMax = studentProfile.preferences.salaryRange.max || 100000;
    const jobMin = apprenticeship.salary.min;
    const jobMax = apprenticeship.salary.max;

    if (jobMin >= studentMin && jobMax <= studentMax) {
      score += 15;
    } else if (jobMin <= studentMax && jobMax >= studentMin) {
      score += 7; // Partial overlap
    }
  }

  // Work type match (10 points)
  if (studentProfile.preferences?.workType) {
    if (
      studentProfile.preferences.workType === "both" ||
      studentProfile.preferences.workType === apprenticeship.employmentType
    ) {
      score += 10;
    }
  }

  return Math.min(100, Math.round(score));
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  coords1: [number, number],
  coords2: [number, number],
): number {
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// GET /api/matching/recommendations - Get personalized apprenticeship recommendations
router.get(
  "/recommendations",
  authenticateToken,
  async (req: any, res: any) => {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      if (userRole !== "student") {
        return res.status(403).json({
          success: false,
          error: "Only students can get recommendations",
        });
      }

      const { limit = 10, minScore = 40 } = req.query;

      // Get student profile
      const student = await User.findById(userId);
      if (!student || !student.profile) {
        return res.status(400).json({
          success: false,
          error: "Student profile not found",
        });
      }

      // Get apprenticeships the student hasn't applied to yet
      const appliedApprenticeships = await Application.find({
        student: userId,
      }).distinct("apprenticeship");

      let query: any = {
        isActive: true,
        applicationDeadline: { $gte: new Date() },
        _id: { $nin: appliedApprenticeships },
      };

      // Filter by student preferences
      const studentProfile = student.profile as any;
      if (studentProfile.preferences?.industries?.length > 0) {
        query.industry = { $in: studentProfile.preferences.industries };
      }

      // Get potential matches
      const apprenticeships = await Apprenticeship.find(query)
        .populate(
          "company",
          "profile.companyName profile.logo profile.isVerified",
        )
        .limit(parseInt(limit) * 2) // Get more than needed for filtering
        .lean();

      // Calculate match scores and filter
      const scoredApprenticeships = apprenticeships
        .map((apprenticeship) => ({
          ...apprenticeship,
          matchScore: calculateMatchScore(student, apprenticeship),
        }))
        .filter(
          (apprenticeship) => apprenticeship.matchScore >= parseInt(minScore),
        )
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, parseInt(limit));

      res.json({
        success: true,
        data: {
          recommendations: scoredApprenticeships,
          totalFound: scoredApprenticeships.length,
          criteria: {
            minScore: parseInt(minScore),
            industries: studentProfile.preferences?.industries || [],
            maxDistance: studentProfile.preferences?.maxDistance || 25,
          },
        },
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get recommendations",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  },
);

// GET /api/matching/candidates - Get matching candidates for company's apprenticeships
router.get("/candidates", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== "company") {
      return res.status(403).json({
        success: false,
        error: "Only companies can access this endpoint",
      });
    }

    const { apprenticeshipId, limit = 20, minScore = 50 } = req.query;

    if (!apprenticeshipId) {
      return res.status(400).json({
        success: false,
        error: "Apprenticeship ID is required",
      });
    }

    // Get the apprenticeship
    const apprenticeship = await Apprenticeship.findById(apprenticeshipId);
    if (!apprenticeship || apprenticeship.company.toString() !== userId) {
      return res.status(404).json({
        success: false,
        error: "Apprenticeship not found or access denied",
      });
    }

    // Get students who haven't applied to this apprenticeship
    const appliedStudents = await Application.find({
      apprenticeship: apprenticeshipId,
    }).distinct("student");

    const students = await User.find({
      role: "student",
      isActive: true,
      "profile.isActive": true,
      _id: { $nin: appliedStudents },
    }).lean();

    // Calculate match scores
    const scoredCandidates = students
      .map((student) => ({
        ...student,
        matchScore: calculateMatchScore(student, apprenticeship),
      }))
      .filter((candidate) => candidate.matchScore >= parseInt(minScore))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        candidates: scoredCandidates,
        apprenticeship: {
          id: apprenticeship._id,
          title: apprenticeship.title,
          industry: apprenticeship.industry,
        },
        totalFound: scoredCandidates.length,
        criteria: {
          minScore: parseInt(minScore),
        },
      },
    });
  } catch (error) {
    console.error("Error getting matching candidates:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get matching candidates",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/matching/analyze - Analyze match between student and apprenticeship
router.post("/analyze", authenticateToken, async (req: any, res: any) => {
  try {
    const { studentId, apprenticeshipId } = req.body;
    const userRole = req.user.role;

    if (!studentId || !apprenticeshipId) {
      return res.status(400).json({
        success: false,
        error: "Student ID and Apprenticeship ID are required",
      });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(apprenticeshipId)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid student or apprenticeship ID",
      });
    }

    // Get student and apprenticeship
    const [student, apprenticeship] = await Promise.all([
      User.findById(studentId),
      Apprenticeship.findById(apprenticeshipId).populate(
        "company",
        "profile.companyName",
      ),
    ]);

    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    if (!apprenticeship) {
      return res.status(404).json({
        success: false,
        error: "Apprenticeship not found",
      });
    }

    // Check access permissions
    const hasAccess =
      userRole === "admin" ||
      (userRole === "student" && req.user.userId === studentId) ||
      (userRole === "company" &&
        apprenticeship.company._id.toString() === req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Calculate detailed match analysis
    const matchScore = calculateMatchScore(student, apprenticeship);
    const studentProfile = student.profile as any;

    // Detailed breakdown
    const analysis: {
      overallScore: number;
      breakdown: {
        industry: { score: number; details: string };
        skills: {
          score: number;
          matchingSkills: string[];
          missingSkills: string[];
          details: string;
        };
        location: { score: number; distance: number | null; details: string };
        salary: { score: number; details: string };
        workType: { score: number; details: string };
      };
      recommendations: { type: string; message: string }[];
    } = {
      overallScore: matchScore,
      breakdown: {
        industry: {
          score: 0,
          details: "",
        },
        skills: {
          score: 0,
          matchingSkills: [],
          missingSkills: [],
          details: "",
        },
        location: {
          score: 0,
          distance: null as number | null,
          details: "",
        },
        salary: {
          score: 0,
          details: "",
        },
        workType: {
          score: 0,
          details: "",
        },
      },
      recommendations: [],
    };

    // Industry analysis
    if (
      studentProfile.preferences?.industries?.includes(apprenticeship.industry)
    ) {
      analysis.breakdown.industry.score = 30;
      analysis.breakdown.industry.details = "Perfect industry match";
    } else {
      analysis.breakdown.industry.details =
        "Industry not in student preferences";
    }

    // Skills analysis
    const studentSkills: string[] = (studentProfile.skills || []) as string[];
    const requiredSkills: string[] = (apprenticeship.requirements?.skills ||
      []) as string[];

    if (requiredSkills.length > 0) {
      const matchingSkills = studentSkills.filter((skill: string) =>
        requiredSkills.some((reqSkill) =>
          reqSkill.toLowerCase().includes(skill.toLowerCase()),
        ),
      );
      const missingSkills = requiredSkills.filter(
        (reqSkill: string) =>
          !studentSkills.some((skill) =>
            reqSkill.toLowerCase().includes(skill.toLowerCase()),
          ),
      );

      analysis.breakdown.skills.score = Math.min(
        25,
        (matchingSkills.length / requiredSkills.length) * 25,
      );
      analysis.breakdown.skills.matchingSkills = matchingSkills;
      analysis.breakdown.skills.missingSkills = missingSkills;
      analysis.breakdown.skills.details = `${matchingSkills.length}/${requiredSkills.length} required skills match`;
    } else {
      analysis.breakdown.skills.score = 10;
      analysis.breakdown.skills.details = "No specific skills required";
    }

    // Location analysis
    if (apprenticeship.isRemote) {
      analysis.breakdown.location.score = 20;
      analysis.breakdown.location.details =
        "Remote position - location not a factor";
    } else if (
      studentProfile.location?.coordinates &&
      apprenticeship.location?.coordinates
    ) {
      const distance = calculateDistance(
        studentProfile.location.coordinates,
        apprenticeship.location.coordinates,
      );
      const maxDistance = studentProfile.preferences?.maxDistance || 25;

      analysis.breakdown.location.distance = Math.round(distance);

      if (distance <= maxDistance) {
        analysis.breakdown.location.score = Math.max(
          0,
          20 - (distance / maxDistance) * 10,
        );
        analysis.breakdown.location.details = `Within preferred distance (${Math.round(distance)}km)`;
      } else {
        analysis.breakdown.location.details = `Outside preferred distance (${Math.round(distance)}km vs ${maxDistance}km max)`;
      }
    } else {
      analysis.breakdown.location.details = "Location information incomplete";
    }

    // Salary analysis
    if (studentProfile.preferences?.salaryRange && apprenticeship.salary) {
      const studentMin = studentProfile.preferences.salaryRange.min || 0;
      const studentMax = studentProfile.preferences.salaryRange.max || 100000;
      const jobMin = apprenticeship.salary.min;
      const jobMax = apprenticeship.salary.max;

      if (jobMin >= studentMin && jobMax <= studentMax) {
        analysis.breakdown.salary.score = 15;
        analysis.breakdown.salary.details =
          "Salary range matches preferences perfectly";
      } else if (jobMin <= studentMax && jobMax >= studentMin) {
        analysis.breakdown.salary.score = 7;
        analysis.breakdown.salary.details =
          "Salary range partially matches preferences";
      } else {
        analysis.breakdown.salary.details = "Salary range outside preferences";
      }
    } else {
      analysis.breakdown.salary.details = "Salary preferences not specified";
    }

    // Work type analysis
    if (studentProfile.preferences?.workType) {
      if (
        studentProfile.preferences.workType === "both" ||
        studentProfile.preferences.workType === apprenticeship.employmentType
      ) {
        analysis.breakdown.workType.score = 10;
        analysis.breakdown.workType.details = "Work type matches preferences";
      } else {
        analysis.breakdown.workType.details =
          "Work type does not match preferences";
      }
    } else {
      analysis.breakdown.workType.details =
        "Work type preference not specified";
    }

    // Generate recommendations
    if (analysis.breakdown.skills.missingSkills.length > 0) {
      analysis.recommendations.push({
        type: "skills",
        message: `Consider developing these skills: ${analysis.breakdown.skills.missingSkills.join(", ")}`,
      });
    }

    if (
      analysis.breakdown.location.distance &&
      analysis.breakdown.location.distance >
        (studentProfile.preferences?.maxDistance || 25)
    ) {
      analysis.recommendations.push({
        type: "location",
        message:
          "Consider expanding your search radius or looking into remote opportunities",
      });
    }

    if (analysis.overallScore < 60) {
      analysis.recommendations.push({
        type: "general",
        message:
          "This position may not be the best match. Consider refining your preferences or profile.",
      });
    }

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${studentProfile.firstName} ${studentProfile.lastName}`,
        },
        apprenticeship: {
          id: apprenticeship._id,
          title: apprenticeship.title,
          company: (apprenticeship as any).company.profile.companyName,
        },
        analysis,
      },
    });
  } catch (error) {
    console.error("Error analyzing match:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze match",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/matching/stats - Get matching statistics
router.get("/stats", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let stats: any = {};

    if (userRole === "student") {
      // Get student's matching stats
      const student = await User.findById(userId);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found",
        });
      }

      const appliedApprenticeships = await Application.find({
        student: userId,
      }).distinct("apprenticeship");

      const totalApprenticeships = await Apprenticeship.countDocuments({
        isActive: true,
        applicationDeadline: { $gte: new Date() },
      });

      const potentialMatches = await Apprenticeship.find({
        isActive: true,
        applicationDeadline: { $gte: new Date() },
        _id: { $nin: appliedApprenticeships },
      }).lean();

      // Calculate average match score for potential matches
      const matchScores = potentialMatches.map((apprenticeship) =>
        calculateMatchScore(student, apprenticeship),
      );

      const averageMatchScore =
        matchScores.length > 0
          ? Math.round(
              matchScores.reduce((a, b) => a + b, 0) / matchScores.length,
            )
          : 0;

      const highQualityMatches = matchScores.filter(
        (score) => score >= 70,
      ).length;

      stats = {
        totalApprenticeships,
        alreadyApplied: appliedApprenticeships.length,
        potentialMatches: potentialMatches.length,
        averageMatchScore,
        highQualityMatches,
        profileCompleteness: (student.profile as any).profileCompletion || 0,
      };
    } else if (userRole === "company") {
      // Get company's matching stats
      const companyApprenticeships = await Apprenticeship.find({
        company: userId,
        isActive: true,
      });

      const apprenticeshipIds = companyApprenticeships.map((app) => app._id);

      const totalApplications = await Application.countDocuments({
        apprenticeship: { $in: apprenticeshipIds },
      });

      const totalStudents = await User.countDocuments({
        role: "student",
        isActive: true,
        "profile.isActive": true,
      });

      stats = {
        activeApprenticeships: companyApprenticeships.length,
        totalApplications,
        averageApplicationsPerPost:
          companyApprenticeships.length > 0
            ? Math.round(totalApplications / companyApprenticeships.length)
            : 0,
        totalStudents,
        reachPercentage:
          totalStudents > 0
            ? Math.round((totalApplications / totalStudents) * 100)
            : 0,
      };
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting matching stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get matching statistics",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/matching/similar - Find similar apprenticeships/students
router.get("/similar", authenticateToken, async (req: any, res: any) => {
  try {
    const { type, id, limit = 5 } = req.query;

    if (!type || !id || !["apprenticeship", "student"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Valid type (apprenticeship/student) and ID are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid ID format",
      });
    }

    let similar: any[] = [];

    if (type === "apprenticeship") {
      const apprenticeship = await Apprenticeship.findById(id);
      if (!apprenticeship) {
        return res.status(404).json({
          success: false,
          error: "Apprenticeship not found",
        });
      }

      // Find similar apprenticeships based on industry, location, and skills
      similar = await Apprenticeship.find({
        _id: { $ne: id },
        isActive: true,
        $or: [
          { industry: apprenticeship.industry },
          { "location.city": apprenticeship.location.city },
          {
            "requirements.skills": { $in: apprenticeship.requirements.skills },
          },
        ],
      })
        .populate("company", "profile.companyName profile.logo")
        .limit(parseInt(limit))
        .lean();
    } else if (type === "student") {
      const student = await User.findById(id);
      if (!student || student.role !== "student") {
        return res.status(404).json({
          success: false,
          error: "Student not found",
        });
      }

      const studentProfile = student.profile as any;

      // Find similar students based on skills, location, and preferences
      similar = await User.find({
        _id: { $ne: id },
        role: "student",
        isActive: true,
        $or: [
          { "profile.skills": { $in: studentProfile.skills || [] } },
          { "profile.location.city": studentProfile.location?.city },
          {
            "profile.preferences.industries": {
              $in: studentProfile.preferences?.industries || [],
            },
          },
        ],
      })
        .select(
          "profile.firstName profile.lastName profile.skills profile.location profile.preferences",
        )
        .limit(parseInt(limit))
        .lean();
    }

    res.json({
      success: true,
      data: {
        similar,
        count: similar.length,
        type,
      },
    });
  } catch (error) {
    console.error("Error finding similar items:", error);
    res.status(500).json({
      success: false,
      error: "Failed to find similar items",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

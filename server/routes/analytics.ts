import express from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Apprenticeship } from "../models/Apprenticeship";
import { Application } from "../models/Application";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// GET /api/analytics/dashboard - Get dashboard analytics
router.get("/dashboard", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { timeframe = "30d" } = req.query;

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    let analytics: any = {};

    if (userRole === "student") {
      analytics = await getStudentAnalytics(userId, startDate);
    } else if (userRole === "company") {
      analytics = await getCompanyAnalytics(userId, startDate);
    } else if (userRole === "admin") {
      analytics = await getAdminAnalytics(startDate);
    }

    res.json({
      success: true,
      data: analytics,
      timeframe,
      period: {
        start: startDate,
        end: now,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/analytics/trends - Get trend data over time
router.get("/trends", authenticateToken, async (req: any, res: any) => {
  try {
    const { timeframe = "30d", metric = "applications" } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let groupBy: any = { $dayOfYear: "$createdAt" };

    switch (timeframe) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        groupBy = { $dayOfYear: "$createdAt" };
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        groupBy = { $dayOfYear: "$createdAt" };
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        groupBy = { $week: "$createdAt" };
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = { $month: "$createdAt" };
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    let trends: any = {};

    if (userRole === "student") {
      trends = await getStudentTrends(userId, startDate, groupBy, metric);
    } else if (userRole === "company") {
      trends = await getCompanyTrends(userId, startDate, groupBy, metric);
    } else if (userRole === "admin") {
      trends = await getAdminTrends(startDate, groupBy, metric);
    }

    res.json({
      success: true,
      data: trends,
      timeframe,
      metric,
      period: {
        start: startDate,
        end: now,
      },
    });
  } catch (error) {
    console.error("Error fetching trend analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trends",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/analytics/reports - Get detailed reports
router.get("/reports", authenticateToken, async (req: any, res: any) => {
  try {
    const { type = "summary", timeframe = "30d" } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    // Only admin and company users can access detailed reports
    if (userRole !== "admin" && userRole !== "company") {
      return res.status(403).json({
        success: false,
        error:
          "Access denied. Reports are available for admin and company users only.",
      });
    }

    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    let report: any = {};

    if (userRole === "admin") {
      report = await getAdminReport(startDate, type);
    } else if (userRole === "company") {
      report = await getCompanyReport(userId, startDate, type);
    }

    res.json({
      success: true,
      data: report,
      type,
      timeframe,
      period: {
        start: startDate,
        end: now,
      },
    });
  } catch (error) {
    console.error("Error fetching report analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch report",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Helper functions for student analytics
async function getStudentAnalytics(userId: string, startDate: Date) {
  const [applications, acceptedApplications, apprenticeships] =
    await Promise.all([
      Application.countDocuments({
        student: userId,
        createdAt: { $gte: startDate },
      }),
      Application.countDocuments({
        student: userId,
        status: "accepted",
        updatedAt: { $gte: startDate },
      }),
      Apprenticeship.countDocuments({
        createdAt: { $gte: startDate },
      }),
    ]);

  const applicationStatusBreakdown = await Application.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    totalApplications: applications,
    acceptedApplications,
    availableApprenticeships: apprenticeships,
    successRate:
      applications > 0
        ? ((acceptedApplications / applications) * 100).toFixed(1)
        : 0,
    applicationStatusBreakdown: applicationStatusBreakdown.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {},
    ),
  };
}

// Helper functions for company analytics
async function getCompanyAnalytics(userId: string, startDate: Date) {
  const [apprenticeships, applications, acceptedApplications] =
    await Promise.all([
      Apprenticeship.countDocuments({
        company: userId,
        createdAt: { $gte: startDate },
      }),
      Application.aggregate([
        {
          $lookup: {
            from: "apprenticeships",
            localField: "apprenticeship",
            foreignField: "_id",
            as: "apprenticeshipDetails",
          },
        },
        {
          $match: {
            "apprenticeshipDetails.company": new mongoose.Types.ObjectId(
              userId,
            ),
            createdAt: { $gte: startDate },
          },
        },
        {
          $count: "total",
        },
      ]),
      Application.aggregate([
        {
          $lookup: {
            from: "apprenticeships",
            localField: "apprenticeship",
            foreignField: "_id",
            as: "apprenticeshipDetails",
          },
        },
        {
          $match: {
            "apprenticeshipDetails.company": new mongoose.Types.ObjectId(
              userId,
            ),
            status: "accepted",
            updatedAt: { $gte: startDate },
          },
        },
        {
          $count: "total",
        },
      ]),
    ]);

  const totalApplications = applications[0]?.total || 0;
  const totalAccepted = acceptedApplications[0]?.total || 0;

  const topApprenticeships = await Apprenticeship.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $lookup: {
        from: "applications",
        localField: "_id",
        foreignField: "apprenticeship",
        as: "applications",
      },
    },
    {
      $addFields: {
        applicationCount: { $size: "$applications" },
      },
    },
    {
      $sort: { applicationCount: -1 },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        title: 1,
        applicationCount: 1,
      },
    },
  ]);

  return {
    totalApprenticeships: apprenticeships,
    totalApplications,
    acceptedApplications: totalAccepted,
    conversionRate:
      totalApplications > 0
        ? ((totalAccepted / totalApplications) * 100).toFixed(1)
        : 0,
    topApprenticeships,
  };
}

// Helper functions for admin analytics
async function getAdminAnalytics(startDate: Date) {
  const [totalUsers, totalApprenticeships, totalApplications, activeUsers] =
    await Promise.all([
      User.countDocuments({
        createdAt: { $gte: startDate },
      }),
      Apprenticeship.countDocuments({
        createdAt: { $gte: startDate },
      }),
      Application.countDocuments({
        createdAt: { $gte: startDate },
      }),
      User.countDocuments({
        lastLogin: { $gte: startDate },
      }),
    ]);

  const usersByRole = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const applicationsByStatus = await Application.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    totalUsers,
    totalApprenticeships,
    totalApplications,
    activeUsers,
    usersByRole: usersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
}

// Trend helper functions
async function getStudentTrends(
  userId: string,
  startDate: Date,
  groupBy: any,
  metric: string,
) {
  let matchStage: any = {
    student: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: startDate },
  };

  if (metric === "accepted") {
    matchStage.status = "accepted";
  }

  const trends = await Application.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        date: { $first: "$createdAt" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return trends;
}

async function getCompanyTrends(
  userId: string,
  startDate: Date,
  groupBy: any,
  metric: string,
) {
  if (metric === "apprenticeships") {
    return await Apprenticeship.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          date: { $first: "$createdAt" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  } else {
    return await Application.aggregate([
      {
        $lookup: {
          from: "apprenticeships",
          localField: "apprenticeship",
          foreignField: "_id",
          as: "apprenticeshipDetails",
        },
      },
      {
        $match: {
          "apprenticeshipDetails.company": new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          date: { $first: "$createdAt" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}

async function getAdminTrends(startDate: Date, groupBy: any, metric: string) {
  let collection;

  switch (metric) {
    case "users":
      collection = User;
      break;
    case "apprenticeships":
      collection = Apprenticeship;
      break;
    case "applications":
    default:
      collection = Application;
      break;
  }

  return await collection.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        date: { $first: "$createdAt" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

// Report helper functions
async function getAdminReport(startDate: Date, type: string) {
  if (type === "detailed") {
    return await Promise.all([
      User.aggregate([
        {
          $match: { createdAt: { $gte: startDate } },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            users: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Apprenticeship.aggregate([
        {
          $match: { createdAt: { $gte: startDate } },
        },
        {
          $lookup: {
            from: "users",
            localField: "company",
            foreignField: "_id",
            as: "companyDetails",
          },
        },
        {
          $project: {
            title: 1,
            company: { $arrayElemAt: ["$companyDetails.companyName", 0] },
            location: 1,
            createdAt: 1,
          },
        },
      ]),
    ]);
  }

  return await getAdminAnalytics(startDate);
}

async function getCompanyReport(userId: string, startDate: Date, type: string) {
  if (type === "detailed") {
    return await Apprenticeship.aggregate([
      {
        $match: {
          company: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "apprenticeship",
          as: "applications",
        },
      },
      {
        $addFields: {
          applicationCount: { $size: "$applications" },
          acceptedCount: {
            $size: {
              $filter: {
                input: "$applications",
                cond: { $eq: ["$$this.status", "accepted"] },
              },
            },
          },
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          location: 1,
          applicationCount: 1,
          acceptedCount: 1,
          createdAt: 1,
        },
      },
    ]);
  }

  return await getCompanyAnalytics(userId, startDate);
}

export default router;

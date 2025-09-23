import { Router, Response } from "express";
import { User } from "../models/User";
import {
  authenticateToken,
  requireAdminPermission,
  AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

// Get all users with pagination and filtering
router.get(
  "/",
  authenticateToken,
  requireAdminPermission("canViewAllUsers"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as string;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      // Build filter query
      const filter: any = {};

      if (role && ["student", "company", "admin"].includes(role)) {
        filter.role = role;
      }

      if (status) {
        filter.isActive = status === "active";
      }

      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: "i" } },
          { "profile.firstName": { $regex: search, $options: "i" } },
          { "profile.lastName": { $regex: search, $options: "i" } },
          { "profile.companyName": { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const users = (await User.find(filter)
        .select("-password -emailVerificationToken -passwordResetToken")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()) as any[];

      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limit);

      // Add computed fields
      const enrichedUsers = users.map((user) => ({
        ...user,
        fullName:
          user.role === "student"
            ? `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim()
            : user.profile?.companyName || "N/A",
        registrationDate: user.createdAt,
        lastActive: user.lastLogin || user.createdAt,
        profileCompletion:
          user.role === "student" ? user.profile?.profileCompletion || 0 : 100,
      }));

      res.json({
        users: enrichedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          role,
          search,
          status,
          sortBy,
          sortOrder,
        },
      });
    } catch (error) {
      console.error("❌ Get users error:", error);
      res.status(500).json({
        error: "Failed to retrieve users",
        code: "GET_USERS_ERROR",
      });
    }
  },
);

// Get detailed user information by ID
router.get(
  "/:id",
  authenticateToken,
  requireAdminPermission("canViewAllUsers"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;

      const user = (await User.findById(userId)
        .select("-password -emailVerificationToken -passwordResetToken")
        .lean()) as any;

      if (!user) {
        res.status(404).json({
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Get additional user statistics
      const userStats = {
        accountAge: Math.floor(
          (Date.now() - new Date(user.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        lastLoginDays: user.lastLogin
          ? Math.floor(
              (Date.now() - new Date(user.lastLogin).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null,
        profileCompletion:
          user.role === "student" ? user.profile?.profileCompletion || 0 : 100,
        emailVerified: user.isEmailVerified,
        subscriptionStatus:
          user.role === "company"
            ? user.profile?.subscriptionPlan || "free"
            : null,
      };

      res.json({
        user: {
          ...user,
          stats: userStats,
        },
      });
    } catch (error) {
      console.error("❌ Get user details error:", error);
      res.status(500).json({
        error: "Failed to retrieve user details",
        code: "GET_USER_DETAILS_ERROR",
      });
    }
  },
);

// Update user status (activate/deactivate)
router.put(
  "/:id/status",
  authenticateToken,
  requireAdminPermission("canViewAllUsers"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const { isActive, reason } = req.body;

      if (typeof isActive !== "boolean") {
        res.status(400).json({
          error: "isActive must be a boolean value",
          code: "INVALID_STATUS",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Prevent deactivating master admin
      if (user.role === "master_admin" && !isActive) {
        res.status(403).json({
          error: "Cannot deactivate master admin account",
          code: "CANNOT_DEACTIVATE_MASTER_ADMIN",
        });
      }

      user.isActive = isActive;
      await user.save();

      // Log the action
      console.log(
        `📝 User ${isActive ? "activated" : "deactivated"}: ${user.email} by admin: ${req.user!.email}${reason ? ` - Reason: ${reason}` : ""}`,
      );

      res.json({
        success: true,
        message: `User ${isActive ? "activated" : "deactivated"} successfully`,
        user: {
          id: user._id,
          email: user.email,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error("❌ Update user status error:", error);
      res.status(500).json({
        error: "Failed to update user status",
        code: "UPDATE_USER_STATUS_ERROR",
      });
    }
  },
);

// Get user analytics
router.get(
  "/analytics/overview",
  authenticateToken,
  requireAdminPermission("canViewAllUsers"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const timeframe = (req.query.timeframe as string) || "30d";

      let startDate: Date;
      switch (timeframe) {
        case "7d":
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // User registration trends
      const registrationTrends = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            students: {
              $sum: {
                $cond: [{ $eq: ["$role", "student"] }, 1, 0],
              },
            },
            companies: {
              $sum: {
                $cond: [{ $eq: ["$role", "company"] }, 1, 0],
              },
            },
            total: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // User demographics
      const usersByRole = await User.aggregate([
        {
          $match: { isActive: true },
        },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]);

      // Email verification stats
      const emailStats = await User.aggregate([
        {
          $group: {
            _id: "$isEmailVerified",
            count: { $sum: 1 },
          },
        },
      ]);

      // Recent activity
      const recentUsers = await User.find({ isActive: true })
        .select(
          "email role createdAt lastLogin profile.firstName profile.lastName profile.companyName",
        )
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      res.json({
        registrationTrends,
        usersByRole: usersByRole.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          {} as Record<string, number>,
        ),
        emailVerification: {
          verified: emailStats.find((s) => s._id === true)?.count || 0,
          unverified: emailStats.find((s) => s._id === false)?.count || 0,
        },
        recentUsers: recentUsers.map((user) => ({
          id: user._id,
          email: user.email,
          role: user.role,
          name:
            user.role === "student"
              ? `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim()
              : user.profile?.companyName || "N/A",
          registeredAt: user.createdAt,
          lastActive: user.lastLogin || user.createdAt,
        })),
        timeframe,
      });
    } catch (error) {
      console.error("❌ User analytics error:", error);
      res.status(500).json({
        error: "Failed to retrieve user analytics",
        code: "USER_ANALYTICS_ERROR",
      });
    }
  },
);

// Export user data (CSV/JSON)
router.get(
  "/export/:format",
  authenticateToken,
  requireAdminPermission("canExportData"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const format = req.params.format;
      const role = req.query.role as string;

      if (!["csv", "json"].includes(format)) {
        res.status(400).json({
          error: "Format must be 'csv' or 'json'",
          code: "INVALID_FORMAT",
        });
      }

      const filter: any = { isActive: true };
      if (role && ["student", "company"].includes(role)) {
        filter.role = role;
      }

      const users = await User.find(filter)
        .select("-password -emailVerificationToken -passwordResetToken")
        .lean();

      // Transform data for export
      const exportData = users.map((user) => ({
        id: user._id,
        email: user.email,
        role: user.role,
        name:
          user.role === "student"
            ? `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim()
            : user.profile?.companyName || "N/A",
        emailVerified: user.isEmailVerified,
        active: user.isActive,
        registeredAt: user.createdAt,
        lastLogin: user.lastLogin || null,
        subscriptionPlan:
          user.role === "company" ? user.profile?.subscriptionPlan : null,
      }));

      if (format === "json") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.json"`,
        );
        res.setHeader("Content-Type", "application/json");
        res.json(exportData);
      } else {
        // CSV format
        const csvHeaders = [
          "ID",
          "Email",
          "Role",
          "Name",
          "Email Verified",
          "Active",
          "Registered At",
          "Last Login",
          "Subscription Plan",
        ];
        const csvRows = exportData.map((user) => [
          user.id,
          user.email,
          user.role,
          user.name,
          user.emailVerified,
          user.active,
          user.registeredAt,
          user.lastLogin || "",
          user.subscriptionPlan || "",
        ]);

        const csvContent = [csvHeaders, ...csvRows]
          .map((row) => row.map((field) => `"${field}"`).join(","))
          .join("\n");

        res.setHeader(
          "Content-Disposition",
          `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.csv"`,
        );
        res.setHeader("Content-Type", "text/csv");
        res.send(csvContent);
      }

      // Log export action
      console.log(
        `📊 User data exported (${format}) by admin: ${req.user!.email}, filter: ${JSON.stringify(filter)}`,
      );
    } catch (error) {
      console.error("❌ Export users error:", error);
      res.status(500).json({
        error: "Failed to export user data",
        code: "EXPORT_USERS_ERROR",
      });
    }
  },
);

export default router;

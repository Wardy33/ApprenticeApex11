import express from "express";

const router = express.Router();

// For this implementation, we'll use a direct database connection approach
// In production, this would be replaced with proper MCP integration

// const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID || "winter-bread-79671472";

// Real Neon database connection helper
import { Pool } from "@neondatabase/serverless";

// Get database connection string from environment
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL or NEON_DATABASE_URL environment variable is required",
  );
}

// Real Neon database query function
async function queryNeonDatabase(sqlText: string): Promise<any[]> {
  try {
    console.log(`🔗 Real Neon Query: ${sqlText.substring(0, 100)}...`);

    if (!DATABASE_URL) {
      console.error("❌ No database URL available - returning empty results");
      return [];
    }

    const pool = new Pool({ connectionString: DATABASE_URL });
    const { rows } = await pool.query(sqlText);
    await pool.end();

    console.log(
      `✅ Neon query executed successfully, returned ${rows.length} rows`,
    );
    return rows as any[];
  } catch (error) {
    console.error(
      "❌ Real Neon query error:",
      error instanceof Error ? error.message : String(error),
    );
    console.error("❌ SQL that failed:", sqlText);

    // Return empty results to prevent crashes
    return [];
  }
}

// GET /api/apprenticeships/public - Get public job listings from Neon database
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
    } = req.query;

    console.log(
      "🔍 Fetching public apprenticeships from Neon database with filters:",
      {
        page,
        limit,
        search,
        category,
        location,
      },
    );

    // Count omitted; client-side pagination is applied below

    // Get jobs data
    const jobsQuery = `SELECT * FROM jobs WHERE status = 'active' ORDER BY created_at DESC`;
    let jobsResult = await queryNeonDatabase(jobsQuery);

    // Apply client-side filtering (in production, this would be done in SQL)
    if (search) {
      const searchLower = search.toLowerCase();
      jobsResult = jobsResult.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower) ||
          (job.requirements &&
            job.requirements.some((req: string) =>
              req.toLowerCase().includes(searchLower),
            )),
      );
    }

    if (category && category !== "all") {
      jobsResult = jobsResult.filter((job) => job.category === category);
    }

    if (location && location !== "all") {
      jobsResult = jobsResult.filter((job) =>
        job.location.toLowerCase().includes(location.toLowerCase()),
      );
    }

    if (salaryMin) {
      jobsResult = jobsResult.filter(
        (job) => job.salary_max >= parseInt(salaryMin),
      );
    }

    if (salaryMax) {
      jobsResult = jobsResult.filter(
        (job) => job.salary_min <= parseInt(salaryMax),
      );
    }

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedJobs = jobsResult.slice(offset, offset + parseInt(limit));

    // Format jobs data for frontend compatibility
    const formattedJobs = paginatedJobs.map((job: any) => ({
      _id: job.id.toString(),
      title: job.title,
      description: job.description,
      shortDescription:
        job.description?.substring(0, 200) +
        (job.description?.length > 200 ? "..." : ""),
      industry: job.category || "General",
      location: {
        city: job.location?.split(",")[0]?.trim() || "Remote",
        state: job.location?.split(",")[1]?.trim() || "UK",
        address: job.location || "Remote",
      },
      salary: {
        min: job.salary_min || 0,
        max: job.salary_max || 0,
        currency: "GBP",
        type: "annually",
      },
      requirements: {
        education: "Requirements listed in job description",
        experience: job.experience_level || "Entry level",
        skills: Array.isArray(job.requirements) ? job.requirements : [],
        certifications: [],
      },
      keyRequirements: Array.isArray(job.requirements)
        ? job.requirements.slice(0, 4)
        : [],
      benefits: Array.isArray(job.benefits) ? job.benefits : [],
      duration: {
        months: job.duration_months || 24,
        startDate: job.start_date || new Date().toISOString(),
      },
      applicationDeadline:
        job.application_deadline ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      isRemote: job.remote_allowed || false,
      employmentType: "full-time",
      createdAt: job.created_at || new Date().toISOString(),
      viewCount: job.views_count || 0,
      applicationCount: job.applications_count || 0,
      isActive: true,
      seoUrl: `/apprenticeships/${job.title
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")}-${job.location
        ?.split(",")[0]
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")}-${job.id}`,
    }));

    // Get filter options
    const categoriesResult = await queryNeonDatabase(
      "SELECT DISTINCT category FROM jobs",
    );
    const locationsResult = await queryNeonDatabase(
      "SELECT DISTINCT location FROM jobs",
    );

    const availableCategories = categoriesResult
      .map((row) => row.category)
      .filter(Boolean);
    const availableLocations = locationsResult
      .map((row) => row.location.split(",")[0].trim())
      .filter(Boolean);

    const totalPages = Math.ceil(jobsResult.length / parseInt(limit));

    res.json({
      success: true,
      data: {
        jobs: formattedJobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: jobsResult.length,
          itemsPerPage: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
        filters: {
          categories: [...new Set(availableCategories)].sort(),
          locations: [...new Set(availableLocations)].sort(),
        },
      },
      message: `Found ${jobsResult.length} apprenticeship opportunities from Neon database`,
    });

    console.log(
      `✅ Returned ${formattedJobs.length} jobs out of ${jobsResult.length} total from Neon database`,
    );
  } catch (error) {
    console.error("❌ Error fetching public job listings from Neon:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch job listings from database",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/apprenticeships/public/:id - Get public job details by ID from Neon database
router.get("/public/:id", async (req: any, res: any) => {
  try {
    const jobId = req.params.id;
    console.log("🔍 Fetching job details from Neon database for ID:", jobId);

    // Validate job ID is numeric
    if (!/^\d+$/.test(jobId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid job ID format",
      });
    }

    // Get job data
    const jobQuery = `SELECT * FROM jobs WHERE id = ${jobId}`;
    const jobsResult = await queryNeonDatabase(jobQuery);

    if (!jobsResult || jobsResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    const job = jobsResult[0];

    // Check if job is still active and accepting applications
    if (job.status !== "active") {
      return res.status(410).json({
        success: false,
        error: "This job listing is no longer accepting applications",
      });
    }

    const applicationDeadline = new Date(job.application_deadline);
    const currentDate = new Date();
    if (applicationDeadline < currentDate) {
      return res.status(410).json({
        success: false,
        error: "This job listing is no longer accepting applications",
      });
    }

    // Format job data for frontend compatibility
    const formattedJob = {
      _id: job.id.toString(),
      title: job.title,
      description: job.description,
      industry: job.category || "General",
      location: {
        city: job.location?.split(",")[0]?.trim() || "Remote",
        state: job.location?.split(",")[1]?.trim() || "UK",
        address: job.location || "Remote",
      },
      salary: {
        min: job.salary_min || 0,
        max: job.salary_max || 0,
        currency: "GBP",
        type: "annually",
      },
      requirements: {
        education: "Requirements listed in job description",
        experience: job.experience_level || "Entry level",
        skills: Array.isArray(job.requirements) ? job.requirements : [],
        certifications: [],
      },
      benefits: Array.isArray(job.benefits) ? job.benefits : [],
      duration: {
        months: job.duration_months || 24,
        startDate: job.start_date || new Date().toISOString(),
      },
      applicationDeadline:
        job.application_deadline ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      isRemote: job.remote_allowed || false,
      employmentType: "full-time",
      createdAt: job.created_at || new Date().toISOString(),
      viewCount: (job.views_count || 0) + 1,
      applicationCount: job.applications_count || 0,
      seoUrl: `/apprenticeships/${job.title
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")}-${job.location
        ?.split(",")[0]
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")}-${job.id}`,
      formattedSalary: `£${(job.salary_min || 0).toLocaleString()} - £${(job.salary_max || 0).toLocaleString()} annually`,
      daysUntilDeadline: Math.ceil(
        (applicationDeadline.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    };

    res.json({
      success: true,
      data: formattedJob,
    });

    console.log(`✅ Returned job details from Neon database for: ${job.title}`);
  } catch (error) {
    console.error("❌ Error fetching public job details from Neon:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch job details from database",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

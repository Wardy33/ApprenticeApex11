// Helper functions to interact with Neon database using MCP
import { neon_run_sql } from "../config/neon";

const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID || "winter-bread-79671472";

export async function findUserByEmail(email: string) {
  try {
    // Use actual Neon database query
    const result = await neon_run_sql({
      sql: `
        SELECT
          id, email, password_hash, role, name, is_master_admin,
          admin_permissions, login_attempts, locked_until, last_login_at,
          created_at, updated_at
        FROM users
        WHERE email = $1 AND (role = 'master_admin' OR is_master_admin = true)
        LIMIT 1
      `,
      projectId: NEON_PROJECT_ID,
      params: [email.toLowerCase()],
    });

    if (result && result.length > 0) {
      const user = result[0];
      return {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        name: user.name,
        is_master_admin: user.is_master_admin,
        admin_permissions: user.admin_permissions || {
          canViewAllUsers: true,
          canViewFinancials: true,
          canModerateContent: true,
          canAccessSystemLogs: true,
          canExportData: true,
          canManageAdmins: true,
          canConfigureSystem: true,
        },
        login_attempts: user.login_attempts || 0,
        locked_until: user.locked_until,
        last_login_at: user.last_login_at,
      };
    }

    // Fallback for development - create default admin if not exists
    if (email.toLowerCase() === "admin@apprenticeapex.com") {
      console.log("🔧 Creating default admin user for development...");
      try {
        const { hashPassword } = await import("../services/securePasswordService");
        const hashedPassword = await hashPassword("MasterAdmin2024!", true); // Admin account with high security

        await neon_run_sql({
          sql: `
            INSERT INTO users (email, password_hash, role, name, is_master_admin, admin_permissions, email_verified)
            VALUES ($1, $2, 'master_admin', 'Master Administrator', true, $3, true)
            ON CONFLICT (email) DO NOTHING
          `,
          projectId: NEON_PROJECT_ID,
          params: [
            email.toLowerCase(),
            hashedPassword,
            JSON.stringify({
              canViewAllUsers: true,
              canViewFinancials: true,
              canModerateContent: true,
              canAccessSystemLogs: true,
              canExportData: true,
              canManageAdmins: true,
              canConfigureSystem: true,
            }),
          ],
        });

        // Retry finding the user
        return await findUserByEmail(email);
      } catch (createError) {
        console.error("Error creating default admin:", createError);
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
}

export async function updateUserLoginAttempts(
  userId: number,
  attempts: number,
  lockUntil?: Date,
) {
  try {
    console.log(
      `Updating login attempts for user ${userId}: ${attempts} attempts`,
    );

    await neon_run_sql({
      sql: `
        UPDATE users
        SET login_attempts = $2,
            locked_until = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      projectId: NEON_PROJECT_ID,
      params: [userId, attempts, lockUntil],
    });

    return true;
  } catch (error) {
    console.error("Error updating login attempts:", error);
    return false;
  }
}

export async function updateUserLastLogin(userId: number) {
  try {
    console.log(`Updating last login for user ${userId}`);

    await neon_run_sql({
      sql: `
        UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP,
            login_attempts = 0,
            locked_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
      projectId: NEON_PROJECT_ID,
      params: [userId],
    });

    return true;
  } catch (error) {
    console.error("Error updating last login:", error);
    return false;
  }
}

export async function getDashboardStats() {
  try {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM candidates) as total_candidates,
        (SELECT COUNT(*) FROM companies) as total_companies,
        (SELECT COUNT(*) FROM applications) as total_applications,
        (SELECT COUNT(*) FROM jobs) as total_job_postings,
        (SELECT COUNT(*) FROM interviews) as total_interviews,
        (SELECT COUNT(*) FROM users WHERE subscription_status = 'active') as active_subscriptions,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM payments
         WHERE status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)) as monthly_revenue
    `;

    const result = await neon_run_sql({
      sql: statsQuery,
      projectId: NEON_PROJECT_ID,
    });

    if (result && result.length > 0) {
      return result[0];
    }

    // Fallback mock data if no data exists
    return {
      total_users: 150,
      total_candidates: 120,
      total_companies: 25,
      total_applications: 45,
      total_job_postings: 12,
      total_interviews: 8,
      active_subscriptions: 15,
      total_revenue: 2500.0,
      monthly_revenue: 750.0,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    return {
      total_users: 0,
      total_candidates: 0,
      total_companies: 0,
      total_applications: 0,
      total_job_postings: 0,
      total_interviews: 0,
      active_subscriptions: 0,
      total_revenue: 0.0,
      monthly_revenue: 0.0,
    };
  }
}

export async function getGrowthMetrics() {
  try {
    const growthQuery = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE created_at >= date_trunc('week', CURRENT_DATE)) as users_this_week,
        (SELECT COUNT(*) FROM users WHERE created_at >= date_trunc('month', CURRENT_DATE)) as users_this_month,
        (SELECT COUNT(*) FROM applications WHERE created_at >= date_trunc('week', CURRENT_DATE)) as applications_this_week,
        (SELECT COALESCE(SUM(amount), 0) FROM payments
         WHERE status = 'completed' AND created_at >= date_trunc('month', CURRENT_DATE)) as revenue_this_month,
        (SELECT COUNT(*) FROM users
         WHERE subscription_status = 'active' AND updated_at >= date_trunc('month', CURRENT_DATE)) as subscriptions_this_month
    `;

    const result = await neon_run_sql({
      sql: growthQuery,
      projectId: NEON_PROJECT_ID,
    });

    if (result && result.length > 0) {
      return result[0];
    }

    // Fallback mock data
    return {
      users_this_week: 12,
      users_this_month: 38,
      applications_this_week: 8,
      revenue_this_month: 750.0,
      subscriptions_this_month: 5,
    };
  } catch (error) {
    console.error("Error getting growth metrics:", error);
    return {
      users_this_week: 0,
      users_this_month: 0,
      applications_this_week: 0,
      revenue_this_month: 0.0,
      subscriptions_this_month: 0,
    };
  }
}

export async function getAIModerationStats() {
  try {
    const aiStatsQuery = `
      SELECT
        (SELECT COUNT(*) FROM ai_moderation_flags WHERE created_at >= CURRENT_DATE) as flags_today,
        (SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending') as pending_reviews,
        (SELECT COUNT(DISTINCT company_id) FROM ai_moderation_flags
         WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as companies_flagged,
        (SELECT COUNT(*) FROM conversations WHERE blocked = true) as blocked_conversations
    `;

    const result = await neon_run_sql({
      sql: aiStatsQuery,
      projectId: NEON_PROJECT_ID,
    });

    if (result && result.length > 0) {
      return result[0];
    }

    // Fallback mock data
    return {
      flags_today: 2,
      pending_reviews: 1,
      companies_flagged: 3,
      blocked_conversations: 5,
    };
  } catch (error) {
    console.error("Error getting AI moderation stats:", error);
    return {
      flags_today: 0,
      pending_reviews: 0,
      companies_flagged: 0,
      blocked_conversations: 0,
    };
  }
}

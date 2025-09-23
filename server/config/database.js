const { Pool } = require("pg");

// Neon PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  query_timeout: 60000, // Return an error after 60 seconds if query could not be completed
});

// Test connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to Neon PostgreSQL database");
    console.log("📊 Database host:", client.host || "localhost");
    console.log("🗄️ Database name:", client.database || "neondb");
    client.release();
    return true;
  } catch (err) {
    console.error("❌ Error connecting to Neon database:", err.message);
    console.error("🔧 Please check your DATABASE_URL environment variable");
    return false;
  }
};

// Enhanced query helper function with error handling and logging
const neonQuery = async (text, params = []) => {
  const start = Date.now();
  const client = await pool.connect();

  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;

    // Log query performance (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Database Query:", {
        query: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
    }

    return res.rows;
  } catch (error) {
    console.error("❌ Database query error:", {
      error: error.message,
      query: text.substring(0, 100),
      params: params,
    });
    throw error;
  } finally {
    client.release();
  }
};

// Transaction helper for multiple queries
const neonTransaction = async (queries) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const results = [];
    for (const { text, params = [] } of queries) {
      const result = await client.query(text, params);
      results.push(result.rows);
    }

    await client.query("COMMIT");
    console.log("✅ Transaction completed successfully");
    return results;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed, rolled back:", error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Database health check
const getDatabaseHealth = async () => {
  try {
    const start = Date.now();
    const result = await neonQuery(
      "SELECT NOW() as current_time, version() as version",
    );
    const responseTime = Date.now() - start;

    return {
      status: "healthy",
      responseTime: `${responseTime}ms`,
      timestamp: result[0].current_time,
      version: result[0].version,
      connectionCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Initialize database tables if they don't exist
const initializeTables = async () => {
  try {
    console.log("🔧 Initializing database tables...");

    // Create AI moderation tables
    await neonQuery(`
      CREATE TABLE IF NOT EXISTS ai_moderation_flags (
        id SERIAL PRIMARY KEY,
        message_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        flag_type VARCHAR(50) NOT NULL,
        confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
        detected_content JSONB NOT NULL,
        action_taken VARCHAR(20) NOT NULL DEFAULT 'flagged',
        company_id TEXT,
        candidate_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await neonQuery(`
      CREATE TABLE IF NOT EXISTS moderation_queue (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        data JSONB,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        assigned_admin_id INTEGER,
        resolved_by_admin_id INTEGER,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolution_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await neonQuery(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id TEXT,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await neonQuery(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'info',
        action_url TEXT,
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Add AI moderation columns to existing tables if they don't exist
    await neonQuery(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS flagged_by_ai BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS blocked_by_ai BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2),
      ADD COLUMN IF NOT EXISTS contains_contact_info BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS original_content TEXT
    `);

    await neonQuery(`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
      ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS flagged_for_review BOOLEAN DEFAULT FALSE
    `);

    // Create indexes for performance
    await neonQuery(`
      CREATE INDEX IF NOT EXISTS idx_ai_moderation_flags_conversation_id ON ai_moderation_flags(conversation_id)
    `);
    await neonQuery(`
      CREATE INDEX IF NOT EXISTS idx_ai_moderation_flags_created_at ON ai_moderation_flags(created_at)
    `);
    await neonQuery(`
      CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status)
    `);
    await neonQuery(`
      CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority)
    `);
    await neonQuery(`
      CREATE INDEX IF NOT EXISTS idx_messages_flagged_by_ai ON messages(flagged_by_ai)
    `);
    await neonQuery(`
      CREATE INDEX IF NOT EXISTS idx_conversations_blocked ON conversations(blocked)
    `);
    await neonQuery(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `);
    await neonQuery(`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
    `);

    console.log("✅ Database tables initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database tables:", error);
    throw error;
  }
};

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Shutting down database pool...");
  pool.end(() => {
    console.log("✅ Database pool has ended");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("🛑 Shutting down database pool...");
  pool.end(() => {
    console.log("✅ Database pool has ended");
    process.exit(0);
  });
});

module.exports = {
  pool,
  neonQuery,
  neonTransaction,
  testConnection,
  getDatabaseHealth,
  initializeTables,
};

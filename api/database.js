// Database connection and utilities for Neon PostgreSQL
import { Pool } from 'pg';

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  throw new Error('Database configuration error: DATABASE_URL is required');
}

console.log('🔗 Connecting to database:', process.env.DATABASE_URL.replace(/:[^@]*@/, ':***@'));

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    const client = await pool.connect();

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'candidate',
        profile JSONB NOT NULL DEFAULT '{}',
        is_email_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE
      )
    `);

    console.log('✅ Database tables initialized');
    client.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

// User database operations
async function createUser(userData) {
  const { email, passwordHash, role, profile } = userData;

  try {
    const client = await pool.connect();

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      client.release();
      throw new Error('User already exists');
    }

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role, profile)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, profile, is_email_verified, created_at`,
      [email.toLowerCase(), passwordHash, role, JSON.stringify(profile)]
    );

    client.release();
    return result.rows[0];
  } catch (error) {
    console.error('❌ Create user failed:', error.message);
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    const client = await pool.connect();

    const result = await client.query(
      `SELECT id, email, password_hash, role, profile, is_email_verified,
              is_active, created_at, last_login
       FROM users
       WHERE email = $1 AND is_active = TRUE`,
      [email.toLowerCase()]
    );

    client.release();
    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Get user by email failed:', error.message);
    throw error;
  }
}

async function updateUserLastLogin(userId) {
  try {
    const client = await pool.connect();

    await client.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userId]
    );

    client.release();
  } catch (error) {
    console.error('❌ Update last login failed:', error.message);
    // Don't throw error for this non-critical operation
  }
}

export {
  pool,
  testConnection,
  initializeDatabase,
  createUser,
  getUserByEmail,
  updateUserLastLogin
};
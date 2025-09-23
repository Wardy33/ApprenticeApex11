import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log("🚀 Starting payment tables migration...");

  try {
    // Get database connection string
    const DATABASE_URL =
      process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

    if (!DATABASE_URL) {
      throw new Error(
        "DATABASE_URL or NEON_DATABASE_URL environment variable is required",
      );
    }

    console.log("🔗 Connecting to Neon database...");
    const { Client } = pg;
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, "create-payment-tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Executing payment tables migration...");

    // Execute the migration
    await client.query(migrationSQL);

    console.log("✅ Payment tables migration completed successfully!");

    // Verify the tables were created
    console.log("🔍 Verifying payment tables...");

    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('payments', 'subscriptions', 'job_payments', 'success_fees', 'payment_packages', 'billing_events')
      ORDER BY table_name
    `);

    console.log("📊 Payment tables found:");
    result.rows.forEach((row) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check if default payment packages were inserted
    const packagesResult = await client.query(
      "SELECT COUNT(*) as count FROM payment_packages",
    );
    console.log(
      `📦 Payment packages in database: ${packagesResult.rows[0].count}`,
    );

    await client.end();
    console.log("🎉 Payment system database setup complete!");
  } catch (error) {
    console.error("❌ Payment migration failed:", error);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log("✨ Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });

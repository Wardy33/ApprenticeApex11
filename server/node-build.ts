import { createServer, connectToDatabase, config } from "./index";
import { database } from "./config/database.js";
import express from "express";
import path from "path";
import http from "http";

async function startServer() {
  try {
    // Connect to production database
    console.log("🔄 Initializing database connection...");
    const dbConnected = await connectToDatabase();

    if (!dbConnected && config.nodeEnv === "production") {
      console.error("❌ Failed to connect to database in production");
      process.exit(1);
    }

    if (dbConnected) {
      console.log("✅ Database connection established successfully");
    }

    const app = createServer();

    // In production, serve the built SPA files
    const __dirname = import.meta.dirname;
    const distPath = path.join(__dirname, "../spa");

    // Serve static files
    app.use(express.static(distPath));

    // Handle React Router - serve index.html for all non-API routes
    app.get("*", (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }

      res.sendFile(path.join(distPath, "index.html"));
    });

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Graceful shutdown with database cleanup
    const gracefulShutdown = async (signal: string) => {
      console.log(`🛑 ${signal} received, shutting down gracefully`);

      try {
        // Close HTTP server
        await new Promise<void>((resolve, reject) => {
          httpServer.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Close database connection
        await database.gracefulShutdown();

        console.log("✅ Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during graceful shutdown:", error);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", async (error) => {
      console.error("❌ Uncaught Exception:", error);
      await gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", async (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      await gracefulShutdown("UNHANDLED_REJECTION");
    });

    httpServer.listen(config.port, () => {
      console.log(`🚀 ApprenticeApex server running on port ${config.port}`);
      console.log(`📱 Frontend: http://localhost:${config.port}`);
      console.log(`🔧 API: http://localhost:${config.port}/api`);
      console.log(
        `🏥 Health Check: http://localhost:${config.port}/api/health`,
      );
      console.log(
        `🗄️ Database Health: http://localhost:${config.port}/api/health/database`,
      );
      console.log(`🌐 HTTP server initialized`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);

      // Log database status
      const dbStatus = database.getHealthStatus();
      console.log(`🗄️ Database Status: ${dbStatus.status}`);

      if (dbStatus.poolSize && dbStatus.poolSize > 0) {
        console.log(
          `🏊 Connection Pool: ${dbStatus.availableConnections}/${dbStatus.poolSize} available`,
        );
      }

      if (config.mongoUri) {
        console.log(`🗄️ Database: Production MongoDB`);
      } else {
        console.log(`📝 Database: Development mode (mock data fallback)`);
      }

      console.log("🎯 Server startup completed successfully!");
    });

    // Server is ready for connections

    // Log server readiness
    console.log("🎉 ApprenticeApex server is ready to handle requests!");
  } catch (error) {
    console.error("❌ Failed to start server:", error);

    // Attempt database cleanup on startup failure
    try {
      await database.gracefulShutdown();
    } catch (cleanupError) {
      console.error("❌ Error during cleanup:", cleanupError);
    }

    process.exit(1);
  }
}

startServer();

// Vercel serverless function for API routes
const express = require('express');
const serverless = require('serverless-http');

// Import your existing server setup
let app;

try {
  // Try to import the production server
  const serverModule = require('../server/production.js');
  app = serverModule.app || serverModule;
} catch (error) {
  console.log('Production server not found, creating basic Express app');

  // Fallback basic Express app
  app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic health check
  app.get('/api/ping', (req, res) => {
    res.json({
      success: true,
      message: 'ApprenticeApex API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Handle all other API routes
  app.all('/api/*', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'API temporarily unavailable',
      message: 'Server configuration in progress'
    });
  });
}

// Export the serverless handler
module.exports = serverless(app);
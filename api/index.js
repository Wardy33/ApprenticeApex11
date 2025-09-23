// Simple Vercel serverless function
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Basic API routing
  if (req.url === '/api/ping' || req.url === '/ping') {
    return res.status(200).json({
      success: true,
      message: 'ApprenticeApex API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      method: req.method,
      url: req.url
    });
  }

  // Health check endpoint
  if (req.url === '/api/health' || req.url === '/health') {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    });
  }

  // Default response for unhandled API routes
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: 'The requested API endpoint is not available',
    availableEndpoints: ['/api/ping', '/api/health']
  });
}
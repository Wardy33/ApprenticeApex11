// ApprenticeApex Vercel Serverless API
export default async function handler(req, res) {
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

  // Parse URL path for routing
  const url = req.url || '';
  const path = url.replace('/api', '');

  console.log(`[${req.method}] ${url} - Request received`);

  try {
    // Authentication endpoints
    if (path === '/auth/register' && req.method === 'POST') {
      return await handleUserRegistration(req, res);
    }

    if (path === '/auth/register/company' && req.method === 'POST') {
      return await handleCompanyRegistration(req, res);
    }

    if (path === '/auth/login' && req.method === 'POST') {
      return await handleUserLogin(req, res);
    }

    if (path === '/auth/company/signin' && req.method === 'POST') {
      return await handleCompanySignin(req, res);
    }

    if (path === '/auth/test' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Auth routes are working',
        timestamp: new Date().toISOString(),
        availableEndpoints: [
          'POST /api/auth/register',
          'POST /api/auth/register/company',
          'POST /api/auth/login',
          'POST /api/auth/company/signin',
          'GET /api/auth/test'
        ]
      });
    }

    // Health check endpoints
    if (path === '/ping' || path === '/health') {
      return res.status(200).json({
        success: true,
        status: 'healthy',
        message: 'ApprenticeApex API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        version: '1.0.0'
      });
    }

    // Default 404 response
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      message: 'The requested API endpoint is not available',
      requestedPath: path,
      method: req.method,
      availableEndpoints: [
        'POST /api/auth/register',
        'POST /api/auth/register/company',
        'POST /api/auth/login',
        'POST /api/auth/company/signin',
        'GET /api/auth/test',
        'GET /api/ping',
        'GET /api/health'
      ]
    });

  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}

// JWT generation function with proper signing
function generateMockJWT(userId, role, email) {
  const crypto = require('crypto');

  // Use environment variable for JWT secret or fallback to a secure default
  const JWT_SECRET = process.env.JWT_SECRET || 'apprenticeapex-secure-secret-key-2024-production-ready';

  // Create header and payload
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    userId,
    role,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  })).toString('base64url');

  // Create signature using HMAC SHA256
  const data = `${header}.${payload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

// User registration handler
async function handleUserRegistration(req, res) {
  try {
    console.log('User registration request:', req.body);

    const { email, password, role, profile } = req.body;

    // Validation
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and role are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // For now, we'll create a mock user since we don't have database connection
    const mockUserId = 'user_' + Date.now();
    const mockToken = generateMockJWT(mockUserId, role, email);

    const defaultProfile = role === 'candidate' ? {
      firstName: 'New',
      lastName: 'User',
      skills: [],
      hasDriversLicense: false,
      education: [],
      experience: [],
      location: { city: 'Unknown', postcode: '', coordinates: [0, 0] },
      preferences: {
        industries: [],
        maxDistance: 25,
        salaryRange: { min: 0, max: 100000 }
      },
      transportModes: [],
      isActive: true
    } : {
      companyName: profile?.companyName || 'New Company',
      industry: profile?.industry || 'Technology',
      description: profile?.description || 'A company',
      location: {
        city: 'Unknown',
        address: 'Unknown',
        coordinates: [0, 0]
      },
      contactPerson: {
        firstName: 'Contact',
        lastName: 'Person',
        position: 'Manager'
      },
      isVerified: false
    };

    return res.status(201).json({
      success: true,
      data: {
        user: {
          _id: mockUserId,
          email: email.toLowerCase(),
          role,
          profile: profile || defaultProfile,
          isEmailVerified: false,
          createdAt: new Date()
        },
        token: mockToken
      },
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('User registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
}

// Company registration handler
async function handleCompanyRegistration(req, res) {
  try {
    console.log('Company registration request:', req.body);

    const { email, password, companyName, firstName, lastName, industry, companySize, website, description, address, city, postcode, position } = req.body;

    // Validation
    if (!email || !password || !companyName || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing',
        details: 'Email, password, company name, first name, and last name are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    const mockUserId = 'company_' + Date.now();
    const mockToken = generateMockJWT(mockUserId, 'company', email);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          _id: mockUserId,
          email: email.toLowerCase(),
          role: 'company',
          profile: {
            companyName,
            industry: industry || 'Technology',
            companySize,
            website: website || '',
            description: description || '',
            location: {
              city: city || 'Unknown',
              address: address || '',
              postcode: postcode || '',
              coordinates: [0, 0]
            },
            contactPerson: {
              firstName,
              lastName,
              position: position || 'Manager'
            },
            isVerified: false
          },
          isEmailVerified: false,
          isActive: true,
          createdAt: new Date()
        },
        token: mockToken
      },
      message: 'Company registration successful'
    });

  } catch (error) {
    console.error('Company registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Company registration failed',
      details: error.message
    });
  }
}

// User login handler
async function handleUserLogin(req, res) {
  try {
    console.log('User login request:', req.body);

    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Determine the user role (default to candidate for backward compatibility)
    const userRole = role || 'candidate';
    const mockUserId = `${userRole}_login_` + Date.now();
    const mockToken = generateMockJWT(mockUserId, userRole, email);

    // Create appropriate profile based on role
    const profile = userRole === 'company' ? {
      companyName: 'Demo Company',
      industry: 'Technology',
      contactPerson: {
        firstName: 'Demo',
        lastName: 'Manager'
      },
      isVerified: false
    } : {
      firstName: 'Demo',
      lastName: 'User',
      skills: [],
      hasDriversLicense: false,
      education: [],
      experience: []
    };

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: mockUserId,
          email: email.toLowerCase(),
          role: userRole,
          profile: profile,
          isEmailVerified: true,
          lastLogin: new Date(),
          createdAt: new Date()
        },
        token: mockToken
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('User login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
}

// Company signin handler
async function handleCompanySignin(req, res) {
  try {
    console.log('Company signin request:', req.body);

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // For demo purposes, accept any valid email/password combination
    const mockUserId = 'company_login_' + Date.now();
    const mockToken = generateMockJWT(mockUserId, 'company', email);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: mockUserId,
          email: email.toLowerCase(),
          role: 'company',
          profile: {
            companyName: 'Demo Company',
            industry: 'Technology',
            contactPerson: {
              firstName: 'Demo',
              lastName: 'Manager'
            },
            isVerified: false
          },
          isEmailVerified: true,
          lastLogin: new Date(),
          createdAt: new Date()
        },
        token: mockToken
      },
      message: 'Company login successful'
    });

  } catch (error) {
    console.error('Company signin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Company signin failed',
      details: error.message
    });
  }
}
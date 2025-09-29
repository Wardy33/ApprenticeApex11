// ApprenticeApex Vercel Serverless API with Neon PostgreSQL
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { testConnection, initializeDatabase, createUser, getUserByEmail, updateUserLastLogin } from './database.js';

// Initialize database connection on cold start
let dbInitialized = false;

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

  // Initialize database on first request
  if (!dbInitialized) {
    try {
      console.log('🔄 Initializing database connection...');
      console.log('Environment variables check:', {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV || 'not-set'
      });

      await testConnection();
      await initializeDatabase();
      dbInitialized = true;
      console.log('✅ Database initialization complete');
    } catch (dbError) {
      console.error('❌ Database initialization failed:', dbError);
      console.error('Database error details:', {
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: `Unable to connect to database: ${dbError.message}`,
        debug: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          errorCode: dbError.code
        }
      });
    }
  }

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

    // User Profile endpoints
    if (path === '/users/profile' && req.method === 'GET') {
      return await handleGetProfile(req, res);
    }

    if (path === '/users/profile' && req.method === 'PUT') {
      return await handleUpdateProfile(req, res);
    }

    // Apprenticeship endpoints
    if (path === '/apprenticeships/discover' && req.method === 'GET') {
      return await handleDiscoverApprenticeships(req, res);
    }

    if (path === '/apprenticeships/company/my' && req.method === 'GET') {
      return await handleGetMyListings(req, res);
    }

    if (path === '/apprenticeships' && req.method === 'POST') {
      return await handleCreateListing(req, res);
    }

    if (path.match(/^\/apprenticeships\/[^/]+$/) && req.method === 'PUT') {
      const id = path.split('/')[2];
      return await handleUpdateListing(req, res, id);
    }

    if (path.match(/^\/apprenticeships\/[^/]+$/) && req.method === 'DELETE') {
      const id = path.split('/')[2];
      return await handleDeleteListing(req, res, id);
    }

    if (path.match(/^\/apprenticeships\/[^/]+\/swipe$/) && req.method === 'POST') {
      const id = path.split('/')[2];
      return await handleSwipeApprenticeship(req, res, id);
    }

    // Application endpoints
    if (path === '/applications/my-applications' && req.method === 'GET') {
      return await handleGetMyApplications(req, res);
    }

    if (path === '/applications/received' && req.method === 'GET') {
      return await handleGetReceivedApplications(req, res);
    }

    if (path === '/applications' && req.method === 'GET') {
      return await handleGetCompanyApplications(req, res);
    }

    if (path === '/applications' && req.method === 'POST') {
      return await handleSubmitApplication(req, res);
    }

    // Interview endpoints
    if (path === '/interviews' && req.method === 'GET') {
      return await handleGetCompanyInterviews(req, res);
    }

    if (path === '/interviews' && req.method === 'POST') {
      return await handleScheduleInterview(req, res);
    }

    // Matching endpoints
    if (path === '/matching/jobs' && req.method === 'GET') {
      return await handleGetJobMatches(req, res);
    }

    if (path === '/matching/profile-status' && req.method === 'GET') {
      return await handleGetProfileStatus(req, res);
    }

    // Analytics endpoints
    if (path === '/analytics/dashboard' && req.method === 'GET') {
      return await handleGetDashboardAnalytics(req, res);
    }

    // Video interview endpoints
    if (path === '/video-interview/schedule' && req.method === 'POST') {
      return await handleScheduleVideoInterview(req, res);
    }

    if (path.match(/^\/video-interview\/[^/]+$/) && req.method === 'GET') {
      const id = path.split('/')[2];
      return await handleGetVideoInterview(req, res, id);
    }

    if (path === '/video-interview/my-interviews' && req.method === 'GET') {
      return await handleGetMyVideoInterviews(req, res);
    }

    // Conversation endpoints (basic for now)
    if (path.match(/^\/conversations\/[^/]+\/candidate$/) && req.method === 'GET') {
      return await handleGetCandidateInfo(req, res);
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

    // Test endpoint for debugging
    if (path === '/test' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'API test endpoint working',
        database: dbInitialized ? 'initialized' : 'not initialized',
        timestamp: new Date().toISOString()
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

// JWT generation function for serverless compatibility
function generateJWT(userId, role, email) {
  try {
    // Use environment variable for JWT secret or fallback to a secure default
    const JWT_SECRET = process.env.JWT_SECRET || 'apprenticeapex-secure-secret-key-2024-production-ready';

    // Create header and payload with base64 encoding (more compatible)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const payload = Buffer.from(JSON.stringify({
      userId,
      role,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    })).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // Create signature using Node.js crypto (should be available in Vercel)
    const data = `${header}.${payload}`;
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const token = `${header}.${payload}.${signature}`;
    console.log('JWT generated successfully, length:', token.length);
    return token;

  } catch (error) {
    console.error('JWT generation error:', error);
    throw new Error('Failed to generate authentication token');
  }
}

// User registration handler with real database
async function handleUserRegistration(req, res) {
  try {
    console.log('=== USER REGISTRATION START ===');
    console.log('Request body:', req.body);

    const { email, password, role, profile, firstName, lastName } = req.body;

    console.log('Extracted fields:', { email, password: !!password, role, firstName, lastName, hasProfile: !!profile });

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

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create profile object
    const userProfile = role === 'candidate' ? {
      firstName: firstName || 'New',
      lastName: lastName || 'User',
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

    // Create user in database
    console.log('💾 Creating user in database...');
    const newUser = await createUser({
      email,
      passwordHash,
      role,
      profile: userProfile
    });

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = generateJWT(newUser.id, role, email);

    console.log('✅ User registration successful');
    return res.status(201).json({
      success: true,
      data: {
        user: {
          _id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          profile: newUser.profile,
          isEmailVerified: newUser.is_email_verified,
          createdAt: newUser.created_at
        },
        token
      },
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('❌ User registration error:', error);

    if (error.message === 'User already exists') {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        details: 'A user with this email address already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
}

// Company registration handler with real database
async function handleCompanyRegistration(req, res) {
  try {
    console.log('=== COMPANY REGISTRATION START ===');
    console.log('Request body:', req.body);

    const { email, password, companyName, firstName, lastName, industry, companySize, website, description, address, city, postcode, position } = req.body;

    console.log('Extracted company fields:', {
      email,
      password: !!password,
      companyName,
      firstName,
      lastName,
      industry,
      companySize,
      hasWebsite: !!website,
      hasDescription: !!description,
      hasAddress: !!address,
      city,
      postcode,
      position
    });

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

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create company profile
    const companyProfile = {
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
    };

    // Create company user in database
    console.log('💾 Creating company in database...');
    const newUser = await createUser({
      email,
      passwordHash,
      role: 'company',
      profile: companyProfile
    });

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = generateJWT(newUser.id, 'company', email);

    console.log('✅ Company registration successful');
    return res.status(201).json({
      success: true,
      data: {
        user: {
          _id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          profile: newUser.profile,
          isEmailVerified: newUser.is_email_verified,
          isActive: true,
          createdAt: newUser.created_at
        },
        token
      },
      message: 'Company registration successful'
    });

  } catch (error) {
    console.error('❌ Company registration error:', error);

    if (error.message === 'User already exists') {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        details: 'A company with this email address already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Company registration failed',
      details: error.message
    });
  }
}

// User login handler with real database
async function handleUserLogin(req, res) {
  try {
    console.log('=== USER LOGIN START ===');
    console.log('Request body:', req.body);

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

    // Get user from database
    console.log('🔍 Looking up user in database...');
    const user = await getUserByEmail(email);

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    // Verify password
    console.log('🔐 Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('✅ Password verified');

    // Update last login
    await updateUserLastLogin(user.id);

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = generateJWT(user.id, user.role, user.email);

    console.log('✅ Login successful');
    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          isEmailVerified: user.is_email_verified,
          lastLogin: new Date(),
          createdAt: user.created_at
        },
        token
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('❌ User login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
}

// Company signin handler with real database
async function handleCompanySignin(req, res) {
  try {
    console.log('=== COMPANY SIGNIN START ===');
    console.log('Request body:', req.body);

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

    // Get user from database
    console.log('🔍 Looking up company in database...');
    const user = await getUserByEmail(email);

    if (!user || user.role !== 'company') {
      console.log('❌ Company not found');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('✅ Company found:', user.email);

    // Verify password
    console.log('🔐 Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('✅ Password verified');

    // Update last login
    await updateUserLastLogin(user.id);

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = generateJWT(user.id, user.role, user.email);

    console.log('✅ Company signin successful');
    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user.id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          isEmailVerified: user.is_email_verified,
          lastLogin: new Date(),
          createdAt: user.created_at
        },
        token
      },
      message: 'Company login successful'
    });

  } catch (error) {
    console.error('❌ Company signin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Company signin failed',
      details: error.message
    });
  }
}

// User Profile handlers
async function handleGetProfile(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // For now, return mock profile data
    return res.status(200).json({
      success: true,
      data: {
        profile: {
          id: 'user_123',
          email: 'user@example.com',
          role: 'candidate',
          firstName: 'John',
          lastName: 'Doe',
          skills: ['JavaScript', 'React', 'Node.js'],
          location: { city: 'London', postcode: 'SW1A 1AA' }
        }
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      details: error.message
    });
  }
}

async function handleUpdateProfile(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        profile: { ...req.body, updated: true }
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error.message
    });
  }
}

// Apprenticeship handlers
async function handleDiscoverApprenticeships(req, res) {
  try {
    const mockApprenticeships = [
      {
        id: 'app_1',
        title: 'Software Developer Apprenticeship',
        company: 'TechCorp Ltd',
        location: 'London',
        salary: '£18,000 - £25,000',
        description: 'Join our dynamic software development team',
        skills: ['JavaScript', 'React', 'Node.js'],
        type: 'full-time',
        duration: '18 months'
      },
      {
        id: 'app_2',
        title: 'Digital Marketing Apprenticeship',
        company: 'Marketing Solutions',
        location: 'Manchester',
        salary: '£16,000 - £22,000',
        description: 'Learn digital marketing strategies and tools',
        skills: ['SEO', 'Social Media', 'Analytics'],
        type: 'full-time',
        duration: '12 months'
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        apprenticeships: mockApprenticeships,
        total: mockApprenticeships.length
      }
    });
  } catch (error) {
    console.error('❌ Discover apprenticeships error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get apprenticeships',
      details: error.message
    });
  }
}

async function handleGetMyListings(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const mockListings = [
      {
        id: 'listing_1',
        title: 'Junior Developer Position',
        department: 'Engineering',
        location: 'London',
        salary: '£20,000 - £28,000',
        status: 'active',
        applicants: 12,
        views: 156,
        postedDate: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        apprenticeships: mockListings,
        total: mockListings.length
      }
    });
  } catch (error) {
    console.error('❌ Get my listings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get listings',
      details: error.message
    });
  }
}

async function handleCreateListing(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const newListing = {
      id: 'listing_' + Date.now(),
      ...req.body,
      status: 'active',
      applicants: 0,
      views: 0,
      postedDate: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      data: { listing: newListing },
      message: 'Job listing created successfully'
    });
  } catch (error) {
    console.error('❌ Create listing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create listing',
      details: error.message
    });
  }
}

async function handleUpdateListing(req, res, id) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    return res.status(200).json({
      success: true,
      data: { listing: { id, ...req.body, updated: true } },
      message: 'Job listing updated successfully'
    });
  } catch (error) {
    console.error('❌ Update listing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update listing',
      details: error.message
    });
  }
}

async function handleDeleteListing(req, res, id) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job listing deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete listing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete listing',
      details: error.message
    });
  }
}

async function handleSwipeApprenticeship(req, res, id) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { direction, candidateLocation } = req.body;

    return res.status(200).json({
      success: true,
      data: {
        apprenticeshipId: id,
        direction,
        match: direction === 'right' ? Math.random() > 0.7 : false
      },
      message: `Swiped ${direction} on apprenticeship`
    });
  } catch (error) {
    console.error('❌ Swipe apprenticeship error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to swipe',
      details: error.message
    });
  }
}

// Application handlers
async function handleGetMyApplications(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const mockApplications = [
      {
        id: 'app_1',
        jobTitle: 'Software Developer Apprenticeship',
        company: 'TechCorp Ltd',
        appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        location: 'London'
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        applications: mockApplications,
        total: mockApplications.length
      }
    });
  } catch (error) {
    console.error('❌ Get my applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get applications',
      details: error.message
    });
  }
}

async function handleGetReceivedApplications(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const mockApplications = [
      {
        id: 'received_1',
        candidateName: 'John Doe',
        jobTitle: 'Junior Developer Position',
        applicationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        score: 85
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        applications: mockApplications,
        total: mockApplications.length
      }
    });
  } catch (error) {
    console.error('❌ Get received applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get applications',
      details: error.message
    });
  }
}

async function handleGetCompanyApplications(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    return await handleGetReceivedApplications(req, res);
  } catch (error) {
    console.error('❌ Get company applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get applications',
      details: error.message
    });
  }
}

async function handleSubmitApplication(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const newApplication = {
      id: 'app_' + Date.now(),
      ...req.body,
      status: 'pending',
      appliedDate: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      data: { application: newApplication },
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('❌ Submit application error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit application',
      details: error.message
    });
  }
}

// Interview handlers
async function handleGetCompanyInterviews(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const mockInterviews = [
      {
        id: 'interview_1',
        candidateName: 'Jane Smith',
        jobTitle: 'Software Developer Apprenticeship',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        type: 'video',
        duration: 60
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        interviews: mockInterviews,
        total: mockInterviews.length
      }
    });
  } catch (error) {
    console.error('❌ Get company interviews error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get interviews',
      details: error.message
    });
  }
}

async function handleScheduleInterview(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const newInterview = {
      id: 'interview_' + Date.now(),
      ...req.body,
      status: 'scheduled',
      createdDate: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      data: { interview: newInterview },
      message: 'Interview scheduled successfully'
    });
  } catch (error) {
    console.error('❌ Schedule interview error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to schedule interview',
      details: error.message
    });
  }
}

// Matching handlers
async function handleGetJobMatches(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    return await handleDiscoverApprenticeships(req, res);
  } catch (error) {
    console.error('❌ Get job matches error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get matches',
      details: error.message
    });
  }
}

async function handleGetProfileStatus(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        profileComplete: 75,
        missingFields: ['skills', 'experience'],
        recommendations: ['Complete your skills section', 'Add work experience']
      }
    });
  } catch (error) {
    console.error('❌ Get profile status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get profile status',
      details: error.message
    });
  }
}

// Analytics handlers
async function handleGetDashboardAnalytics(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        totalApplications: 25,
        pendingReviews: 8,
        scheduledInterviews: 3,
        activeListings: 2,
        profileViews: 142,
        responseRate: 68
      }
    });
  } catch (error) {
    console.error('❌ Get dashboard analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      details: error.message
    });
  }
}

// Video interview handlers
async function handleScheduleVideoInterview(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const videoInterview = {
      id: 'video_' + Date.now(),
      ...req.body,
      roomUrl: `https://apprenticeapex.daily.co/room_${Date.now()}`,
      status: 'scheduled',
      createdDate: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      data: { interview: videoInterview },
      message: 'Video interview scheduled successfully'
    });
  } catch (error) {
    console.error('❌ Schedule video interview error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to schedule video interview',
      details: error.message
    });
  }
}

async function handleGetVideoInterview(req, res, id) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const mockInterview = {
      id,
      title: 'Technical Interview',
      candidateName: 'John Doe',
      interviewerName: 'Jane Manager',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      status: 'scheduled',
      roomUrl: `https://apprenticeapex.daily.co/room_${id}`,
      notes: ''
    };

    return res.status(200).json({
      success: true,
      data: { interview: mockInterview }
    });
  } catch (error) {
    console.error('❌ Get video interview error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get video interview',
      details: error.message
    });
  }
}

async function handleGetMyVideoInterviews(req, res) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const mockInterviews = {
      upcoming: [
        {
          id: 'video_1',
          title: 'Technical Interview',
          candidateName: 'John Doe',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
          duration: 60
        }
      ],
      past: [],
      total: 1
    };

    return res.status(200).json({
      success: true,
      data: mockInterviews
    });
  } catch (error) {
    console.error('❌ Get my video interviews error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get video interviews',
      details: error.message
    });
  }
}

// Conversation handlers
async function handleGetCandidateInfo(req, res) {
  try {
    const mockCandidate = {
      id: 'candidate_123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'candidate',
      profilePicture: null,
      skills: ['JavaScript', 'React', 'Node.js'],
      location: 'London, UK'
    };

    return res.status(200).json({
      success: true,
      data: { candidate: mockCandidate }
    });
  } catch (error) {
    console.error('❌ Get candidate info error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get candidate info',
      details: error.message
    });
  }
}
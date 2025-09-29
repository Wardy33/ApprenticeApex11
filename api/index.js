// ApprenticeApex Vercel Serverless API with Neon PostgreSQL
const bcrypt = require('bcryptjs');
const { testConnection, initializeDatabase, createUser, getUserByEmail, updateUserLastLogin } = require('./database');

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
    const crypto = require('crypto');
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
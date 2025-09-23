import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess, sendError } from '../utils/apiResponse';
// Note: validateDatabaseInput middleware not implemented in Neon setup
// import { validateDatabaseInput } from '../middleware/database';

// Simple mock implementation for validateDatabaseInput
const validateDatabaseInput = (collectionName: string) => {
  return (req: any, res: any, next: any) => {
    // Mock validation - in a real implementation, this would validate the input
    // against the specified collection's schema
    console.log(`🔍 Mock database input validation for collection: ${collectionName}`);
    next();
  };
};

// Import schemas
import { User } from '../models/User';
import { Apprenticeship } from '../models/Apprenticeship';
import { Application } from '../models/Application';
import { Payment } from '../models/Payment';

const router = express.Router();

// Test User Creation Endpoint
router.post('/user', validateDatabaseInput('users'), asyncHandler(async (req, res) => {
  console.log('🧪 Testing user creation with provided data...');
  
  try {
    const userData = req.body;
    
    // Add default profile structure if not provided
    const userPayload = {
      email: userData.email,
      password: userData.password,
      role: userData.userType || userData.role || 'student',
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        bio: userData.bio || 'Test user created via API',
        skills: userData.skills || ['API Testing'],
        hasDriversLicense: userData.hasDriversLicense || false,
        location: {
          city: userData.city || 'London',
          postcode: userData.postcode || 'SW1A 1AA',
          coordinates: userData.coordinates || [-0.1276, 51.5074],
          country: 'United Kingdom'
        },
        preferences: {
          industries: userData.industries || ['Technology'],
          maxDistance: userData.maxDistance || 25,
          salaryRange: {
            min: userData.salaryMin || 18000,
            max: userData.salaryMax || 25000,
            currency: 'GBP'
          },
          workTypes: userData.workTypes || ['full-time'],
          willingToRelocate: userData.willingToRelocate || false
        },
        transportModes: userData.transportModes || ['Public Transport'],
        isProfilePublic: true,
        seekingOpportunities: true
      },
      isEmailVerified: false
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: userPayload.email });
    if (existingUser) {
      return sendError(res, 'User with this email already exists', 400, 'USER_EXISTS');
    }

    // Create the user
    const startTime = Date.now();
    const newUser = new User(userPayload);
    const savedUser = await newUser.save();
    const duration = Date.now() - startTime;

    console.log(`✅ Test user created successfully: ${savedUser.email} (${duration}ms)`);

    sendSuccess(res, {
      message: 'Test user created successfully',
      user: {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        profile: {
          firstName: savedUser.profile.firstName,
          lastName: savedUser.profile.lastName,
          location: savedUser.profile.location
        },
        isEmailVerified: savedUser.isEmailVerified,
        createdAt: savedUser.createdAt
      },
      performance: {
        duration: `${duration}ms`,
        operation: 'user_creation'
      }
    }, 201);

  } catch (error: any) {
    console.error('❌ Test user creation failed:', error);
    
    if (error.name === 'ValidationError') {
      return sendError(res, 'User validation failed', 400, 'VALIDATION_ERROR', {
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    if (error.code === 11000) {
      return sendError(res, 'User with this email already exists', 400, 'DUPLICATE_EMAIL');
    }
    
    return sendError(res, 'Failed to create test user', 500, 'USER_CREATION_ERROR');
  }
}));

// Test Job Search Endpoint
router.get('/search', asyncHandler(async (req, res) => {
  console.log('🧪 Testing job search functionality...');
  
  try {
    const { location, industry, skills, salary, level, remote } = req.query;
    
    const startTime = Date.now();
    
    // Build search query
    const searchQuery: any = {
      isActive: true,
      status: 'active',
      moderationStatus: 'approved'
    };

    if (location) {
      // For location search, we can use text search or city match
      if (typeof location === 'string') {
        searchQuery['location.city'] = new RegExp(location, 'i');
      }
    }

    if (industry) {
      searchQuery.industry = new RegExp(industry as string, 'i');
    }

    if (level) {
      searchQuery.apprenticeshipLevel = level;
    }

    if (remote === 'true') {
      searchQuery.isRemote = true;
    }

    // Execute search
    let query = Apprenticeship.find(searchQuery);
    
    // Add salary filter if provided
    if (salary) {
      const salaryNum = parseInt(salary as string);
      query = query.where('salary.min').lte(salaryNum).where('salary.max').gte(salaryNum);
    }

    // Execute query with pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      Apprenticeship.countDocuments(searchQuery)
    ]);

    const duration = Date.now() - startTime;

    console.log(`✅ Job search completed: ${results.length} results found (${duration}ms)`);

    sendSuccess(res, {
      message: 'Job search completed successfully',
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      searchCriteria: {
        location,
        industry,
        skills,
        salary,
        level,
        remote
      },
      performance: {
        duration: `${duration}ms`,
        resultsCount: results.length,
        operation: 'job_search'
      }
    });

  } catch (error: any) {
    console.error('❌ Job search test failed:', error);
    return sendError(res, 'Job search failed', 500, 'SEARCH_ERROR');
  }
}));

// Test Application Creation Endpoint
router.post('/application', validateDatabaseInput('applications'), asyncHandler(async (req, res) => {
  console.log('🧪 Testing application creation...');
  
  try {
    const { userId, apprenticeshipId, coverLetter, customAnswers } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify apprenticeship exists
    const apprenticeship = await Apprenticeship.findById(apprenticeshipId);
    if (!apprenticeship) {
      return sendError(res, 'Apprenticeship not found', 404, 'APPRENTICESHIP_NOT_FOUND');
    }

    // Check if application already exists
    const existingApplication = await Application.findOne({
      userId,
      apprenticeshipId,
      isActive: true
    });

    if (existingApplication) {
      return sendError(res, 'Application already exists for this job', 400, 'APPLICATION_EXISTS');
    }

    const startTime = Date.now();

    // Calculate basic match score (simplified)
    const calculateMatchScore = (userProfile: any, job: any): number => {
      let score = 50; // Base score
      
      // Location compatibility
      if (userProfile.location?.city === job.location?.city) {
        score += 20;
      }
      
      // Industry match
      if (userProfile.preferences?.industries?.includes(job.industry)) {
        score += 15;
      }
      
      // Skills match
      const userSkills = userProfile.skills || [];
      const jobSkills = job.skills?.map((s: any) => s.skill) || [];
      const skillMatches = userSkills.filter((skill: string) => 
        jobSkills.some((jobSkill: string) => 
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      score += Math.min(15, skillMatches.length * 3);
      
      return Math.min(100, Math.max(0, score));
    };

    const matchScore = calculateMatchScore(user.profile, apprenticeship);

    // Calculate compatibility scores
    const locationCompatibility = user.profile.location?.city === apprenticeship.location?.city ? 100 : 
      (user.profile.preferences?.maxDistance || 0) >= 25 ? 75 : 50;
    
    const salaryCompatibility = 
      user.profile.preferences?.salaryRange?.min <= apprenticeship.salary?.max &&
      user.profile.preferences?.salaryRange?.max >= apprenticeship.salary?.min ? 100 : 60;

    // Create skills match analysis
    const userSkills = user.profile.skills || [];
    const jobSkills = apprenticeship.skills?.map((s: any) => s.skill) || [];
    const requiredSkills = apprenticeship.skills?.filter((s: any) => s.required)?.map((s: any) => s.skill) || [];
    
    const skillsMatch = {
      requiredSkillsMatched: requiredSkills.filter((skill: string) => 
        userSkills.some((userSkill: string) => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ),
      requiredSkillsMissing: requiredSkills.filter((skill: string) => 
        !userSkills.some((userSkill: string) => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ),
      desirableSkillsMatched: jobSkills.filter((skill: string) => 
        !requiredSkills.includes(skill) &&
        userSkills.some((userSkill: string) => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ),
      additionalSkills: userSkills.filter((skill: string) => 
        !jobSkills.some((jobSkill: string) => 
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ),
      overallMatchPercentage: Math.round((userSkills.length > 0 ? 
        (userSkills.filter((skill: string) => 
          jobSkills.some((jobSkill: string) => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        ).length / userSkills.length) * 100 : 0)),
      skillGaps: []
    };

    // Create application
    const applicationData = {
      userId,
      apprenticeshipId,
      companyId: apprenticeship.companyId,
      status: 'submitted',
      submittedAt: new Date(),
      coverLetter: coverLetter || 'Application submitted via test endpoint',
      customAnswers: customAnswers || [],
      matchScore,
      skillsMatch,
      locationCompatibility,
      salaryCompatibility,
      applicationSource: 'direct',
      consentToContact: true,
      gdprConsent: true,
      autoMatchEnabled: true
    };

    const newApplication = new Application(applicationData);
    const savedApplication = await newApplication.save();

    // Update apprenticeship application count
    await Apprenticeship.findByIdAndUpdate(apprenticeshipId, {
      $inc: { applicationCount: 1 }
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Test application created successfully: ${savedApplication.applicationId} (${duration}ms)`);

    sendSuccess(res, {
      message: 'Test application created successfully',
      application: {
        id: savedApplication._id,
        applicationId: savedApplication.applicationId,
        status: savedApplication.status,
        matchScore: savedApplication.matchScore,
        skillsMatch: savedApplication.skillsMatch,
        submittedAt: savedApplication.submittedAt,
        user: {
          id: user._id,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          email: user.email
        },
        job: {
          id: apprenticeship._id,
          title: apprenticeship.jobTitle,
          company: apprenticeship.companyId,
          location: apprenticeship.location?.city
        }
      },
      performance: {
        duration: `${duration}ms`,
        operation: 'application_creation'
      }
    }, 201);

  } catch (error: any) {
    console.error('❌ Test application creation failed:', error);
    
    if (error.name === 'ValidationError') {
      return sendError(res, 'Application validation failed', 400, 'VALIDATION_ERROR', {
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    return sendError(res, 'Failed to create test application', 500, 'APPLICATION_CREATION_ERROR');
  }
}));

// Test Payment Record Creation Endpoint
router.post('/payment', validateDatabaseInput('payments'), asyncHandler(async (req, res) => {
  console.log('🧪 Testing payment record creation...');
  
  try {
    const { userId, amount, currency, type, description, metadata } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    const startTime = Date.now();

    // Create payment record
    const paymentData = {
      userId,
      amount: amount || 39900, // £399 in pence
      currency: (currency || 'GBP').toUpperCase(),
      description: description || 'Test payment via API',
      type: type || 'one_time',
      paymentMethodType: 'card',
      status: 'succeeded', // For test purposes
      processedAt: new Date(),
      metadata: {
        ...metadata,
        testPayment: true,
        createdVia: 'test-endpoint'
      },
      invoiceRequired: false,
      receiptSent: true,
      customerNotified: true
    };

    // Add company reference if user is a company
    if (user.role === 'company') {
      paymentData['companyId'] = userId;
    }

    const newPayment = new Payment(paymentData);
    const savedPayment = await newPayment.save();

    const duration = Date.now() - startTime;

    console.log(`✅ Test payment record created successfully: ${savedPayment.paymentId} (${duration}ms)`);

    sendSuccess(res, {
      message: 'Test payment record created successfully',
      payment: {
        id: savedPayment._id,
        paymentId: savedPayment.paymentId,
        amount: savedPayment.amount,
        currency: savedPayment.currency,
        status: savedPayment.status,
        type: savedPayment.type,
        description: savedPayment.description,
        processedAt: savedPayment.processedAt,
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        },
        formattedAmount: `${savedPayment.currency} ${(savedPayment.amount / 100).toFixed(2)}`
      },
      performance: {
        duration: `${duration}ms`,
        operation: 'payment_creation'
      }
    }, 201);

  } catch (error: any) {
    console.error('❌ Test payment creation failed:', error);
    
    if (error.name === 'ValidationError') {
      return sendError(res, 'Payment validation failed', 400, 'VALIDATION_ERROR', {
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    return sendError(res, 'Failed to create test payment', 500, 'PAYMENT_CREATION_ERROR');
  }
}));

// Test Data Cleanup Endpoint
router.delete('/cleanup', asyncHandler(async (req, res) => {
  console.log('🧹 Cleaning up test data...');
  
  try {
    const { email, testData } = req.query;
    
    const cleanup = {
      timestamp: new Date().toISOString(),
      operations: {
        users: { deleted: 0 },
        applications: { deleted: 0 },
        payments: { deleted: 0 }
      }
    };

    // Clean up test users
    if (email) {
      const userResult = await User.deleteMany({ 
        email: { $regex: email as string, $options: 'i' } 
      });
      cleanup.operations.users.deleted = userResult.deletedCount || 0;
    } else if (testData === 'true') {
      // Clean up all test data (be careful with this!)
      const userResult = await User.deleteMany({ 
        email: { $regex: 'test.*@apprenticeapex.com', $options: 'i' } 
      });
      cleanup.operations.users.deleted = userResult.deletedCount || 0;
    }

    // Clean up test applications
    const applicationResult = await Application.deleteMany({
      'metadata.testApplication': true
    });
    cleanup.operations.applications.deleted = applicationResult.deletedCount || 0;

    // Clean up test payments
    const paymentResult = await Payment.deleteMany({
      'metadata.testPayment': true
    });
    cleanup.operations.payments.deleted = paymentResult.deletedCount || 0;

    console.log(`✅ Test data cleanup completed: ${JSON.stringify(cleanup.operations)}`);

    sendSuccess(res, {
      message: 'Test data cleanup completed',
      cleanup
    });

  } catch (error: any) {
    console.error('❌ Test data cleanup failed:', error);
    return sendError(res, 'Cleanup failed', 500, 'CLEANUP_ERROR');
  }
}));

export default router;

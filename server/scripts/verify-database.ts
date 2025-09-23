#!/usr/bin/env tsx

/**
 * Database Verification Script
 * 
 * This script performs comprehensive verification of the MongoDB database implementation.
 * Run this script to ensure all database functionality is working correctly.
 */

import { database, connectToDatabase } from '../config/database';
import { initializeIndexes } from '../config/indexes';
import { User } from '../models/User';
import { Apprenticeship } from '../models/Apprenticeship';
import { Application } from '../models/Application';
import { Payment } from '../models/Payment';

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  message: string;
  error?: string;
  data?: any;
}

class DatabaseVerifier {
  private results: TestResult[] = [];
  private startTime: number = 0;

  public async runVerification(): Promise<void> {
    console.log('🚀 Starting comprehensive database verification...\n');
    this.startTime = Date.now();

    try {
      // Run all verification tests
      await this.testEnvironmentVariables();
      await this.testDatabaseConnection();
      await this.testIndexCreation();
      await this.testSchemaValidation();
      await this.testCRUDOperations();
      await this.testPerformance();
      await this.testErrorHandling();

      // Generate final report
      this.generateReport();

    } catch (error) {
      console.error('❌ Verification failed with critical error:', error);
      process.exit(1);
    }
  }

  private async testEnvironmentVariables(): Promise<void> {
    console.log('🔍 Testing environment variables...');
    
    const testStart = Date.now();
    try {
      const env = process.env;
      const checks = {
        MONGODB_URI: !!env.MONGODB_URI,
        JWT_SECRET: !!env.JWT_SECRET && env.JWT_SECRET.length >= 32,
        NODE_ENV: !!env.NODE_ENV
      };

      const allPassed = Object.values(checks).every(Boolean);
      
      this.addResult('Environment Variables', allPassed, Date.now() - testStart, 
        allPassed ? 'All required environment variables are configured' : 'Missing or invalid environment variables',
        undefined, checks);

      if (!checks.MONGODB_URI) {
        console.warn('���️  MONGODB_URI not configured - some tests may fail');
      }

    } catch (error) {
      this.addResult('Environment Variables', false, Date.now() - testStart, 
        'Failed to validate environment variables', (error as Error).message);
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    console.log('🔗 Testing database connection...');
    
    const testStart = Date.now();
    try {
      // Attempt to connect
      await connectToDatabase();
      
      const isConnected = database.isConnected();
      const healthStatus = database.getHealthStatus();
      
      // Test ping
      let pingSuccess = false;
      let pingTime = 0;
      try {
        const pingStart = Date.now();
        await database.validateConnection();
        pingTime = Date.now() - pingStart;
        pingSuccess = true;
      } catch (error) {
        console.warn('Database ping failed:', error);
      }

      const connectionData = {
        connected: isConnected,
        status: healthStatus.status,
        poolSize: healthStatus.poolSize,
        availableConnections: healthStatus.availableConnections,
        pingSuccess,
        pingTime: `${pingTime}ms`
      };

      this.addResult('Database Connection', isConnected && pingSuccess, Date.now() - testStart,
        isConnected ? 'Database connection established successfully' : 'Database connection failed',
        undefined, connectionData);

    } catch (error) {
      this.addResult('Database Connection', false, Date.now() - testStart,
        'Database connection test failed', (error as Error).message);
    }
  }

  private async testIndexCreation(): Promise<void> {
    console.log('📇 Testing index creation...');
    
    const testStart = Date.now();
    try {
      // Initialize indexes
      await initializeIndexes();
      
      // Verify indexes exist
      const connection = database.getConnection();
      if (!connection) {
        throw new Error('No database connection available');
      }

      const collections = ['users', 'apprenticeships', 'applications', 'payments'];
      const indexCounts: any = {};
      let totalIndexes = 0;

      for (const collectionName of collections) {
        try {
          const collection = connection.collection(collectionName);
          const indexes = await collection.indexes();
          indexCounts[collectionName] = indexes.length;
          totalIndexes += indexes.length;
        } catch (error) {
          indexCounts[collectionName] = 0;
        }
      }

      const success = totalIndexes > 4; // At least some indexes should exist
      
      this.addResult('Index Creation', success, Date.now() - testStart,
        success ? `Successfully created ${totalIndexes} indexes` : 'Index creation failed',
        undefined, indexCounts);

    } catch (error) {
      this.addResult('Index Creation', false, Date.now() - testStart,
        'Index creation test failed', (error as Error).message);
    }
  }

  private async testSchemaValidation(): Promise<void> {
    console.log('📋 Testing schema validation...');
    
    const testStart = Date.now();
    let validationErrors = 0;
    const results: any = {};

    try {
      // Test User schema
      try {
        const testUser = new User({
          email: 'test@example.com',
          password: 'TestPassword123!',
          role: 'student',
          profile: {
            firstName: 'Test',
            lastName: 'User',
            location: {
              city: 'London',
              postcode: 'SW1A 1AA',
              coordinates: [-0.1276, 51.5074]
            },
            preferences: {
              industries: ['Technology'],
              maxDistance: 25,
              salaryRange: { min: 18000, max: 25000, currency: 'GBP' }
            },
            skills: ['Testing'],
            hasDriversLicense: false,
            workType: 'full-time',
            transportModes: ['Public Transport'],
            isActive: true
          }
        });
        await testUser.validate();
        results.userSchema = 'valid';
      } catch (error) {
        results.userSchema = 'invalid';
        validationErrors++;
      }

      // Test Apprenticeship schema
      try {
        const testJob = new Apprenticeship({
          companyId: '507f1f77bcf86cd799439011',
          jobTitle: 'Test Developer Apprentice',
          description: 'This is a test job description that meets the minimum length requirement for validation testing purposes.',
          industry: 'Technology',
          apprenticeshipLevel: 'Advanced',
          qualificationTitle: 'Level 3 Software Development',
          qualificationLevel: 3,
          location: {
            address: '123 Test Street',
            city: 'London',
            postcode: 'SW1A 2AA',
            country: 'United Kingdom',
            coordinates: [-0.1276, 51.5074]
          },
          duration: { years: 2, months: 0 },
          salary: {
            min: 18000,
            max: 25000,
            currency: 'GBP',
            period: 'annually'
          },
          requirements: {
            educationLevel: 'A-Levels',
            previousExperience: 'none',
            drivingLicenseRequired: false,
            backgroundCheckRequired: false,
            rightToWorkRequired: true
          },
          contactPerson: {
            name: 'Test Contact',
            email: 'test@company.com',
            preferredContactMethod: 'email'
          },
          lastModifiedBy: 'test-system'
        });
        await testJob.validate();
        results.apprenticeshipSchema = 'valid';
      } catch (error) {
        results.apprenticeshipSchema = 'invalid';
        validationErrors++;
      }

      const success = validationErrors === 0;
      
      this.addResult('Schema Validation', success, Date.now() - testStart,
        success ? 'All schemas validated successfully' : `${validationErrors} schema validation errors`,
        undefined, results);

    } catch (error) {
      this.addResult('Schema Validation', false, Date.now() - testStart,
        'Schema validation test failed', (error as Error).message);
    }
  }

  private async testCRUDOperations(): Promise<void> {
    console.log('🔄 Testing CRUD operations...');
    
    const testStart = Date.now();
    let operations = 0;
    let successes = 0;
    let testUserId: string | null = null;

    try {
      if (!database.isConnected()) {
        throw new Error('Database not connected');
      }

      // CREATE operation
      operations++;
      try {
        const testUser = new User({
          email: `test-crud-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          role: 'student',
          profile: {
            firstName: 'CRUD',
            lastName: 'Test',
            location: {
              city: 'London',
              postcode: 'SW1A 1AA',
              coordinates: [-0.1276, 51.5074]
            },
            preferences: {
              industries: ['Technology'],
              maxDistance: 25,
              salaryRange: { min: 18000, max: 25000, currency: 'GBP' }
            },
            skills: ['Testing'],
            hasDriversLicense: false,
            workType: 'full-time',
            transportModes: ['Public Transport'],
            isActive: true
          }
        });
        const savedUser = await testUser.save();
        testUserId = savedUser._id;
        successes++;
        console.log('  ✅ CREATE operation successful');
      } catch (error) {
        console.log('  ��� CREATE operation failed:', (error as Error).message);
      }

      // READ operation
      operations++;
      if (testUserId) {
        try {
          const foundUser = await User.findById(testUserId);
          if (foundUser) {
            successes++;
            console.log('  ✅ READ operation successful');
          } else {
            console.log('  ❌ READ operation failed: User not found');
          }
        } catch (error) {
          console.log('  ❌ READ operation failed:', (error as Error).message);
        }
      }

      // UPDATE operation
      operations++;
      if (testUserId) {
        try {
          const updatedUser = await User.findByIdAndUpdate(
            testUserId,
            { 'profile.firstName': 'Updated' },
            { new: true }
          );
          if (updatedUser && updatedUser.profile.firstName === 'Updated') {
            successes++;
            console.log('  ✅ UPDATE operation successful');
          } else {
            console.log('  ❌ UPDATE operation failed');
          }
        } catch (error) {
          console.log('  ❌ UPDATE operation failed:', (error as Error).message);
        }
      }

      // DELETE operation (soft delete)
      operations++;
      if (testUserId) {
        try {
          const deletedUser = await User.findByIdAndUpdate(
            testUserId,
            { isActive: false, deactivatedAt: new Date() },
            { new: true }
          );
          if (deletedUser && !deletedUser.isActive) {
            successes++;
            console.log('  ✅ DELETE operation successful');
          } else {
            console.log('  ❌ DELETE operation failed');
          }
        } catch (error) {
          console.log('  ❌ DELETE operation failed:', (error as Error).message);
        }
      }

      // Cleanup
      if (testUserId) {
        try {
          await User.findByIdAndDelete(testUserId);
        } catch (error) {
          console.warn('Failed to cleanup test user:', error);
        }
      }

      const success = successes === operations;
      
      this.addResult('CRUD Operations', success, Date.now() - testStart,
        `${successes}/${operations} CRUD operations successful`,
        undefined, { operations, successes });

    } catch (error) {
      this.addResult('CRUD Operations', false, Date.now() - testStart,
        'CRUD operations test failed', (error as Error).message);
    }
  }

  private async testPerformance(): Promise<void> {
    console.log('📊 Testing performance...');
    
    const testStart = Date.now();
    try {
      const performanceData: any = {};

      // Test query performance
      if (database.isConnected()) {
        const queryStart = Date.now();
        await database.validateConnection();
        performanceData.pingTime = Date.now() - queryStart;
      }

      // Get health status
      const healthStatus = database.getHealthStatus();
      performanceData.healthStatus = healthStatus.status;
      performanceData.poolUtilization = healthStatus.poolSize ? 
        Math.round(((healthStatus.poolSize - healthStatus.availableConnections) / healthStatus.poolSize) * 100) : 0;

      // Memory usage
      const memUsage = process.memoryUsage();
      performanceData.memoryUsage = {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
      };

      const performanceGood = 
        (performanceData.pingTime || 0) < 1000 && 
        performanceData.healthStatus === 'healthy' &&
        performanceData.poolUtilization < 90;

      this.addResult('Performance', performanceGood, Date.now() - testStart,
        performanceGood ? 'Performance metrics are within acceptable ranges' : 'Performance concerns detected',
        undefined, performanceData);

    } catch (error) {
      this.addResult('Performance', false, Date.now() - testStart,
        'Performance test failed', (error as Error).message);
    }
  }

  private async testErrorHandling(): Promise<void> {
    console.log('🚨 Testing error handling...');
    
    const testStart = Date.now();
    let errorTests = 0;
    let errorsPassed = 0;

    try {
      // Test invalid ObjectId
      errorTests++;
      try {
        await User.findById('invalid-id');
        console.log('  ❌ Invalid ObjectId test failed - should have thrown error');
      } catch (error) {
        errorsPassed++;
        console.log('  ✅ Invalid ObjectId error handled correctly');
      }

      // Test validation error
      errorTests++;
      try {
        const invalidUser = new User({
          email: 'invalid-email',
          password: '123',
          role: 'invalid'
        });
        await invalidUser.save();
        console.log('  ❌ Validation error test failed - should have thrown error');
      } catch (error) {
        errorsPassed++;
        console.log('  ✅ Validation error handled correctly');
      }

      const success = errorsPassed === errorTests;
      
      this.addResult('Error Handling', success, Date.now() - testStart,
        `${errorsPassed}/${errorTests} error handling tests passed`,
        undefined, { errorTests, errorsPassed });

    } catch (error) {
      this.addResult('Error Handling', false, Date.now() - testStart,
        'Error handling test failed', (error as Error).message);
    }
  }

  private addResult(name: string, success: boolean, duration: number, message: string, error?: string, data?: any): void {
    this.results.push({
      name,
      success,
      duration,
      message,
      error,
      data
    });
  }

  private generateReport(): void {
    const totalTime = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('📋 DATABASE VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log('='.repeat(60));

    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.name} (${result.duration}ms)`);
      console.log(`   ${result.message}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.data && Object.keys(result.data).length > 0) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      }
      console.log('');
    });

    console.log('='.repeat(60));
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Your database is production-ready.');
    } else {
      console.log(`⚠️  ${failed} tests failed. Please address the issues above.`);
    }
    console.log('='.repeat(60));

    // Close database connection
    database.gracefulShutdown().then(() => {
      process.exit(failed === 0 ? 0 : 1);
    }).catch((error) => {
      console.error('Error during shutdown:', error);
      process.exit(1);
    });
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const verifier = new DatabaseVerifier();
  verifier.runVerification().catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { DatabaseVerifier };

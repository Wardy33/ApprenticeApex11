import { getSecureEnvConfig, auditEnvironmentSecurity } from '../config/secureEnv';
import { SecureJWTService } from '../services/secureJWTService';
import { SecurePasswordService } from '../services/securePasswordService';

interface SecurityValidationResult {
  passed: boolean;
  critical: string[];
  warnings: string[];
  info: string[];
}

interface ComponentCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

export class SecurityStartupValidator {
  
  // Main validation function
  static async validateSecurityOnStartup(): Promise<SecurityValidationResult> {
    console.log('🛡️  Starting comprehensive security validation...');
    
    const result: SecurityValidationResult = {
      passed: false,
      critical: [],
      warnings: [],
      info: []
    };

    const checks: ComponentCheck[] = [];

    try {
      // 1. Environment Security Validation
      checks.push(...await this.validateEnvironmentSecurity());
      
      // 2. JWT Security Validation
      checks.push(...await this.validateJWTSecurity());
      
      // 3. Password Security Validation
      checks.push(...await this.validatePasswordSecurity());
      
      // 4. Stripe Security Validation
      checks.push(...await this.validateStripeSecurity());
      
      // 5. Database Security Validation
      checks.push(...await this.validateDatabaseSecurity());
      
      // 6. Network Security Validation
      checks.push(...await this.validateNetworkSecurity());

      // Process results
      const criticalFailures = checks.filter(check => check.critical && check.status === 'fail');
      const warnings = checks.filter(check => check.status === 'warning');
      const passes = checks.filter(check => check.status === 'pass');

      result.critical = criticalFailures.map(check => check.message);
      result.warnings = warnings.map(check => check.message);
      result.info = passes.map(check => check.message);
      result.passed = criticalFailures.length === 0;

      // Display results
      this.displayValidationResults(checks, result);

      return result;

    } catch (error) {
      console.error('❌ Security validation failed with error:', error);
      result.critical.push(`Security validation system failure: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  // Environment security validation
  private static async validateEnvironmentSecurity(): Promise<ComponentCheck[]> {
    const checks: ComponentCheck[] = [];
    
    try {
      const env = getSecureEnvConfig();
      const audit = auditEnvironmentSecurity();

      // Check for critical environment issues
      if (audit.status === 'critical') {
        checks.push({
          name: 'Environment Security',
          status: 'fail',
          message: `Critical environment security issues: ${audit.issues.join(', ')}`,
          critical: true
        });
      } else if (audit.status === 'warning') {
        checks.push({
          name: 'Environment Security',
          status: 'warning',
          message: `Environment security warnings: ${audit.issues.join(', ')}`,
          critical: false
        });
      } else {
        checks.push({
          name: 'Environment Security',
          status: 'pass',
          message: 'Environment security configuration validated',
          critical: false
        });
      }

      // Validate NODE_ENV
      if (env.NODE_ENV === 'production') {
        checks.push({
          name: 'Production Environment',
          status: 'pass',
          message: 'Running in production mode',
          critical: false
        });
      } else {
        checks.push({
          name: 'Development Environment',
          status: 'warning',
          message: `Running in ${env.NODE_ENV} mode`,
          critical: false
        });
      }

    } catch (error) {
      checks.push({
        name: 'Environment Security',
        status: 'fail',
        message: `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }

    return checks;
  }

  // JWT security validation
  private static async validateJWTSecurity(): Promise<ComponentCheck[]> {
    const checks: ComponentCheck[] = [];
    
    try {
      const jwtInfo = SecureJWTService.getSecurityInfo();

      // Check JWT secret strength
      if (jwtInfo.keyStrength >= 64) {
        checks.push({
          name: 'JWT Secret Strength',
          status: 'pass',
          message: `JWT secret strength: ${jwtInfo.keyStrength} characters (excellent)`,
          critical: false
        });
      } else if (jwtInfo.keyStrength >= 32) {
        checks.push({
          name: 'JWT Secret Strength',
          status: 'warning',
          message: `JWT secret strength: ${jwtInfo.keyStrength} characters (acceptable, recommend 64+)`,
          critical: false
        });
      } else {
        checks.push({
          name: 'JWT Secret Strength',
          status: 'fail',
          message: `JWT secret strength: ${jwtInfo.keyStrength} characters (too weak)`,
          critical: true
        });
      }

      // Check JWT algorithm
      if (jwtInfo.algorithm === 'HS256') {
        checks.push({
          name: 'JWT Algorithm',
          status: 'pass',
          message: `JWT algorithm: ${jwtInfo.algorithm} (secure)`,
          critical: false
        });
      } else {
        checks.push({
          name: 'JWT Algorithm',
          status: 'warning',
          message: `JWT algorithm: ${jwtInfo.algorithm} (consider HS256)`,
          critical: false
        });
      }

      // Test JWT generation and verification
      try {
        const testPayload = { userId: 'test', role: 'student' as const, email: 'test@test.com' };
        const token = SecureJWTService.generateToken(testPayload);
        const decoded = SecureJWTService.verifyToken(token);
        
        if (decoded.userId === testPayload.userId) {
          checks.push({
            name: 'JWT Functionality',
            status: 'pass',
            message: 'JWT generation and verification working correctly',
            critical: false
          });
        } else {
          checks.push({
            name: 'JWT Functionality',
            status: 'fail',
            message: 'JWT verification returned incorrect data',
            critical: true
          });
        }
      } catch (error) {
        checks.push({
          name: 'JWT Functionality',
          status: 'fail',
          message: `JWT functionality test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          critical: true
        });
      }

    } catch (error) {
      checks.push({
        name: 'JWT Security',
        status: 'fail',
        message: `JWT security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }

    return checks;
  }

  // Password security validation
  private static async validatePasswordSecurity(): Promise<ComponentCheck[]> {
    const checks: ComponentCheck[] = [];
    
    try {
      // Test password hashing
      const testPassword = 'TestPassword123!';
      const hashedPassword = await SecurePasswordService.hashPassword(testPassword);
      const isValid = await SecurePasswordService.verifyPassword(testPassword, hashedPassword);
      
      if (isValid) {
        checks.push({
          name: 'Password Hashing',
          status: 'pass',
          message: 'Password hashing and verification working correctly',
          critical: false
        });
      } else {
        checks.push({
          name: 'Password Hashing',
          status: 'fail',
          message: 'Password hashing verification failed',
          critical: true
        });
      }

      // Test password strength validation
      try {
        SecurePasswordService.validatePasswordStrength('weak');
        checks.push({
          name: 'Password Strength Validation',
          status: 'fail',
          message: 'Password strength validation not working (accepted weak password)',
          critical: true
        });
      } catch (error) {
        checks.push({
          name: 'Password Strength Validation',
          status: 'pass',
          message: 'Password strength validation working correctly',
          critical: false
        });
      }

    } catch (error) {
      checks.push({
        name: 'Password Security',
        status: 'fail',
        message: `Password security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }

    return checks;
  }

  // Stripe security validation
  private static async validateStripeSecurity(): Promise<ComponentCheck[]> {
    const checks: ComponentCheck[] = [];
    
    try {
      const env = getSecureEnvConfig();

      // Check Stripe key configuration
      if (!env.STRIPE_SECRET_KEY) {
        checks.push({
          name: 'Stripe Configuration',
          status: 'fail',
          message: 'Stripe secret key not configured',
          critical: true
        });
        return checks;
      }

      // Validate key format
      if (env.NODE_ENV === 'production') {
        if (env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
          checks.push({
            name: 'Stripe Keys',
            status: 'pass',
            message: 'Using live Stripe keys in production',
            critical: false
          });
        } else {
          checks.push({
            name: 'Stripe Keys',
            status: 'fail',
            message: 'Production environment using test Stripe keys',
            critical: true
          });
        }
      } else {
        if (env.STRIPE_SECRET_KEY.startsWith('sk_test_') || env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
          checks.push({
            name: 'Stripe Keys',
            status: 'pass',
            message: 'Valid Stripe keys configured for development',
            critical: false
          });
        } else {
          checks.push({
            name: 'Stripe Keys',
            status: 'fail',
            message: 'Invalid Stripe key format',
            critical: true
          });
        }
      }

      // Check webhook secret
      if (env.STRIPE_WEBHOOK_SECRET && env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
        checks.push({
          name: 'Stripe Webhook',
          status: 'pass',
          message: 'Stripe webhook secret configured correctly',
          critical: false
        });
      } else {
        checks.push({
          name: 'Stripe Webhook',
          status: 'warning',
          message: 'Stripe webhook secret not configured or invalid format',
          critical: false
        });
      }

    } catch (error) {
      checks.push({
        name: 'Stripe Security',
        status: 'fail',
        message: `Stripe security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }

    return checks;
  }

  // Database security validation
  private static async validateDatabaseSecurity(): Promise<ComponentCheck[]> {
    const checks: ComponentCheck[] = [];
    
    try {
      const env = getSecureEnvConfig();

      // Check database URL configuration
      if (!env.DATABASE_URL) {
        checks.push({
          name: 'Database Configuration',
          status: 'fail',
          message: 'Database URL not configured',
          critical: true
        });
        return checks;
      }

      // Check SSL usage in production
      if (env.NODE_ENV === 'production') {
        if (env.DATABASE_URL.includes('ssl=') || env.DATABASE_URL.includes('sslmode=')) {
          checks.push({
            name: 'Database SSL',
            status: 'pass',
            message: 'Database SSL configuration detected in production',
            critical: false
          });
        } else {
          checks.push({
            name: 'Database SSL',
            status: 'warning',
            message: 'Database SSL not explicitly configured in production',
            critical: false
          });
        }
      } else {
        checks.push({
          name: 'Database SSL',
          status: 'pass',
          message: 'Database SSL configuration not required in development',
          critical: false
        });
      }

      // Check for exposed credentials (basic check)
      if (env.DATABASE_URL.includes('password') || env.DATABASE_URL.includes('user')) {
        checks.push({
          name: 'Database URL',
          status: 'pass',
          message: 'Database URL appears to be properly formatted',
          critical: false
        });
      } else {
        checks.push({
          name: 'Database URL',
          status: 'warning',
          message: 'Database URL format could not be validated',
          critical: false
        });
      }

    } catch (error) {
      checks.push({
        name: 'Database Security',
        status: 'fail',
        message: `Database security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }

    return checks;
  }

  // Network security validation
  private static async validateNetworkSecurity(): Promise<ComponentCheck[]> {
    const checks: ComponentCheck[] = [];
    
    try {
      const env = getSecureEnvConfig();

      // Check HTTPS configuration
      if (env.NODE_ENV === 'production') {
        if (env.FRONTEND_URL.startsWith('https://')) {
          checks.push({
            name: 'HTTPS Configuration',
            status: 'pass',
            message: 'Frontend URL uses HTTPS in production',
            critical: false
          });
        } else {
          checks.push({
            name: 'HTTPS Configuration',
            status: 'fail',
            message: 'Frontend URL should use HTTPS in production',
            critical: true
          });
        }
      } else {
        checks.push({
          name: 'HTTPS Configuration',
          status: 'pass',
          message: 'HTTP acceptable in development environment',
          critical: false
        });
      }

      // Check rate limiting configuration
      if (env.RATE_LIMIT_MAX_REQUESTS <= 1000) {
        checks.push({
          name: 'Rate Limiting',
          status: 'pass',
          message: `Rate limiting configured: ${env.RATE_LIMIT_MAX_REQUESTS} requests per window`,
          critical: false
        });
      } else {
        checks.push({
          name: 'Rate Limiting',
          status: 'warning',
          message: `Rate limiting may be too permissive: ${env.RATE_LIMIT_MAX_REQUESTS} requests`,
          critical: false
        });
      }

    } catch (error) {
      checks.push({
        name: 'Network Security',
        status: 'fail',
        message: `Network security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        critical: true
      });
    }

    return checks;
  }

  // Display validation results
  private static displayValidationResults(checks: ComponentCheck[], result: SecurityValidationResult): void {
    console.log('\n🛡️  SECURITY VALIDATION RESULTS');
    console.log('===============================');

    // Group checks by status
    const passed = checks.filter(c => c.status === 'pass');
    const warnings = checks.filter(c => c.status === 'warning');
    const failed = checks.filter(c => c.status === 'fail');

    // Display passed checks
    if (passed.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      passed.forEach(check => {
        console.log(`   ✅ ${check.name}: ${check.message}`);
      });
    }

    // Display warnings
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(check => {
        console.log(`   ⚠️  ${check.name}: ${check.message}`);
      });
    }

    // Display failures
    if (failed.length > 0) {
      console.log('\n❌ FAILED CHECKS:');
      failed.forEach(check => {
        const prefix = check.critical ? '🚨 CRITICAL' : '❌';
        console.log(`   ${prefix} ${check.name}: ${check.message}`);
      });
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Checks: ${checks.length}`);
    console.log(`   Passed: ${passed.length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Failed: ${failed.length}`);
    console.log(`   Critical Failures: ${failed.filter(c => c.critical).length}`);

    // Overall result
    if (result.passed) {
      console.log('\n🎉 SECURITY VALIDATION PASSED');
      console.log('   System is ready for deployment');
    } else {
      console.log('\n🚨 SECURITY VALIDATION FAILED');
      console.log('   Critical issues must be resolved before deployment');
      console.log('\nCritical Issues:');
      result.critical.forEach(issue => {
        console.log(`   🚨 ${issue}`);
      });
    }

    console.log('\n===============================\n');
  }

  // Force exit on critical security failures
  static async validateAndExit(): Promise<void> {
    const result = await this.validateSecurityOnStartup();
    
    if (!result.passed) {
      console.error('🚨 DEPLOYMENT BLOCKED: Critical security issues detected');
      process.exit(1);
    }
  }
}

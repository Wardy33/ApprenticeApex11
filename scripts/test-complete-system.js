#!/usr/bin/env node

/**
 * ApprenticeApex Complete System Validation Test
 * Tests all major system components for production readiness
 */

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${timestamp} ${emoji} ${message}`);
}

function test(name, testFn) {
  try {
    log(`Running test: ${name}`);
    const result = testFn();
    testResults.tests.push({ name, status: 'PASSED', result });
    testResults.passed++;
    log(`PASSED: ${name}`, 'success');
    return true;
  } catch (error) {
    testResults.tests.push({ name, status: 'FAILED', error: error.message });
    testResults.failed++;
    log(`FAILED: ${name} - ${error.message}`, 'error');
    return false;
  }
}

async function testSystemValidation() {
  log('\n🚀 APPRENTICEAPEX COMPLETE SYSTEM VALIDATION', 'info');
  log('==========================================\n', 'info');

  // 1. Test Environment Configuration
  test('Environment Variables Loaded', () => {
    const requiredVars = [
      'NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 
      'STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY',
      'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'
    ];
    
    const missing = requiredVars.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    return `All ${requiredVars.length} required environment variables present`;
  });

  // 2. Test Database Configuration
  test('Neon Database Configuration', () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl.includes('neon.tech')) {
      throw new Error('Database URL does not point to Neon PostgreSQL');
    }
    if (!dbUrl.includes('sslmode=require')) {
      throw new Error('SSL mode not enabled for production');
    }
    return 'Neon PostgreSQL configuration valid';
  });

  // 3. Test Production Credentials
  test('Stripe Live Keys Configuration', () => {
    const pubKey = process.env.STRIPE_PUBLISHABLE_KEY;
    const secKey = process.env.STRIPE_SECRET_KEY;
    
    if (!pubKey.startsWith('pk_live_')) {
      throw new Error('Stripe publishable key is not a live key');
    }
    if (!secKey.startsWith('sk_live_')) {
      throw new Error('Stripe secret key is not a live key');
    }
    return 'Stripe live keys configured correctly';
  });

  // 4. Test Security Configuration
  test('JWT Security Configuration', () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret.length < 32) {
      throw new Error('JWT secret is too short for production');
    }
    if (jwtSecret.includes('development') || jwtSecret.includes('test')) {
      throw new Error('JWT secret appears to be a development key');
    }
    return `JWT secret is ${jwtSecret.length} characters (secure)`;
  });

  // 5. Test Terminology Updates
  test('Student → Candidate Terminology Update', () => {
    // Check if key files have been updated
    const fs = require('fs');
    const path = require('path');
    
    try {
      const authFile = fs.readFileSync(path.join(__dirname, '../client/pages/StudentAuth.tsx'), 'utf8');
      if (authFile.includes("role: 'candidate'") && authFile.includes('CandidateAuth')) {
        return 'Primary authentication files updated to use Candidate terminology';
      } else {
        throw new Error('StudentAuth.tsx not fully updated to Candidate terminology');
      }
    } catch (error) {
      throw new Error('Could not verify terminology updates in authentication files');
    }
  });

  // 6. Test AI Moderation System
  test('AI Moderation System Configuration', () => {
    const aiEnabled = process.env.AI_MODERATION_ENABLED;
    const threshold = process.env.AI_CONFIDENCE_THRESHOLD;
    const autoBlock = process.env.AUTO_BLOCK_CONTACT_SHARING;
    
    if (aiEnabled !== 'true') {
      throw new Error('AI moderation is not enabled');
    }
    if (!threshold || parseFloat(threshold) < 0.5) {
      throw new Error('AI confidence threshold too low for production');
    }
    if (autoBlock !== 'true') {
      throw new Error('Auto-blocking not enabled for contact sharing');
    }
    return `AI moderation enabled with ${threshold} confidence threshold`;
  });

  // 7. Test Admin System
  test('Master Admin Configuration', () => {
    const adminCode = process.env.MASTER_ADMIN_CODE;
    const setupCode = process.env.MASTER_ADMIN_SETUP_CODE;
    
    if (!adminCode || adminCode.length < 6) {
      throw new Error('Master admin code not configured or too weak');
    }
    if (!setupCode || setupCode.length < 10) {
      throw new Error('Master admin setup code not configured or too weak');
    }
    return 'Master admin security codes configured';
  });

  // 8. Test Production Security
  test('Production Security Settings', () => {
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const rateLimit = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
    
    if (bcryptRounds < 12) {
      throw new Error('Bcrypt rounds too low for production (should be 12+)');
    }
    if (rateLimit > 200) {
      throw new Error('Rate limit too high for production security');
    }
    return `Bcrypt: ${bcryptRounds} rounds, Rate limit: ${rateLimit} req/window`;
  });

  // 9. Test File Structure
  test('Critical File Structure', () => {
    const fs = require('fs');
    const criticalFiles = [
      'server/routes/admin.ts',
      'server/services/aiModerationService.ts',
      'server/routes/messaging.ts',
      'server/utils/neonHelper.ts',
      'client/pages/StudentAuth.tsx',
      '.env.production'
    ];
    
    const missing = criticalFiles.filter(file => {
      try {
        fs.accessSync(file);
        return false;
      } catch {
        return true;
      }
    });
    
    if (missing.length > 0) {
      throw new Error(`Missing critical files: ${missing.join(', ')}`);
    }
    return `All ${criticalFiles.length} critical files present`;
  });

  // 10. Test API Endpoints (Mock)
  test('API Route Configuration', () => {
    // In a real test, this would make HTTP requests
    // For now, we validate route file structure
    const expectedRoutes = [
      'admin', 'messaging', 'auth', 'health'
    ];
    
    const fs = require('fs');
    const routesDir = 'server/routes';
    
    try {
      const files = fs.readdirSync(routesDir);
      const routeFiles = files.filter(f => f.endsWith('.ts')).map(f => f.replace('.ts', ''));
      const missing = expectedRoutes.filter(route => !routeFiles.includes(route));
      
      if (missing.length > 0) {
        throw new Error(`Missing route files: ${missing.join(', ')}`);
      }
      return `All ${expectedRoutes.length} critical API routes present`;
    } catch (error) {
      throw new Error('Could not validate API route structure');
    }
  });

  // Generate final report
  log('\n📊 TEST RESULTS SUMMARY', 'info');
  log('=====================', 'info');
  log(`Total Tests: ${testResults.passed + testResults.failed}`);
  log(`Passed: ${testResults.passed}`, testResults.passed > 0 ? 'success' : 'info');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');

  const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
  log(`Success Rate: ${successRate.toFixed(1)}%`, successRate >= 90 ? 'success' : 'error');

  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    testResults.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => log(`  • ${t.name}: ${t.error}`, 'error'));
  }

  if (successRate >= 90) {
    log('\n🎉 PRODUCTION READINESS: APPROVED', 'success');
    log('✅ ApprenticeApex is ready for production deployment!', 'success');
  } else {
    log('\n🚨 PRODUCTION READINESS: NOT READY', 'error');
    log('❌ Critical issues must be resolved before production deployment', 'error');
  }

  return successRate >= 90;
}

// Run the tests
testSystemValidation()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`Test runner error: ${error.message}`, 'error');
    process.exit(1);
  });

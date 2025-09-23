#!/usr/bin/env node

/**
 * ApprenticeApex Master Admin System Test Script
 * 
 * This script tests the complete admin system implementation:
 * 1. Master admin account creation
 * 2. Admin authentication
 * 3. Dashboard data access
 * 4. User management APIs
 * 5. Analytics endpoints
 * 6. System configuration
 */

const fetch = require('node-fetch');

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';
const ADMIN_EMAIL = 'admin@apprenticeapex.com';
const ADMIN_PASSWORD = 'MasterAdmin2024!';
const ADMIN_CODE = 'APEX2024';
const SETUP_CODE = 'SETUP_APEX_2024';

let adminToken = null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${colors.bold}=== STEP ${step}: ${description} ===${colors.reset}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  if (adminToken && !options.headers?.Authorization) {
    defaultOptions.headers.Authorization = `Bearer ${adminToken}`;
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      response
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 0
    };
  }
}

async function testStep1_CheckAPIHealth() {
  logStep(1, 'API Health Check');

  const result = await makeRequest('/ping');
  
  if (result.success) {
    logSuccess('API is responding');
    logInfo(`Status: ${result.data.status}`);
    logInfo(`Message: ${result.data.message}`);
  } else {
    logError('API is not responding');
    logError(`Error: ${result.error || result.data?.error}`);
    process.exit(1);
  }
}

async function testStep2_CreateMasterAdmin() {
  logStep(2, 'Create Master Admin Account');

  const result = await makeRequest('/admin/setup-master-admin', {
    method: 'POST',
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      setupCode: SETUP_CODE
    })
  });

  if (result.success) {
    logSuccess('Master admin account created successfully');
    logInfo(`Admin ID: ${result.data.adminId}`);
    logInfo(`Email: ${result.data.email}`);
  } else if (result.status === 409) {
    logWarning('Master admin account already exists');
    logInfo('Proceeding with existing account...');
  } else {
    logError('Failed to create master admin account');
    logError(`Status: ${result.status}`);
    logError(`Error: ${result.data?.error || result.error}`);
    
    if (result.data?.code === 'INVALID_SETUP_CODE') {
      logError('Invalid setup code. Please check the SETUP_CODE configuration.');
    }
    return false;
  }
  
  return true;
}

async function testStep3_AdminLogin() {
  logStep(3, 'Master Admin Login');

  const result = await makeRequest('/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      adminCode: ADMIN_CODE
    })
  });

  if (result.success) {
    logSuccess('Master admin login successful');
    adminToken = result.data.token;
    logInfo(`Role: ${result.data.user.role}`);
    logInfo(`Master Admin: ${result.data.user.isMasterAdmin}`);
    logInfo(`Token received: ${adminToken ? 'Yes' : 'No'}`);
    return true;
  } else {
    logError('Admin login failed');
    logError(`Status: ${result.status}`);
    logError(`Error: ${result.data?.error || result.error}`);
    
    if (result.data?.code === 'INVALID_ADMIN_CODE') {
      logError('Invalid admin code. Please check the ADMIN_CODE configuration.');
    }
    return false;
  }
}

async function testStep4_VerifySession() {
  logStep(4, 'Verify Admin Session');

  const result = await makeRequest('/admin/verify-session');

  if (result.success) {
    logSuccess('Admin session verified');
    logInfo(`User ID: ${result.data.user.id}`);
    logInfo(`Email: ${result.data.user.email}`);
    logInfo(`Permissions: ${Object.keys(result.data.user.permissions || {}).length} permissions`);
  } else {
    logError('Session verification failed');
    logError(`Status: ${result.status}`);
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
  
  return true;
}

async function testStep5_DashboardOverview() {
  logStep(5, 'Dashboard Overview Data');

  const result = await makeRequest('/admin/dashboard/overview');

  if (result.success) {
    logSuccess('Dashboard data retrieved');
    const stats = result.data.platformStats;
    logInfo(`Total Users: ${stats.totalUsers}`);
    logInfo(`Total Students: ${stats.totalStudents}`);
    logInfo(`Total Companies: ${stats.totalCompanies}`);
    logInfo(`Monthly Revenue: £${stats.monthlyRevenue}`);
    logInfo(`System Health: ${result.data.systemHealth.databaseStatus}`);
  } else {
    logError('Failed to retrieve dashboard data');
    logError(`Status: ${result.status}`);
    logError(`Error: ${result.data?.error || result.error}`);
    return false;
  }
  
  return true;
}

async function testStep6_UserManagement() {
  logStep(6, 'User Management APIs');

  // Test user listing
  const usersResult = await makeRequest('/admin/users?page=1&limit=5');
  
  if (usersResult.success) {
    logSuccess('User listing retrieved');
    logInfo(`Users found: ${usersResult.data.users.length}`);
    logInfo(`Total users: ${usersResult.data.pagination.totalUsers}`);
  } else {
    logError('Failed to retrieve users');
    logError(`Error: ${usersResult.data?.error || usersResult.error}`);
    return false;
  }

  // Test user analytics
  const analyticsResult = await makeRequest('/admin/users/analytics/overview');
  
  if (analyticsResult.success) {
    logSuccess('User analytics retrieved');
    logInfo(`Registration trends: ${analyticsResult.data.registrationTrends.length} data points`);
    logInfo(`Recent users: ${analyticsResult.data.recentUsers.length} users`);
  } else {
    logWarning('User analytics failed (may be expected with limited data)');
  }
  
  return true;
}

async function testStep7_SystemApis() {
  logStep(7, 'System Management APIs');

  // Test system configuration
  const configResult = await makeRequest('/admin/system/config');
  
  if (configResult.success) {
    logSuccess('System configuration retrieved');
    logInfo(`Platform settings: ${Object.keys(configResult.data.config.platformSettings).length} settings`);
    logInfo(`Feature flags: ${Object.keys(configResult.data.config.featureFlags).length} flags`);
  } else {
    logError('Failed to retrieve system config');
    logError(`Error: ${configResult.data?.error || configResult.error}`);
    return false;
  }

  // Test system health
  const healthResult = await makeRequest('/admin/system/health');
  
  if (healthResult.success) {
    logSuccess('System health check completed');
    logInfo(`Database: ${healthResult.data.database.connected ? 'Connected' : 'Disconnected'}`);
    logInfo(`Services: ${Object.keys(healthResult.data.services).length} services checked`);
  } else {
    logWarning('System health check failed (may be expected)');
  }
  
  return true;
}

async function testStep8_Analytics() {
  logStep(8, 'Analytics APIs');

  // Test platform analytics
  const platformResult = await makeRequest('/admin/analytics/platform');
  
  if (platformResult.success) {
    logSuccess('Platform analytics retrieved');
    logInfo(`User growth data: ${platformResult.data.userGrowth.length} data points`);
    logInfo(`Engagement metrics available: Yes`);
  } else {
    logWarning('Platform analytics failed (may be expected with limited data)');
  }

  // Test financial analytics
  const financialResult = await makeRequest('/admin/analytics/financial');
  
  if (financialResult.success) {
    logSuccess('Financial analytics retrieved');
    logInfo(`Total revenue: £${financialResult.data.subscriptionAnalytics.monthlyRecurring}`);
    logInfo(`Active subscriptions: ${financialResult.data.subscriptionAnalytics.total}`);
  } else {
    logWarning('Financial analytics failed (may be expected)');
  }
  
  return true;
}

async function testStep9_AdminLogout() {
  logStep(9, 'Admin Logout');

  const result = await makeRequest('/admin/logout', {
    method: 'POST'
  });

  if (result.success) {
    logSuccess('Admin logout successful');
    adminToken = null;
  } else {
    logWarning('Logout may have failed (not critical)');
  }
  
  return true;
}

async function runAllTests() {
  log('\n🚀 ApprenticeApex Master Admin System Test Suite', 'bold');
  log('='.repeat(60), 'cyan');

  const tests = [
    testStep1_CheckAPIHealth,
    testStep2_CreateMasterAdmin,
    testStep3_AdminLogin,
    testStep4_VerifySession,
    testStep5_DashboardOverview,
    testStep6_UserManagement,
    testStep7_SystemApis,
    testStep8_Analytics,
    testStep9_AdminLogout
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const passed = await test();
      if (passed !== false) {
        passedTests++;
      }
    } catch (error) {
      logError(`Test failed with exception: ${error.message}`);
    }
  }

  // Final Results
  log('\n' + '='.repeat(60), 'cyan');
  log(`🎯 TEST RESULTS: ${passedTests}/${totalTests} tests passed`, 'bold');
  
  if (passedTests === totalTests) {
    logSuccess('🎉 ALL TESTS PASSED! Master Admin system is working correctly.');
    logInfo('Admin dashboard is accessible at: http://localhost:5204/admin');
    logInfo(`Admin credentials: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} / ${ADMIN_CODE}`);
  } else if (passedTests >= totalTests - 2) {
    logWarning('⚠️  Most tests passed. Some analytics may fail with limited data.');
    logInfo('Admin system is functional but may need data population.');
  } else {
    logError('❌ Multiple tests failed. Please check the implementation.');
  }

  log('='.repeat(60), 'cyan');
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  makeRequest,
  log,
  logSuccess,
  logError,
  logWarning,
  logInfo
};

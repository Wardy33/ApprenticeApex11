#!/usr/bin/env node

/**
 * Admin Login Debug Script
 * 
 * This script helps debug the admin login issue by testing the endpoint directly
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

async function testAdminLogin() {
  console.log('🔍 Testing Admin Login Endpoint...');
  console.log('API Base:', API_BASE);

  // First, test basic API health
  try {
    console.log('\n📡 Testing API health...');
    const healthResponse = await fetch(`${API_BASE}/ping`);
    const healthData = await healthResponse.json();
    console.log('✅ API Health:', healthData);
  } catch (error) {
    console.error('❌ API Health Check Failed:', error.message);
    return;
  }

  // Test admin login endpoint
  const loginData = {
    email: 'admin@apprenticeapex.com',
    password: 'MasterAdmin2024!',
    adminCode: 'APEX2024'
  };

  console.log('\n🔐 Testing admin login...');
  console.log('Login data:', { 
    email: loginData.email, 
    hasPassword: !!loginData.password, 
    hasAdminCode: !!loginData.adminCode 
  });

  try {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response:', data);

      if (response.ok) {
        console.log('✅ Admin login successful!');
        console.log('Token received:', !!data.token);
        console.log('User role:', data.user?.role);
      } else {
        console.log('❌ Admin login failed:', data.error);
        console.log('Error code:', data.code);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError.message);
      console.log('Response was:', responseText);
    }

  } catch (error) {
    console.error('❌ Network error during admin login:', error.message);
  }
}

// Test setup master admin first
async function testSetupMasterAdmin() {
  console.log('\n👑 Testing master admin setup...');
  
  const setupData = {
    email: 'admin@apprenticeapex.com',
    password: 'MasterAdmin2024!',
    setupCode: 'SETUP_APEX_2024'
  };

  try {
    const response = await fetch(`${API_BASE}/admin/setup-master-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(setupData)
    });

    const responseText = await response.text();
    
    try {
      const data = JSON.parse(responseText);
      
      if (response.ok) {
        console.log('✅ Master admin setup successful!');
      } else if (response.status === 409) {
        console.log('ℹ️ Master admin already exists (expected)');
      } else {
        console.log('❌ Master admin setup failed:', data.error);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse setup response:', parseError.message);
    }

  } catch (error) {
    console.error('❌ Network error during setup:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Admin Login Debug Test Suite');
  console.log('='.repeat(50));
  
  await testSetupMasterAdmin();
  await testAdminLogin();
  
  console.log('\n='.repeat(50));
  console.log('🏁 Debug tests completed');
}

// Run if called directly
if (require.main === module) {
  // Check if fetch is available (Node 18+)
  if (typeof fetch === 'undefined') {
    console.error('❌ This script requires Node.js 18+ or a fetch polyfill');
    process.exit(1);
  }
  
  runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runTests, testAdminLogin, testSetupMasterAdmin };

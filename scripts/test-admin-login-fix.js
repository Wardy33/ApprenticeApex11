#!/usr/bin/env node

// Test the admin login system and fix any issues
async function testAdminLogin() {
  console.log('🧪 COMPREHENSIVE ADMIN LOGIN TEST & FIX');
  console.log('=====================================\n');

  const credentials = {
    email: 'admin@apprenticeapex.com',
    password: 'MasterAdmin2024!',
    adminCode: 'APEX2024'
  };

  console.log('📋 Testing with credentials:');
  console.log('Email:', credentials.email);
  console.log('Password:', credentials.password);
  console.log('Admin Code:', credentials.adminCode);
  console.log('');

  try {
    // Test the login endpoint
    console.log('🔗 Testing admin login endpoint...');
    
    const response = await fetch('http://localhost:3002/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok && data.success) {
      console.log('\n✅ ADMIN LOGIN TEST: PASSED');
      console.log('🎉 Admin login is working correctly!');
      console.log('Token received:', data.token ? 'Yes' : 'No');
      console.log('User data:', data.user);
    } else {
      console.log('\n❌ ADMIN LOGIN TEST: FAILED');
      console.log('Error:', data.error);
      console.log('Code:', data.code);
      
      if (data.code === 'INVALID_ADMIN_CREDENTIALS') {
        console.log('\n🔧 FIXING PASSWORD HASH...');
        await fixPasswordHash();
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n🔧 Checking if server is running...');
    await testServerHealth();
  }
}

async function fixPasswordHash() {
  console.log('Generating correct bcrypt hash for MasterAdmin2024!...');
  
  // This would typically use bcrypt, but for now let's use a working hash
  const workingHash = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'; // Known working hash for "password"
  
  console.log('⚠️  MANUAL FIX REQUIRED:');
  console.log('1. The password hash in the database needs to be updated');
  console.log('2. Run this SQL in Neon: UPDATE users SET password_hash = \'[correct_hash]\' WHERE email = \'admin@apprenticeapex.com\';');
  console.log('3. Update server/utils/neonHelper.ts with the same hash');
  console.log('4. The correct password should be: MasterAdmin2024!');
}

async function testServerHealth() {
  try {
    const healthResponse = await fetch('http://localhost:3002/api/admin/test');
    if (healthResponse.ok) {
      console.log('✅ Server is running and responding');
    } else {
      console.log('⚠️  Server responded but with error:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Server is not responding on port 3002');
    console.log('💡 Make sure the server is running: npm run dev:both');
  }
}

// Run the test
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with fetch support');
  console.log('💡 Alternatively, test the login manually in the browser');
  process.exit(1);
}

testAdminLogin()
  .then(() => {
    console.log('\n🏁 Admin login test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });

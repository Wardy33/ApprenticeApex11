// Simple test for admin login endpoint
console.log('🧪 Testing Admin Login Endpoint...');

const API_BASE = 'http://localhost:3001';

async function testAdminLogin() {
  console.log('📍 Testing admin login at:', `${API_BASE}/api/admin/login`);
  
  const loginData = {
    email: 'admin@apprenticeapex.com',
    password: 'MasterAdmin2024!',
    adminCode: 'APEX2024'
  };

  try {
    console.log('🔐 Sending login request...');
    
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);

    if (responseText) {
      try {
        const data = JSON.parse(responseText);
        console.log('📋 Parsed response:', data);

        if (response.ok) {
          console.log('✅ Admin login SUCCESS!');
          console.log('🎫 Token received:', !!data.token);
          console.log('👤 User role:', data.user?.role);
        } else {
          console.log('❌ Admin login FAILED:', data.error);
          console.log('🔍 Error code:', data.code);
        }
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
      }
    } else {
      console.error('❌ Empty response received');
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function testApiHealth() {
  try {
    console.log('🏥 Testing API health...');
    const response = await fetch(`${API_BASE}/api/ping`);
    const data = await response.json();
    console.log('✅ API Health:', data);
    return true;
  } catch (error) {
    console.error('❌ API Health failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Admin Login Tests');
  console.log('='.repeat(50));
  
  const healthOk = await testApiHealth();
  if (!healthOk) {
    console.log('❌ API not responding, stopping tests');
    return;
  }
  
  await testAdminLogin();
  
  console.log('='.repeat(50));
  console.log('🏁 Tests completed');
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment
  if (typeof fetch === 'undefined') {
    console.error('❌ This script requires Node.js 18+ with fetch support');
    process.exit(1);
  }
  
  runTests().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
} else {
  // Browser environment
  console.log('🌐 Running in browser environment');
  runTests();
}

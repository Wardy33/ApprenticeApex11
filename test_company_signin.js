// Test script for company signin
const testCompanySignin = async () => {
  try {
    const response = await fetch('http://localhost:3006/api/auth/company/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@company.com',
        password: 'Password123'
      })
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Company signin successful!');
    } else {
      console.log('❌ Company signin failed!');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testCompanySignin();

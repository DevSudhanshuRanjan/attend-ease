/**
 * Simple test script to verify the AttendEase system is working
 */

async function testSystem() {
  console.log('🔍 Testing AttendEase System...\n');

  try {
    // Test frontend server
    console.log('1. Testing Frontend Server...');
    const frontendResponse = await fetch('http://localhost:5173');
    if (frontendResponse.ok) {
      console.log('✅ Frontend server is running on http://localhost:5173');
    } else {
      console.log('❌ Frontend server is not responding');
    }

    // Test backend health endpoint
    console.log('\n2. Testing Backend Server...');
    const backendResponse = await fetch('http://localhost:3001/health');
    if (backendResponse.ok) {
      const healthData = await backendResponse.json();
      console.log('✅ Backend server is running on http://localhost:3001');
      console.log('📊 Health Status:', healthData);
    } else {
      console.log('❌ Backend server is not responding');
    }

    // Test API endpoints (without authentication)
    console.log('\n3. Testing API Structure...');
    const apiResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'test', password: 'test' })
    });

    if (apiResponse.status === 400 || apiResponse.status === 401) {
      console.log('✅ API endpoints are accessible (expected error for invalid credentials)');
    } else {
      console.log('ℹ️ API endpoint response status:', apiResponse.status);
    }

    console.log('\n🎉 System Test Complete!');
    console.log('\nNext Steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Try logging in with your UPES credentials');
    console.log('3. The system will scrape attendance data from the updated portal URL');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSystem();
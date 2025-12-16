// Test script for SMSOnlineGH API integration
// Run this script to verify all SMS functionality

const API_BASE = 'http://localhost:3000/api';

// Test data
const testSMS = {
  text: 'This is a test message from Church Konet SMS system',
  destination: '233244567890', // Ghana number format
  sender: 'CHURCH'
};

const testPersonalizedSMS = {
  text: 'Hello {{name}}, your appointment is scheduled for {{date}}',
  destinations: [
    {
      destination: '233244567890',
      values: { name: 'John Doe', date: '2024-01-15' }
    }
  ],
  sender: 'CHURCH'
};

const testBroadcastSMS = {
  text: 'This is a broadcast message to all church members',
  destinations: ['233244567890', '233555123456'],
  sender: 'CHURCH'
};

const testScheduledSMS = {
  text: 'This is a scheduled message',
  destinations: ['233244567890'],
  schedule: '2024-01-15T10:00:00+00:00',
  sender: 'CHURCH'
};

// Helper function to make API requests
async function apiRequest(endpoint, method = 'POST', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();

    console.log(`\n=== ${method} ${endpoint} ===`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));

    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error);
    return { status: 500, data: { error: error.message } };
  }
}

// Test functions
async function testBalance() {
  console.log('\n🔍 Testing Balance Check...');
  const result = await apiRequest('/balance', 'GET');
  return result.status === 200;
}

async function testSendSMS() {
  console.log('\n📱 Testing Send SMS...');
  const result = await apiRequest('/send-sms', 'POST', testSMS);
  return result.status === 200;
}

async function testPersonalizedSMSAPI() {
  console.log('\n👥 Testing Personalized SMS...');
  const result = await apiRequest('/send-personalised-sms', 'POST', testPersonalizedSMS);
  return result.status === 200;
}

async function testBroadcastSMSAPI() {
  console.log('\n📢 Testing Broadcast SMS...');
  const result = await apiRequest('/broadcast', 'POST', testBroadcastSMS);
  return result.status === 200;
}

async function testScheduledSMSAPI() {
  console.log('\n⏰ Testing Scheduled SMS...');
  const result = await apiRequest('/schedule-sms', 'POST', testScheduledSMS);
  return result.status === 200;
}

async function testDeliveryPushAPI() {
  console.log('\n📬 Testing Delivery Push...');
  const deliveryData = {
    handshake: {
      id: 0,
      label: 'HSHK_OK'
    },
    data: [
      {
        message_id: 'test-msg-123',
        phone: '233244567890',
        status: 1, // delivered
        timestamp: '2024-01-15T10:00:00+00:00',
        error: null
      }
    ]
  };
  const result = await apiRequest('/delivery-push', 'POST', deliveryData);
  return result.status === 200;
}

async function testConnectivity() {
  console.log('\n🔌 Testing Connectivity...');
  const result = await apiRequest('/test-sms-connectivity', 'POST', { action: 'balance' });
  return result.status === 200;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting SMSOnlineGH Integration Tests...\n');
  
  const tests = [
    { name: 'Connectivity Test', fn: testConnectivity },
    { name: 'Balance Check', fn: testBalance },
    { name: 'Send SMS', fn: testSendSMS },
    { name: 'Personalized SMS', fn: testPersonalizedSMSAPI },
    { name: 'Broadcast SMS', fn: testBroadcastSMSAPI },
    { name: 'Scheduled SMS', fn: testScheduledSMSAPI },
    { name: 'Delivery Push', fn: testDeliveryPushAPI }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      console.log(`✅ ${test.name}: ${result ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      results.push({ name: test.name, passed: false, error });
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (passed === total) {
    console.log('🎉 All tests passed! SMS integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(results => {
      process.exit(results.every(r => r.passed) ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testBalance, testSendSMS, testPersonalizedSMSAPI, testBroadcastSMSAPI, testScheduledSMSAPI, testDeliveryPushAPI };
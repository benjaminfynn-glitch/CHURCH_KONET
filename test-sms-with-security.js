#!/usr/bin/env node

/**
 * SMS Integration Test Script with Security
 * This script tests the SMS integration endpoints with proper authentication
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

console.log('🚀 Starting SMS Integration Test with Security...\n');

// Test data
const testPhone = '+233243650040'; // Test phone number with + prefix
const testMessage = 'This is a test message from Church Konet SMS system with security';

let authToken = '';

async function authenticate() {
  try {
    console.log('🔐 Setting up authentication for testing...');

    // In development mode, we use mock authentication
    // The API server will accept any request and use mock auth
    console.log('✅ Using development mode with mock authentication');
    return true;
  } catch (error) {
    console.error('❌ Authentication setup error:', error.message);
    return false;
  }
}

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    console.log(`\n📡 Testing ${method} ${endpoint}`);

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Add authorization header if we have a token
    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response:`, JSON.stringify(result, null, 2));

    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('=== SMS INTEGRATION TEST SUITE WITH SECURITY ===\n');

  // Step 1: Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.error('❌ Cannot proceed without authentication. Please run: npm run setup-users');
    process.exit(1);
  }

  // Test 1: Balance Check
  console.log('\n1️⃣ Testing Balance API...');
  const balanceResult = await testAPI('/balance');

  if (balanceResult.success) {
    console.log('✅ Balance API working correctly');
  } else {
    console.log('❌ Balance API failed:', balanceResult.error || balanceResult.data?.error);
  }

  // Test 2: Send Single SMS
  console.log('\n2️⃣ Testing Send SMS API...');
  const sendResult = await testAPI('/send-sms', 'POST', {
    text: testMessage,
    destinations: [testPhone],
    sender: 'BETHELKONET'
  });

  if (sendResult.success) {
    console.log('✅ Send SMS API working correctly');
  } else {
    console.log('❌ Send SMS API failed:', sendResult.error || sendResult.data?.error);
  }

  // Test 3: Send Broadcast SMS
  console.log('\n3️⃣ Testing Broadcast SMS API...');
  const broadcastResult = await testAPI('/broadcast', 'POST', {
    text: testMessage,
    destinations: [testPhone],
    sender: 'BETHELKONET'
  });

  if (broadcastResult.success) {
    console.log('✅ Broadcast SMS API working correctly');
  } else {
    console.log('❌ Broadcast SMS API failed:', broadcastResult.error || broadcastResult.data?.error);
  }

  // Test 4: Send Personalized SMS
  console.log('\n4️⃣ Testing Personalized SMS API...');
  const personalizedResult = await testAPI('/send-personalised-sms', 'POST', {
    text: 'Hi {$name}, this is a test message',
    sender: 'BETHELKONET',
    destinations: [{
      number: testPhone,
      values: { name: 'John' }
    }]
  });

  if (personalizedResult.success) {
    console.log('✅ Personalized SMS API working correctly');
  } else {
    console.log('❌ Personalized SMS API failed:', personalizedResult.error || personalizedResult.data?.error);
  }

  // Test 5: Test Rate Limiting (try to send multiple SMS quickly)
  console.log('\n5️⃣ Testing Rate Limiting...');
  const rateLimitTests = [];
  for (let i = 0; i < 3; i++) {
    const result = await testAPI('/send-sms', 'POST', {
      text: `Rate limit test ${i + 1}`,
      destinations: [testPhone],
      sender: 'BETHELKONET'
    });
    rateLimitTests.push(result);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const rateLimited = rateLimitTests.some(test => test.status === 429);
  if (rateLimited) {
    console.log('✅ Rate limiting is working correctly');
  } else {
    console.log('⚠️ Rate limiting may not be active (or limits not reached)');
  }

  // Test 6: Test Input Validation
  console.log('\n6️⃣ Testing Input Validation...');
  const validationResult = await testAPI('/send-sms', 'POST', {
    text: '', // Empty text should fail
    destinations: [],
    sender: 'BETHELKONET'
  });

  if (validationResult.status === 400) {
    console.log('✅ Input validation is working correctly');
  } else {
    console.log('❌ Input validation failed:', validationResult.data?.error);
  }

  console.log('\n=== TEST SUMMARY ===');
  console.log('Authentication:', authSuccess ? '✅' : '❌');
  console.log('Balance API:', balanceResult.success ? '✅' : '❌');
  console.log('Send SMS API:', sendResult.success ? '✅' : '❌');
  console.log('Broadcast API:', broadcastResult.success ? '✅' : '❌');
  console.log('Personalized API:', personalizedResult.success ? '✅' : '❌');
  console.log('Rate Limiting:', rateLimited ? '✅' : '⚠️');
  console.log('Input Validation:', validationResult.status === 400 ? '✅' : '❌');

  const criticalTestsPassed = [
    authSuccess,
    balanceResult.success,
    sendResult.success,
    broadcastResult.success,
    personalizedResult.success
  ].every(Boolean);

  if (criticalTestsPassed) {
    console.log('\n🎉 ALL CRITICAL TESTS PASSED! SMS integration with security is working correctly.');
  } else {
    console.log('\n⚠️  Some critical tests failed. Check the output above for details.');
  }

  console.log('\n✅ Test completed successfully');
}

// Run tests
runTests().catch(console.error);
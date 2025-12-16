#!/usr/bin/env node

/**
 * SMS Integration Test Script
 * This script tests the SMS integration endpoints directly
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

console.log('🚀 Starting SMS Integration Test...\n');

// Test data
const testPhone = '233243650040'; // Test phone number specified by user
const testMessage = 'This is a test message from Church Konet SMS system';

async function testAPI(endpoint, method = 'GET', data = null) {
  try {
    console.log(`\n📡 Testing ${method} ${endpoint}`);
    
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
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response:`, JSON.stringify(result, null, 2));
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('=== SMS INTEGRATION TEST SUITE ===\n');

  // Test 1: Balance Check
  console.log('1️⃣ Testing Balance API...');
  const balanceResult = await testAPI('/balance');
  
  if (balanceResult.success) {
    console.log('✅ Balance API working correctly');
  } else {
    console.log('❌ Balance API failed:', balanceResult.error);
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
    console.log('❌ Send SMS API failed:', sendResult.error);
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
    console.log('❌ Broadcast SMS API failed:', broadcastResult.error);
  }

  // Test 4: Send Personalized SMS
  console.log('\n4️⃣ Testing Personalized SMS API...');
  const personalizedResult = await testAPI('/send-personalised-sms', 'POST', {
    text: 'Hi {$name}, this is a test message',
    sender: 'BETHELKONET',
    destinations: [{
      number: testPhone,
      values: ['John']
    }]
  });

  if (personalizedResult.success) {
    console.log('✅ Personalized SMS API working correctly');
  } else {
    console.log('❌ Personalized SMS API failed:', personalizedResult.error);
  }

  // Test 5: Test SMS Connectivity
  console.log('\n5️⃣ Testing SMS Connectivity API...');
  const connectivityResult = await testAPI('/test-sms-connectivity', 'POST', {
    action: 'balance'
  });

  if (connectivityResult.success) {
    console.log('✅ SMS Connectivity API working correctly');
  } else {
    console.log('❌ SMS Connectivity API failed:', connectivityResult.error);
  }

  console.log('\n=== TEST SUMMARY ===');
  console.log('Balance API:', balanceResult.success ? '✅' : '❌');
  console.log('Send SMS API:', sendResult.success ? '✅' : '❌');
  console.log('Broadcast API:', broadcastResult.success ? '✅' : '❌');
  console.log('Personalized API:', personalizedResult.success ? '✅' : '❌');
  console.log('Connectivity API:', connectivityResult.success ? '✅' : '❌');

  const allPassed = [
    balanceResult.success,
    sendResult.success,
    broadcastResult.success,
    personalizedResult.success,
    connectivityResult.success
  ].every(Boolean);

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! SMS integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run tests
runTests().catch(console.error);
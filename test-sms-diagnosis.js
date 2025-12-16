#!/usr/bin/env node

/**
 * SMS Diagnosis Test Script
 * This script tests the SMS integration with detailed logging to diagnose delivery issues
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

console.log('🚀 Starting SMS Diagnosis Test...\n');

// Test data - use the same phone number that works with direct sending
const testPhone = '233243650040'; // This should be the number that works with direct sending
const testMessage = 'DIAGNOSIS TEST: This message helps identify SMS delivery issues';

// Helper function to make API calls with detailed logging
async function testAPI(endpoint, method = 'GET', data = null, description = '') {
  try {
    console.log(`\n📡 Testing ${method} ${endpoint} ${description ? `- ${description}` : ''}`);
    console.log('📅 Timestamp:', new Date().toISOString());
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
      console.log('📋 Request Payload:', JSON.stringify(data, null, 2));
    }

    const startTime = Date.now();
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ Response Time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📄 Response Length: ${responseText.length} characters`);
    
    // Show first 500 chars of response for quick inspection
    if (responseText.length > 0) {
      console.log(`📝 Response Preview: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.log('⚠️ Response is not valid JSON');
      result = { rawResponse: responseText };
    }
    
    if (result.success !== undefined) {
      console.log(`✅ Success: ${result.success}`);
    }
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }
    
    if (result.data) {
      console.log(`📊 Data Summary:`, JSON.stringify(result.data, null, 2));
    }
    
    if (result.deliveryStatuses) {
      console.log(`📱 Delivery Statuses:`, JSON.stringify(result.deliveryStatuses, null, 2));
    }
    
    return { 
      success: response.ok, 
      data: result, 
      status: response.status,
      responseTime,
      rawResponse: responseText
    };
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 1: Check if the server is running
async function testServerConnectivity() {
  console.log('=== SERVER CONNECTIVITY TEST ===');
  try {
    const response = await fetch(`${API_BASE}/balance`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Server is running and accessible');
    return true;
  } catch (error) {
    console.log('❌ Server is not accessible:', error.message);
    return false;
  }
}

// Test 2: Compare authentication methods
async function compareAuthenticationMethods() {
  console.log('\n=== AUTHENTICATION COMPARISON TEST ===');
  
  // Test 1: Using the app's method (Authorization header)
  console.log('\n1️⃣ Testing App Authentication Method (Authorization header)');
  const appMethodResult = await testAPI('/send-sms', 'POST', {
    text: testMessage,
    destinations: [testPhone],
    sender: 'BETHELKONET'
  }, 'App method (Authorization header)');
  
  // Test 2: Using the direct method (api-key header)
  console.log('\n2️⃣ Testing Direct Authentication Method (api-key header)');
  const directMethodResult = await testAPI('/send-sms', 'POST', {
    text: testMessage,
    destinations: [testPhone],
    sender: 'BETHELKONET'
  }, 'Direct method (api-key header)');
  
  // Compare results
  console.log('\n📊 COMPARISON RESULTS:');
  console.log('App Method Success:', appMethodResult.success);
  console.log('Direct Method Success:', directMethodResult.success);
  
  if (appMethodResult.success && !directMethodResult.success) {
    console.log('🎯 ISSUE IDENTIFIED: App method works, direct method fails');
  } else if (!appMethodResult.success && directMethodResult.success) {
    console.log('🎯 ISSUE IDENTIFIED: Direct method works, app method fails');
  } else if (!appMethodResult.success && !directMethodResult.success) {
    console.log('🚨 ISSUE: Both methods fail - check API key and network');
  } else {
    console.log('✅ Both methods work - issue might be elsewhere');
  }
  
  return { appMethod: appMethodResult, directMethod: directMethodResult };
}

// Test 3: Test phone number formats
async function testPhoneNumberFormats() {
  console.log('\n=== PHONE NUMBER FORMAT TEST ===');
  
  const phoneFormats = [
    { format: 'International with +233', phone: '+233243650040' },
    { format: 'International without +', phone: '233243650040' },
    { format: 'Local with 0', phone: '0243650040' },
    { format: 'Object format', phone: { number: '233243650040' } }
  ];
  
  const results = [];
  
  for (const phoneFormat of phoneFormats) {
    console.log(`\n📱 Testing ${phoneFormat.format}: ${JSON.stringify(phoneFormat.phone)}`);
    const result = await testAPI('/send-sms', 'POST', {
      text: testMessage,
      destinations: [phoneFormat.phone],
      sender: 'BETHELKONET'
    }, `Phone format: ${phoneFormat.format}`);
    
    results.push({
      format: phoneFormat.format,
      phone: phoneFormat.phone,
      success: result.success,
      data: result.data
    });
  }
  
  console.log('\n📊 PHONE FORMAT RESULTS:');
  results.forEach(result => {
    console.log(`${result.format}: ${result.success ? '✅' : '❌'}`);
    if (result.data && result.data.deliveryStatuses) {
      result.data.deliveryStatuses.forEach((status) => {
        console.log(`  ${status.phone}: ${status.status} ${status.error ? '(' + status.error + ')' : ''}`);
      });
    }
  });
  
  return results;
}

// Test 4: Test delivery webhook
async function testDeliveryWebhook() {
  console.log('\n=== DELIVERY WEBHOOK TEST ===');
  
  // First send a test SMS
  console.log('📤 Sending test SMS to trigger delivery webhook...');
  const sendResult = await testAPI('/send-sms', 'POST', {
    text: 'WEBHOOK TEST: This message tests delivery status tracking',
    destinations: [testPhone],
    sender: 'BETHELKONET'
  }, 'Webhook test message');
  
  if (sendResult.success) {
    console.log('✅ Test message sent successfully');
    
    // Check if delivery webhook endpoint is accessible
    console.log('\n📡 Testing delivery webhook endpoint...');
    const webhookResult = await testAPI('/delivery-push', 'POST', {
      handshake: { id: 0, label: 'HSHK_OK' },
      data: [
        {
          message_id: 'test-message-id',
          phone: testPhone,
          status: 1, // delivered
          timestamp: new Date().toISOString(),
          error: null
        }
      ]
    }, 'Delivery webhook test');
    
    console.log('Webhook Test Result:', webhookResult.success ? '✅' : '❌');
  } else {
    console.log('❌ Failed to send test message for webhook test');
  }
}

// Main test runner
async function runDiagnosis() {
  console.log('🔬 SMS DIAGNOSIS TOOL');
  console.log('=====================');
  
  const serverOk = await testServerConnectivity();
  if (!serverOk) {
    console.log('❌ Server connectivity test failed. Cannot proceed with other tests.');
    return;
  }
  
  // Run all tests
  const authComparison = await compareAuthenticationMethods();
  const phoneFormatResults = await testPhoneNumberFormats();
  await testDeliveryWebhook();
  
  // Summary
  console.log('\n📋 DIAGNOSIS SUMMARY');
  console.log('==================');
  
  console.log('\n🔍 Key Findings:');
  
  if (!authComparison.appMethod.success && !authComparison.directMethod.success) {
    console.log('🚨 Both authentication methods failed - check API key configuration');
  } else if (authComparison.appMethod.success && authComparison.directMethod.success) {
    console.log('✅ Authentication is not the issue');
  } else {
    console.log('🎯 Authentication method mismatch detected');
  }
  
  const successfulPhoneFormats = phoneFormatResults.filter(r => r.success);
  if (successfulPhoneFormats.length === 0) {
    console.log('🚨 No phone number format worked - check phone number validation');
  } else if (successfulPhoneFormats.length < phoneFormatResults.length) {
    console.log('🎯 Some phone number formats work, others don\'t');
    console.log('✅ Working formats:', successfulPhoneFormats.map(r => r.format).join(', '));
  } else {
    console.log('✅ All phone number formats work correctly');
  }
  
  console.log('\n💡 Recommendations:');
  console.log('1. Check server logs for detailed error messages');
  console.log('2. Verify SMSOnlineGH API key is valid and has sufficient balance');
  console.log('3. Test with different phone numbers to rule out number-specific issues');
  console.log('4. Check if the destination phones can receive SMS from other sources');
  console.log('5. Verify SMSOnlineGH account status and restrictions');
}

// Run the diagnosis
runDiagnosis().catch(console.error);
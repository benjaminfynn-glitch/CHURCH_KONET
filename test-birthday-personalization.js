#!/usr/bin/env node

// Test script to verify birthday message personalization fix
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

async function testBirthdayPersonalization() {
  console.log('🧪 Testing Birthday Message Personalization Fix\n');
  
  // Test 1: Regular broadcast (should work)
  console.log('=== Test 1: Regular Broadcast ===');
  try {
    const response = await fetch(`${API_BASE}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Happy Birthday to you!',
        destinations: ['233243650040'],
        sender: 'BETHELKONET'
      }),
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('✅ Regular broadcast test completed\n');
  } catch (error) {
    console.error('❌ Regular broadcast test failed:', error);
  }

  // Test 2: Personalized birthday message (should now work)
  console.log('=== Test 2: Personalized Birthday Message ===');
  try {
    const response = await fetch(`${API_BASE}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Happy Birthday, {$name}! May God bless you abundantly.',
        destinations: ['233243650040'],
        sender: 'BETHELKONET'
      }),
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('✅ Personalized birthday message test completed\n');
  } catch (error) {
    console.error('❌ Personalized birthday message test failed:', error);
  }

  // Test 3: Multiple destinations with personalization
  console.log('=== Test 3: Multiple Destinations with Personalization ===');
  try {
    const response = await fetch(`${API_BASE}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Happy Birthday, {$name}! Welcome to Bethel Society.',
        destinations: ['233243650040', '233555678901'],
        sender: 'BETHELKONET'
      }),
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('✅ Multiple destinations personalization test completed\n');
  } catch (error) {
    console.error('❌ Multiple destinations personalization test failed:', error);
  }

  console.log('🎉 All tests completed!');
}

// Run the test
testBirthdayPersonalization();
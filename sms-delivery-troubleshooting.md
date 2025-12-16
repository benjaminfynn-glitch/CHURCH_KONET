# SMS Delivery Troubleshooting Guide

## Problem Statement
SMS messages show as "successfully delivered" in the app but do not reach the intended destination handsets. However, when sending SMS directly via the test endpoint, the messages reach the destination successfully.

## Root Cause Analysis

### 1. Authentication Header Inconsistency ✅ FIXED
**Issue**: Different authentication headers were used across different API endpoints:
- `api/send-sms.ts` used: `Authorization: key ${API_KEY}`
- `api/test-sms-connectivity.ts` used: `api-key: ${API_KEY}`

**Impact**: This could cause authentication failures when using different endpoints.

**Solution**: Standardized all endpoints to use `Authorization: key ${API_KEY}` format.

### 2. Insufficient Error Logging ✅ FIXED
**Issue**: APIs were not capturing detailed error responses from SMSOnlineGH, making it difficult to diagnose delivery failures.

**Impact**: No visibility into actual delivery status or error codes from the SMS provider.

**Solution**: Enhanced all SMS APIs to capture and log:
- Raw responses from SMSOnlineGH
- Parsed JSON responses with detailed error information
- Delivery statuses and error codes

### 3. Phone Number Normalization Complexity ✅ IDENTIFIED
**Issue**: The broadcast API has complex phone number normalization logic that might be causing issues.

**Location**: `api/broadcast.ts` lines 51-57

**Current Logic**:
```typescript
phoneNumber = phoneNumber.replace(/^233/, '').replace(/^\+233/, '').replace(/^0/, '');
if (!phoneNumber.startsWith('+')) {
  return '233' + phoneNumber;
}
return phoneNumber.replace('+', '');
```

**Potential Issues**:
- Multiple regex replacements could interfere with each other
- Logic might not handle all international formats correctly
- Could result in invalid phone numbers

## Enhanced Debugging Tools Created

### 1. Enhanced SMS APIs ✅ COMPLETED
All SMS APIs now provide:
- Raw response logging
- Detailed error information
- Delivery status tracking
- Performance metrics (response time)

### 2. Comprehensive Diagnosis Script ✅ COMPLETED
Created `test-sms-diagnosis.js` with the following tests:

#### Server Connectivity Test
- Verifies the server is running and accessible
- Tests basic API endpoint availability

#### Authentication Comparison Test
- Compares app authentication method vs direct method
- Identifies authentication inconsistencies
- Tests both `Authorization` and `api-key` header formats

#### Phone Number Format Test
- Tests multiple phone number formats:
  - International with +233
  - International without +
  - Local with 0
  - Object format
- Identifies which formats work and which don't

#### Delivery Webhook Test
- Tests the delivery status webhook endpoint
- Verifies webhook processing functionality

## Recommended Testing Procedure

### Step 1: Run the Diagnosis Script
```bash
node test-sms-diagnosis.js
```

This will provide a comprehensive analysis of the SMS delivery system and identify specific issues.

### Step 2: Check Server Logs
After running tests, check the server logs for:
- Authentication errors
- API response details
- Delivery status information
- Performance metrics

### Step 3: Test with Different Phone Numbers
Use the diagnosis script to test with various phone number formats to identify format-specific issues.

### Step 4: Verify SMSOnlineGH Configuration
- Check API key validity
- Verify account balance
- Confirm account status is active
- Check for any account restrictions

## Additional Recommendations

### 1. Standardize Phone Number Handling
Consider implementing a centralized phone number validation and normalization service to ensure consistency across all APIs.

### 2. Implement Delivery Status Tracking
Enhance the delivery webhook handler to:
- Store delivery status in the database
- Provide real-time delivery status updates
- Handle failed deliveries with retry logic

### 3. Add Circuit Breaker Pattern
Implement circuit breaker logic to:
- Detect repeated failures
- Temporarily disable problematic routes
- Alert administrators when issues occur

### 4. Improve Error Handling
Add comprehensive error handling for:
- Network timeouts
- API rate limits
- Authentication failures
- Invalid phone numbers

## Files Modified

### Enhanced SMS APIs
1. `api/send-sms.ts` - Added detailed logging and error handling
2. `api/send-personalised-sms.ts` - Added detailed logging and error handling
3. `api/broadcast.ts` - Added detailed logging and error handling
4. `api/test-sms-connectivity.ts` - Fixed authentication header inconsistency

### New Tools
1. `test-sms-diagnosis.js` - Comprehensive testing script for SMS delivery issues

## Next Steps

1. Run the diagnosis script to identify specific issues
2. Check server logs for detailed error information
3. Test with different phone number formats
4. Verify SMSOnlineGH account configuration
5. Implement additional recommendations based on findings

## Contact Information

If issues persist after following this guide, please provide:
- Server logs from the test runs
- Output from the diagnosis script
- SMSOnlineGH account details (if applicable)
- Examples of phone numbers that fail to receive messages
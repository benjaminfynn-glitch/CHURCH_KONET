# SMS Integration Debug Guide

Since the SMS integration is still not working after the fixes, let's systematically debug the issue.

## **Step 1: Check Console Output**

When you test the SMS functionality, look for these specific log messages in the browser console:

### **Credentials Debug Section:**
```
=== CREDENTIALS DEBUG ===
API Key present: true/false
API Key length: X
Sender ID present: true/false
Sender ID: [your sender ID]
=== END CREDENTIALS DEBUG ===
```

### **Request/Response Debug Section:**
```
=== SMS BROADCAST DEBUG ===
Request payload: {...}
Response status: 200/400/401/500
Full response: {...}
=== END SMS BROADCAST DEBUG ===
```

## **Step 2: Common Issues to Check**

### **1. Environment Variables Not Loaded**
If you see "API Key present: false" or "Sender ID present: false":

**For Local Development:**
- Ensure `.env` file exists in project root
- Check variable names: `SMSONLINE_API_KEY` and `SMSONLINE_SENDER_ID`
- Restart development server after adding `.env` file

**For Vercel Deployment:**
- Go to Vercel dashboard → Project Settings → Environment Variables
- Add both `SMSONLINE_API_KEY` and `SMSONLINE_SENDER_ID`

### **2. API Authentication Issues**
If credentials are present but still failing:

**Check API Key Format:**
- Should be a long alphanumeric string
- No extra spaces or characters

**Check Sender ID:**
- Must be pre-approved by SMSOnlineGH
- Common approved IDs: "CHURCH", "BETHEL", "CHURCH_KONET", etc.

### **3. Network/API Issues**
If request fails with network errors:

**Test API Directly:**
```bash
# Test with curl (replace with your actual credentials)
curl -X POST https://api.smsonlinegh.com/v5/message/sms/send \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_API_KEY_HERE" \
  -d '{
    "sender": "YOUR_SENDER_ID",
    "text": "Test message",
    "destinations": ["233244567890"]
  }'
```

### **4. Phone Number Issues**
Check if phone numbers are being normalized correctly:

**Expected Format:**
- `0244567890` → `233244567890`
- `+233244567890` → `233244567890`
- `244567890` → `233244567890`

## **Step 3: Advanced Debugging**

### **Add Test Endpoint**
Create a simple test endpoint to verify connectivity:

```javascript
// Create a new file: src/api/test-sms.js
export default async function handler(req, res) {
  try {
    const apiKey = process.env.SMSONLINE_API_KEY;
    const response = await fetch('https://api.smsonlinegh.com/v5/account/balance', {
      headers: {
        'api-key': apiKey
      }
    });
    
    const result = await response.json();
    res.status(200).json({ 
      balance: result,
      apiKeyPresent: !!apiKey,
      responseStatus: response.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### **Check Handshake Response**
Look for these specific error messages in the console:

```
{
  "handshake": {
    "id": 1405,
    "label": "HSHK_ERR_ACCESS_DENIED"
  }
}
```

This means:
- **ID 1405**: API key invalid or missing
- **ID 1406**: Sender ID not approved
- **ID 1407**: Insufficient balance

## **Step 4: Contact SMSOnlineGH Support**

If all else fails, contact SMSOnlineGH with:

1. Your API key (masked if needed)
2. The exact error messages from console
3. A sample request payload you're sending
4. Your sender ID for verification

## **Quick Checklist**

- [ ] Environment variables configured correctly
- [ ] API key is valid and active
- [ ] Sender ID is approved
- [ ] Phone numbers in correct format
- [ ] No network connectivity issues
- [ ] API endpoint is accessible

Share your console output and I can help identify the exact issue.
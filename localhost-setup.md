# Localhost Setup for SMS Testing

## Environment Variables Setup

Create a `.env` file in your project root with the following SMS provider credentials:

```bash
# SMS Provider Configuration (required for SMS to work)
# Updated to match SMSOnlineGH v5 requirements
SMSONLINE_API_KEY=your_api_key_here
SMSONLINE_SENDER_ID=your_sender_id_here

# Firebase Configuration (already in your .env)
VITE_FIREBASE_API_KEY=AIzaSyDuG16WHQCErJ1CqR9dpPFwrSWFLQkc6LE
VITE_FIREBASE_AUTH_DOMAIN=church-konet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=church-konet
VITE_FIREBASE_STORAGE_BUCKET=church-konet.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=317305373118
VITE_FIREBASE_APP_ID=1:317305373118:web:5c8c7e66a30dffa367b9ef
VITE_FIREBASE_MEASUREMENT_ID=G-F7TYLTETG3
```

## Get Your SMS Credentials

1. **SMSOnlineGH API Key**: Contact SMSOnlineGH support to get your API key
2. **Sender ID**: Register an approved sender ID with SMSOnlineGH (e.g., "CHURCH", "BETHEL", etc.)

## Start Local Development Server

```bash
# Install dependencies if not already installed
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` (or similar port)

## Test SMS Functionality

1. Open the app in your browser
2. Navigate to the Broadcast page
3. Select a member or members to send SMS to
4. Enter a test message
5. Click "Broadcast" to send

## Check Console Output

The enhanced logging will show detailed information:

- **Credentials validation**: Whether API key and sender ID are loaded
- **Request details**: Full payload being sent to SMS provider
- **Provider response**: Complete response from SMSOnlineGH API
- **Handshake validation**: Whether the SMS provider accepts the request

## Common Issues to Check

1. **Missing credentials**: Ensure `.env` file has SMS provider keys
2. **CORS issues**: Local development should work with the proxy setup
3. **Network connectivity**: Ensure you can reach `https://api.smsonlinegh.com`
4. **Sender ID approval**: Some sender IDs require pre-approval

## Debug Commands

```bash
# Check if environment variables are loaded
npm run dev

# View console logs in browser (F12 → Console tab)
# Look for "=== CREDENTIALS DEBUG ===" and "=== SMS BROADCAST DEBUG ==="

# Test API endpoint directly (if needed)
curl -X POST http://localhost:3000/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{"text":"Test message","destinations":["233244567890"],"sender":"CHURCH"}'
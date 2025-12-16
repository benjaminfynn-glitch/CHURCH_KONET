import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { action } = req.body;

    const apiKey = process.env.SMSONLINEGH_API_KEY;
    
    console.log('=== SMS CONNECTIVITY TEST ===');
    console.log('API Key present:', !!apiKey);
    console.log('Action requested:', action);
    console.log('==============================');

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Missing SMSONLINE_API_KEY',
        success: false 
      });
    }

    switch (action) {
      case 'balance':
        try {
          console.log('Fetching balance from SMSOnlineGH API...');
          console.log('API Key being used:', apiKey ? 'present' : 'missing');
          console.log('API Key length:', apiKey ? apiKey.length : 'N/A');
          
          const response = await fetch('https://api.smsonlinegh.com/v5/account/balance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `key ${apiKey}`,
            },
            body: JSON.stringify({}),
          });

          console.log('Balance API Response Status:', response.status, response.statusText);
          
          // Get raw response text first
          const responseText = await response.text();
          console.log('Balance API Raw Response Length:', responseText.length);
          console.log('Balance API Raw Response (first 200 chars):', responseText.substring(0, 200));

          // Handle empty or invalid responses
          if (!responseText || responseText.trim() === '') {
            console.error('Empty response from SMSOnlineGH');
            return res.status(502).json({
              error: 'Empty response from SMSOnlineGH API',
              responseStatus: response.status,
              success: false
            });
          }

          let json;
          try {
            json = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response that failed to parse:', responseText);
            return res.status(502).json({
              error: 'Invalid JSON response from SMSOnlineGH',
              rawResponse: responseText,
              responseStatus: response.status,
              parseError: String(parseError),
              success: false
            });
          }

          console.log('Balance API Parsed Response:', JSON.stringify(json, null, 2));

          if (!json?.handshake || json.handshake.id !== 0 || json.handshake.label !== 'HSHK_OK') {
            return res.status(502).json({
              error: 'Balance API handshake failed',
              details: json,
              rawResponse: responseText,
              success: false
            });
          }

          return res.status(200).json({
            success: true,
            balance: json.data,
            message: 'Balance check successful'
          });

        } catch (error) {
          console.error('Balance API Error:', error);
          return res.status(500).json({
            error: 'Balance API failed',
            details: String(error),
            stack: (error as Error).stack,
            success: false
          });
        }

      case 'send-test':
        try {
          // Get phone number from request body
          const { phone } = req.body;
          if (!phone) {
            return res.status(400).json({
              error: 'Phone number is required for test',
              success: false
            });
          }

          const testPayload = {
            destination: phone,
            message: 'This is a test message from Church Konet SMS system',
            sender: 'CHURCH'
          };

          console.log('Sending test SMS to SMSOnlineGH API...');
          console.log('API Key being used:', apiKey ? 'present' : 'missing');
          console.log('API Key preview:', apiKey ? apiKey.substring(0, 10) + '...' : 'missing');
          console.log('Test Phone:', phone);
          console.log('Test Payload:', JSON.stringify(testPayload, null, 2));

          const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `key ${apiKey}`,
            },
            body: JSON.stringify(testPayload),
          });

          console.log('Send SMS API Response Status:', response.status, response.statusText);
          
          // Get raw response text first
          const responseText = await response.text();
          console.log('Send SMS API Raw Response Length:', responseText.length);
          console.log('Send SMS API Raw Response (first 200 chars):', responseText.substring(0, 200));

          // Handle empty or invalid responses
          if (!responseText || responseText.trim() === '') {
            console.error('Empty response from SMSOnlineGH');
            return res.status(502).json({
              error: 'Empty response from SMSOnlineGH API',
              responseStatus: response.status,
              success: false
            });
          }

          let json;
          try {
            json = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response that failed to parse:', responseText);
            return res.status(502).json({
              error: 'Invalid JSON response from SMSOnlineGH',
              rawResponse: responseText,
              responseStatus: response.status,
              parseError: String(parseError),
              success: false
            });
          }

          console.log('Send SMS API Parsed Response:', JSON.stringify(json, null, 2));

          if (!json?.handshake || json.handshake.id !== 0 || json.handshake.label !== 'HSHK_OK') {
            return res.status(502).json({
              error: 'Send SMS API handshake failed',
              details: json,
              rawResponse: responseText,
              success: false
            });
          }

          return res.status(200).json({
            success: true,
            response: json.data,
            message: 'Test SMS sent successfully'
          });

        } catch (error) {
          console.error('Send SMS API Error:', error);
          return res.status(500).json({
            error: 'Send SMS API failed',
            details: String(error),
            stack: (error as Error).stack,
            success: false
          });
        }

      default:
        return res.status(400).json({
          error: 'Invalid action. Use "balance" or "send-test"',
          success: false
        });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Unexpected error',
      details: String(error),
      success: false
    });
  }
}
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  requireAuth,
  smsRateLimit,
  validateSMSInput,
  handleValidationErrors,
  applySecurityHeaders,
  handleOptions,
  logAuditEvent
} from './_middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  // Apply security headers
  applySecurityHeaders(res);

  // Allow ONLY POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed. Use POST.',
    });
  }

  // Apply rate limiting
  try {
    await new Promise((resolve, reject) => {
      smsRateLimit(req as any, res as any, (result: any) => {
        if (result instanceof Error) {
          return reject(result);
        }
        resolve(result);
      });
    });
  } catch (rateLimitError: any) {
    return res.status(429).json({
      error: rateLimitError.message || 'Too many requests',
      retryAfter: rateLimitError.retryAfter || '15 minutes'
    });
  }

  // Authenticate user
  const authResult = await requireAuth(req, res);
  if (!authResult) return;

  const { user } = authResult;

  // Validate input
  await Promise.all(validateSMSInput.map(validation => validation.run(req)));
  if (handleValidationErrors(req, res)) return;

  try {
    const { text, destinations, sender, type = 0 } = req.body;

    // Additional server-side validation
    if (!text?.trim() || !destinations?.length) {
      return res.status(400).json({
        error: 'Missing required fields: text and destinations',
      });
    }

    // Normalize phone numbers for Ghana format
    const normalizedDestinations = destinations.map((num: string) => {
      let phone = String(num).trim();
      // Remove country code prefixes and leading zeros, then add 233
      phone = phone.replace(/^233/, '').replace(/^\+233/, '').replace(/^0/, '');
      return '233' + phone;
    });

    // Send directly to SMSOnlineGH
    const payload = {
      text,
      type, // Use provided type or default to 0
      sender: sender || 'BETHELKONET',
      destinations: normalizedDestinations,
    };

    console.log('=== BROADCAST REQUEST DEBUG ===');
    console.log('URL:', 'https://api.smsonlinegh.com/v5/message/sms/send');
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `key ${process.env.SMSONLINEGH_API_KEY}`.substring(0, 10) + '...',
    });
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('=== END BROADCAST REQUEST DEBUG ===');

    const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `key ${process.env.SMSONLINEGH_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('=== SMSOnlineGH BROADCAST RAW RESPONSE ===');
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Text:', responseText);
    console.log('=== END BROADCAST RAW RESPONSE ===');

    let json;
    try {
      json = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return res.status(502).json({
        error: 'Invalid JSON response from SMSOnlineGH',
        rawResponse: responseText,
        parseError: String(parseError),
      });
    }

    // Enhanced logging for detailed debugging
    console.log('=== SMSOnlineGH BROADCAST PARSED RESPONSE ===');
    console.log('Handshake:', JSON.stringify(json.handshake, null, 2));
    console.log('Data:', JSON.stringify(json.data, null, 2));
    console.log('Errors:', JSON.stringify(json.errors, null, 2));
    console.log('=== END BROADCAST PARSED RESPONSE ===');

    // Strict handshake validation
    if (
      !json?.handshake ||
      json.handshake.id !== 0 ||
      json.handshake.label !== 'HSHK_OK'
    ) {
      console.error('Broadcast handshake validation failed:', json?.handshake);
      return res.status(502).json({
        error: 'SMS provider rejected the broadcast request',
        details: json,
        rawResponse: responseText,
      });
    }

    // Check for any errors in the response
    if (json.errors && json.errors.length > 0) {
      console.error('SMSOnlineGH reported errors:', json.errors);
      return res.status(502).json({
        error: 'SMS provider reported errors',
        details: json.errors,
        rawResponse: responseText,
      });
    }

    // Check delivery statuses
    if (json.data && json.data.destinations && Array.isArray(json.data.destinations)) {
      const deliveryStatuses = json.data.destinations.map((item: any) => ({
        phone: item.to,
        status: item.status?.label || 'unknown',
        message_id: item.id,
        error: item.error || null
      }));
      console.log('Broadcast Delivery Statuses:', JSON.stringify(deliveryStatuses, null, 2));

      // Check if any messages were rejected
      const rejectedMessages = deliveryStatuses.filter(status => status.status !== 'sent' && status.status !== 'delivered');
      if (rejectedMessages.length > 0) {
        console.warn('Some messages were rejected:', rejectedMessages);
        return res.status(502).json({
          error: 'Some SMS messages were rejected by the provider',
          rejectedMessages,
          deliveryStatuses,
          rawResponse: responseText,
        });
      }
    }

    // Successful broadcast
    const responseData = {
      success: true,
      batch: json.data?.batch,
      category: json.data?.category,
      delivery: json.data?.delivery,
      message: 'SMS broadcast sent successfully',
      count: normalizedDestinations.length,
      deliveryStatuses: json.data && json.data.destinations ? json.data.destinations.map((item: any) => ({
        phone: item.to,
        status: item.status?.label || 'sent',
        message_id: item.id
      })) : []
    };

    // Audit log successful broadcast
    await logAuditEvent(
      'SMS_BROADCAST',
      user.uid,
      {
        batch: json.data?.batch,
        destinationCount: normalizedDestinations.length,
        sender: sender || 'BETHELKONET',
        success: true
      },
      req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
      req.headers['user-agent'] as string
    );

    return res.status(200).json(responseData);

  } catch (error: any) {
    console.error('Broadcast API Error:', error?.response?.data || error.message);
    console.error('Error stack:', error.stack);

    // Audit log failed broadcast
    await logAuditEvent(
      'SMS_BROADCAST_FAILED',
      user.uid || 'unknown',
      {
        error: error.message,
        destinationCount: req.body.destinations?.length || 0,
        sender: req.body.sender || 'BETHELKONET',
        success: false
      },
      req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
      req.headers['user-agent'] as string
    );

    return res.status(500).json({
      success: false,
      error: 'Failed to send SMS broadcast',
      details: error?.response?.data || error.message,
    });
  }
}

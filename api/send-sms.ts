import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import {
  requireAuth,
  smsRateLimit,
  validateSMSInput,
  handleValidationErrors,
  applySecurityHeaders,
  handleOptions,
  logAuditEvent
} from "./_middleware.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  // Apply security headers
  applySecurityHeaders(res);

  // ✅ Allow ONLY POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed. Use POST.",
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
    const { text, sender, destinations } = req.body;

    // Log API key being used for debugging (partial for security)
    console.log("API Key length:", process.env.SMSONLINEGH_API_KEY?.length || 'N/A');

    // Additional server-side validation
    if (!text?.trim() || !destinations?.length) {
      return res.status(400).json({
        error: "Missing required fields: text and destinations",
      });
    }

    // 🔥 Send directly to SMSONLINEGH (NO balance checks)
    // Use the exact format that worked in the recent commit
    const payload = {
      text,                // The SMS content
      type: 0,             // 0 = Normal text message (required)
      sender,              // Sender ID
      destinations,        // Destinations array
    };

    // Debug: Log the exact request being sent
    console.log('=== REQUEST DEBUG ===');
    console.log('URL:', 'https://api.smsonlinegh.com/v5/message/sms/send');
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `key ${process.env.SMSONLINEGH_API_KEY}`.substring(0, 10) + '...', // Log partial key for security
    });
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('=== END REQUEST DEBUG ===');

    const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `key ${process.env.SMSONLINEGH_API_KEY}`, // REQUIRED format
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('=== SMSOnlineGH RAW RESPONSE ===');
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Text:', responseText);
    console.log('=== END RAW RESPONSE ===');
    
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
    console.log('=== SMSOnlineGH PARSED RESPONSE ===');
    console.log('Handshake:', JSON.stringify(json.handshake, null, 2));
    console.log('Data:', JSON.stringify(json.data, null, 2));
    console.log('Errors:', JSON.stringify(json.errors, null, 2));
    console.log('=== END PARSED RESPONSE ===');

    // Strict handshake validation
    if (
      !json?.handshake ||
      json.handshake.id !== 0 ||
      json.handshake.label !== 'HSHK_OK'
    ) {
      console.error('Handshake validation failed:', json?.handshake);
      return res.status(502).json({
        error: 'SMS provider rejected or failed the handshake',
        details: json,
        rawResponse: responseText,
      });
    }

    // Check for delivery status in the response
    if (json.data && json.data.destinations && Array.isArray(json.data.destinations)) {
      const deliveryStatuses = json.data.destinations.map((item: any) => ({
        phone: item.to,
        status: item.status?.label,
        message_id: item.id,
        error: null
      }));
      console.log('Delivery Statuses:', JSON.stringify(deliveryStatuses, null, 2));
    }

    // Successful SMS send → return the provider's data
    const responseData = {
      success: true,
      batch: json.data?.batch,
      category: json.data?.category,
      delivery: json.data?.delivery,
      message: 'SMS sent successfully',
      deliveryStatuses: json.data && json.data.destinations ? json.data.destinations.map((item: any) => ({
        phone: item.to,
        status: item.status?.label,
        message_id: item.id
      })) : []
    };

    // Audit log successful SMS send
    await logAuditEvent(
      'SMS_SEND',
      user.uid,
      {
        batch: json.data?.batch,
        destinationCount: destinations.length,
        sender: sender,
        success: true
      },
      req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
      req.headers['user-agent'] as string
    );

    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error("SMS Send Error:", error?.response?.data || error.message);
    console.error("Error stack:", error.stack);
    console.error("Error type:", typeof error);
    console.error("Error object:", JSON.stringify(error, null, 2));

    // Audit log failed SMS send
    await logAuditEvent(
      'SMS_SEND_FAILED',
      user.uid,
      {
        error: error.message,
        destinationCount: req.body.destinations?.length || 0,
        sender: req.body.sender,
        success: false
      },
      req.headers['x-forwarded-for'] as string || req.connection?.remoteAddress,
      req.headers['user-agent'] as string
    );

    return res.status(500).json({
      success: false,
      error: "Failed to send SMS",
      details: error?.response?.data || error.message,
    });
  }
}

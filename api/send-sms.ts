import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Simple test log to verify code is running
  console.log("🚀=== NEW SEND-SMS HANDLER STARTED ===🚀");
  
  // ✅ Allow ONLY POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed. Use POST.",
    });
  }

  try {
    const { text, sender, destinations } = req.body;

    // Log authorization header for debugging
    console.log("Auth Header:", req.headers.authorization);
    
    // Log API key being used for debugging
    console.log("API Key from env:", process.env.SMSONLINEGH_API_KEY);
    console.log("API Key length:", process.env.SMSONLINEGH_API_KEY?.length || 'N/A');

    // Basic validation
    if (!text || !sender || !destinations?.length) {
      return res.status(400).json({
        error: "Missing required fields",
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
    
    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error("SMS Send Error:", error?.response?.data || error.message);
    console.error("Error stack:", error.stack);
    console.error("Error type:", typeof error);
    console.error("Error object:", JSON.stringify(error, null, 2));

    return res.status(500).json({
      success: false,
      error: "Failed to send SMS",
      details: error?.response?.data || error.message,
    });
  }
}

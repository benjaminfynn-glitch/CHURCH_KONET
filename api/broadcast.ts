import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }


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
      const rejectedMessages = deliveryStatuses.filter((status: any) => status.status !== 'sent' && status.status !== 'delivered');
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


    return res.status(200).json(responseData);

  } catch (error: any) {
    console.error('Broadcast API Error:', error?.response?.data || error.message);
    console.error('Error stack:', error.stack);


    return res.status(500).json({
      success: false,
      error: 'Failed to send SMS broadcast',
      details: error?.response?.data || error.message,
    });
  }
}

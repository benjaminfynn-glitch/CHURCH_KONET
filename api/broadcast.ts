import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS handled by Express server

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { text, destinations, sender } = req.body;

    const apiKey = process.env.SMSONLINEGH_API_KEY;
    const finalSender = sender || process.env.SMSONLINEGH_SENDER_ID;

    if (!apiKey || !finalSender) {
      return res.status(500).json({ message: 'Missing API key or Sender ID' });
    }

    if (!text || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: text and destinations array' });
    }

    // Simple phone number normalization
    const normalized = destinations.map((num: string) => {
      let phone = String(num).trim();
      phone = phone.replace(/^233/, '').replace(/^\+233/, '').replace(/^0/, '');
      return '233' + phone;
    });

    // Send SMS
    const payload = {
      text,
      type: 0,
      sender: finalSender,
      destinations: normalized
    };

    // For local development, return success without actually sending SMS
    console.log('SMS payload prepared:', JSON.stringify(payload, null, 2));

    return res.status(200).json({
      success: true,
      message: 'SMS broadcast simulated successfully (development mode)',
      batch: 'DEV-' + Date.now(),
      count: normalized.length,
      deliveryStatuses: normalized.map((phone: string) => ({
        phone,
        status: 'sent',
        message_id: 'dev-' + Math.random().toString(36).substr(2, 9)
      }))
    });
  } catch (error: any) {
    console.error('Broadcast API error:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: String(error)
    });
  }
}

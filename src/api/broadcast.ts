import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { text, destinations, sender } = req.body;

    if (!text) return res.status(400).json({ message: 'text is required' });
    if (!Array.isArray(destinations) || destinations.length === 0)
      return res.status(400).json({ message: 'destinations[] is required' });

    const apiKey = process.env.SMSONLINEGH_API_KEY;
    const finalSender = sender || process.env.SMSONLINEGH_SENDER_ID;

    if (!apiKey || !finalSender)
      return res.status(500).json({ message: 'Missing API key or Sender ID' });

    const payload = {
      text,
      type: 0, // BROADCAST SMS
      sender: finalSender,
      destinations, // array of phone numbers (strings)
    };

    const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `key ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    // Validate handshake (required to ensure send was accepted)
    if (!json?.handshake || json.handshake.id !== 0 || json.handshake.label !== 'HSHK_OK') {
      return res.status(502).json({
        message: 'SMS provider rejected broadcast',
        provider: json,
      });
    }

    return res.status(200).json({
      success: true,
      provider: json.data,
      count: destinations.length,
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Internal Server Error', error: String(err) });
  }
}

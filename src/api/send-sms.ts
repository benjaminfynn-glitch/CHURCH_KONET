// /api/send.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { text, sender, destinations } = req.body;

    // Validate fields strictly according to SMSOnlineGH documentation
    if (!text || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({
        error: 'Fields required: text, destinations[]',
      });
    }

    // Remove duplicates ONLY for non-personalized messages
    const uniqueDestinations = Array.from(
      new Set(
        destinations
          .map((d: string) => d?.trim())
          .filter(Boolean)
      )
    );

    const apiKey = process.env.SMSONLINEGH_API_KEY;
    const finalSender = sender || process.env.SMSONLINEGH_SENDER_ID;

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing SMSONLINEGH_API_KEY in environment' });
    }

    if (!finalSender) {
      return res.status(500).json({ error: 'Missing SMSONLINEGH_SENDER_ID in environment' });
    }

    // Build the correct SMSOnlineGH payload
    const payload = {
      text,                // The SMS content
      type: 0,             // 0 = Normal text message (required)
      sender: finalSender, // Sender ID
      destinations: uniqueDestinations
    };

    const response = await fetch(
      'https://api.smsonlinegh.com/v5/message/sms/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `key ${apiKey}`, // REQUIRED format
        },
        body: JSON.stringify(payload),
      }
    );

    const json = await response.json();

    // Strict handshake validation
    if (
      !json?.handshake ||
      json.handshake.id !== 0 ||
      json.handshake.label !== 'HSHK_OK'
    ) {
      return res.status(502).json({
        error: 'SMS provider rejected or failed the handshake',
        details: json,
      });
    }

    // Successful SMS send → return the provider’s data
    return res.status(200).json(json.data);

  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}

// /api/send-personalised.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { text, sender, destinations } = req.body;

    // destinations format MUST be: [{ number: "024xxxx", values: [...] }]
    if (
      !text ||
      !destinations ||
      !Array.isArray(destinations) ||
      destinations.length === 0
    ) {
      return res.status(400).json({
        error: 'text and personalised destinations[] are required',
      });
    }

    const apiKey = process.env.SMSONLINEGH_API_KEY;
    const finalSender = sender || process.env.SMSONLINEGH_SENDER_ID;

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing SMSONLINEGH_API_KEY in environment' });
    }

    if (!finalSender) {
      return res.status(500).json({ error: 'Missing SMSONLINEGH_SENDER_ID in environment' });
    }

    // DO NOT dedupe personalised numbers — duplicates allowed
    const payload = {
      text,                 // The message template with placeholders
      type: 0,              // SMS type required by SMSOnlineGH
      sender: finalSender,  // e.g. "BethelSociety"
      destinations          // [{ number, values }] EXACTLY as API requires
    };

    const response = await fetch(
      'https://api.smsonlinegh.com/v5/message/sms/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `key ${apiKey}`,
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
        error: 'SMS provider rejected personalised request',
        details: json,
      });
    }

    return res.status(200).json(json.data);
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}

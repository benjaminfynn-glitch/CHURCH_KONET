// /api/all-members.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { text, phones, members, sender } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    // Collect numbers from either phones[] or members[]
    const collected: string[] = [];

    if (Array.isArray(phones)) {
      collected.push(
        ...phones
          .map((p: string) => (p || '').trim())
          .filter(Boolean)
      );
    }

    if (Array.isArray(members)) {
      collected.push(
        ...members
          .map((m: any) => (m?.phone || '').trim())
          .filter(Boolean)
      );
    }

    if (collected.length === 0) {
      return res.status(400).json({
        error: 'No recipient phone numbers provided',
      });
    }

    // Deduplicate (non-personalised ONLY)
    const uniquePhones = Array.from(new Set(collected));

    const apiKey = process.env.SMSONLINEGH_API_KEY;
    const finalSender = sender || process.env.SMSONLINEGH_SENDER_ID;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Missing SMSONLINEGH_API_KEY in environment',
      });
    }

    if (!finalSender) {
      return res.status(500).json({
        error: 'Missing SMSONLINEGH_SENDER_ID in environment',
      });
    }

    const payload = {
      text,
      type: 0,
      sender: finalSender,
      destinations: uniquePhones, // MUST be array of strings
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

    // Validate handshake exactly as docs require
    if (
      !json?.handshake ||
      json.handshake.id !== 0 ||
      json.handshake.label !== 'HSHK_OK'
    ) {
      return res.status(502).json({
        error: 'SMS provider rejected broadcast',
        details: json,
      });
    }

    return res.status(200).json({
      success: true,
      provider: json.data,
      uniqueCount: uniquePhones.length,
    });

  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}

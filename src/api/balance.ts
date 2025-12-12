import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const apiKey = process.env.SMSONLINEGH_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing API key in environment' });
    }

    const response = await fetch('https://api.smsonlinegh.com/v5/account/balance', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `key ${apiKey}`, // MUST include "key "
      }
    });

    const json = await response.json();

    // Required handshake validation
    if (!json?.handshake || json.handshake.id !== 0 || json.handshake.label !== 'HSHK_OK') {
      return res.status(502).json({
        error: 'Provider rejected balance request',
        details: json
      });
    }

    // Return the account balance
    return res.status(200).json(json.data);
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}

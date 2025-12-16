import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const apiKey = process.env.SMSONLINEGH_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing SMSONLINE_API_KEY in environment' });
    }

    const response = await fetch('https://api.smsonlinegh.com/v5/account/balance', {
      method: 'GET',
      headers: {
        'Authorization': `key ${apiKey}`, // MUST include "key "
      }
    });

    const json = await response.json();

    // Enhanced logging for debugging
    console.log('=== BALANCE API DEBUG ===');
    console.log('API Key present:', !!apiKey);
    console.log('Response status:', response.status);
    console.log('Full response:', JSON.stringify(json, null, 2));
    console.log('=== END BALANCE API DEBUG ===');

    // Required handshake validation
    if (!json?.handshake || json.handshake.id !== 0 || json.handshake.label !== 'HSHK_OK') {
      console.error('Balance handshake validation failed:', json?.handshake);
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

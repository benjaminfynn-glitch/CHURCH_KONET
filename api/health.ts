import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const apiKey = process.env.SMSONLINEGH_API_KEY;

    if (!apiKey) {
      console.log('=== HEALTH CHECK: SMS API Key NOT configured ===');
      return res.status(200).json({
        status: 'offline',
        smsService: 'not_configured',
        message: 'SMS API key is not configured. Please set SMSONLINEGH_API_KEY environment variable.'
      });
    }

    console.log('=== HEALTH CHECK: Testing SMS API connectivity ===');

    const response = await fetch('https://api.smsonlinegh.com/v5/account/balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `key ${apiKey}`,
      },
      body: JSON.stringify({}),
    });

    console.log('Health check response status:', response.status);

    const responseText = await response.text();
    let json;
    try {
      json = JSON.parse(responseText);
    } catch {
      return res.status(200).json({
        status: 'offline',
        smsService: 'invalid_response',
        message: 'SMS API returned invalid response'
      });
    }

    if (json?.handshake?.id === 0 && json?.handshake?.label === 'HSHK_OK') {
      console.log('=== HEALTH CHECK: SMS API Online ===');
      return res.status(200).json({
        status: 'online',
        smsService: 'smsonlinegh',
        balance: json.data,
        message: 'SMS service is operational'
      });
    }

    console.log('=== HEALTH CHECK: SMS API handshake failed ===');
    return res.status(200).json({
      status: 'offline',
      smsService: 'handshake_failed',
      message: 'SMS API handshake failed'
    });

  } catch (error: any) {
    console.error('=== HEALTH CHECK ERROR ===', error.message);
    return res.status(200).json({
      status: 'offline',
      smsService: 'error',
      message: error.message || 'Failed to connect to SMS service'
    });
  }
}
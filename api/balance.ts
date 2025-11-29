export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.SMSONLINE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: 'Server Configuration Error: Missing API Key' });
    }

    const response = await fetch('https://api.smsonlinegh.com/v5/account/balance', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `key ${apiKey}`
      }
    });

    if (!response.ok) {
        throw new Error(`Upstream Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.handshake && data.handshake.id === 0) {
      // Map API response to Frontend Type: BalanceResponse
      return res.status(200).json({
        balance: data.data?.balance || 0,
        currency: data.data?.currency || 'GHS'
      });
    } else {
      return res.status(502).json({ message: 'Failed to retrieve balance from gateway' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
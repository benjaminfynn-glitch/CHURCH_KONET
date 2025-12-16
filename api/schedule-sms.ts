// /api/schedule-sms.ts
type Req = any;
type Res = any;

export default async function handler(req: Req, res: Res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { text, destinations, sender, schedule } = req.body;

    // Basic validation
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    if (!Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ error: 'destinations[] is required' });
    }

    const apiKey = process.env.SMSONLINEGH_API_KEY;
    const finalSender = sender || process.env.SMSONLINEGH_SENDER_ID;

    // Enhanced logging for credentials validation
    console.log('=== SCHEDULE-SMS CREDENTIALS DEBUG ===');
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 'N/A');
    console.log('Sender ID present:', !!finalSender);
    console.log('Sender ID:', finalSender);
    console.log('=== END SCHEDULE-SMS CREDENTIALS DEBUG ===');

    if (!apiKey || !finalSender) {
      console.error('Missing credentials - API Key:', !!apiKey, 'Sender ID:', !!finalSender);
      return res.status(500).json({ error: 'Missing API key or sender ID in environment' });
    }

    const payload: any = {
      text,
      sender: finalSender,
      destinations,
      channel: 0, // 0 = Default channel
      type: 0    // 0 = Normal text message
    };

    if (schedule) {
      payload.send_at = schedule; // CORRECT field name per SMSOnlineGH v5
    }

    const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key ${apiKey}`, // MUST include "key "
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    // Enhanced logging for debugging
    console.log('=== SCHEDULE-SMS DEBUG ===');
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    console.log('Response status:', response.status);
    console.log('Full response:', JSON.stringify(json, null, 2));
    console.log('=== END SCHEDULE-SMS DEBUG ===');

    // Validate handshake per SMSONLINEGH docs
    if (!json?.handshake || json.handshake.id !== 0 || json.handshake.label !== 'HSHK_OK') {
      console.error('Handshake validation failed:', json?.handshake);
      return res.status(502).json({ error: 'Provider rejected scheduled SMS', details: json });
    }

    if (json.data && json.data.destinations && json.data.destinations.length > 0) {
      console.log('SMS scheduled successfully for destinations:', json.data.destinations.map((d: any) => ({ phone: d.to, status: d.status?.label })));
    } else {
      console.warn('No data returned from SMSONLINEGH for scheduled SMS');
    }

    return res.status(200).json(json.data);
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}

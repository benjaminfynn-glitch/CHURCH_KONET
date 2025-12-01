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

    if (!apiKey || !finalSender) {
      return res.status(500).json({ error: 'Missing API key or sender ID in environment' });
    }

    const payload: any = {
      text,
      type: 0,
      sender: finalSender,
      destinations,
    };

    if (schedule) {
      payload.schedule = schedule; // must be "YYYY-MM-DD HH:MM:SS"
    }

    const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `key ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    // Validate handshake per SMSONLINEGH docs
    if (!json?.handshake || json.handshake.id !== 0 || json.handshake.label !== 'HSHK_OK') {
      return res.status(502).json({ error: 'Provider rejected scheduled SMS', details: json });
    }

    return res.status(200).json(json.data);
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}

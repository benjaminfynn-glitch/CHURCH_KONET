export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { text, type, sender, destinations, schedule } = req.body;
    const apiKey = process.env.SMSONLINE_API_KEY;

    if (!apiKey) {
      console.error("Missing SMSONLINE_API_KEY environment variable");
      return res.status(500).json({ message: 'Server Configuration Error: Missing API Key' });
    }

    // Construct Payload for SMSOnlineGH
    const smsPayload: any = {
      text,
      type,
      sender,
      destinations
    };

    if (schedule) {
      smsPayload.schedule = schedule;
    }

    const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `key ${apiKey}`
      },
      body: JSON.stringify(smsPayload)
    });

    const data = await response.json();

    // Strict Handshake Validation as per requirements
    // handshake.id must be 0 and label must be "HSHK_OK"
    if (data.handshake && data.handshake.id === 0 && data.handshake.label === "HSHK_OK") {
      return res.status(200).json(data);
    } else {
      console.error("SMS Gateway Error:", JSON.stringify(data));
      return res.status(400).json({ 
        message: data.handshake?.error || 'SMS Gateway Handshake Failed',
        handshake: data.handshake 
      });
    }
  } catch (error: any) {
    console.error("Broadcast API Error:", error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
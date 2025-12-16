// /api/send-personalised.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { text, sender, destinations } = req.body;

    // destinations format MUST be: [{ destination: "23324xxxx", values: { name: "John" } }]
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

    // Enhanced logging for credentials validation
    console.log('=== SEND-PERSONALISED-SMS CREDENTIALS DEBUG ===');
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 'N/A');
    console.log('Sender ID present:', !!finalSender);
    console.log('Sender ID:', finalSender);
    console.log('=== END SEND-PERSONALISED-SMS CREDENTIALS DEBUG ===');

    if (!apiKey) {
      console.error('Missing SMSONLINEGH_API_KEY');
      return res.status(500).json({ error: 'Missing SMSONLINEGH_API_KEY in environment' });
    }

    if (!finalSender) {
      console.error('Missing SMSONLINEGH_SENDER_ID');
      return res.status(500).json({ error: 'Missing SMSONLINEGH_SENDER_ID in environment' });
    }

    // For SMSOnlineGH, we need to replace placeholders and send as individual messages
    const individualMessages = destinations.map((dest: any) => {
      const destination = dest.number || dest.destination;
      let name = '';
      
      if (Array.isArray(dest.values)) {
        // Handle array format from frontend: ["Ben"]
        name = dest.values[0] || '';
      } else {
        // Handle object format: { name: "Ben" }
        name = dest.values?.name || dest.name || '';
      }
      
      // Replace {$name} placeholder with actual name
      const personalizedText = text.replace('{$name}', name);
      
      return {
        text: personalizedText,
        destination,
        sender: finalSender
      };
    });

    // Send each personalized message individually
    const results = [];
    for (const message of individualMessages) {
      const payload = {
        text: message.text,
        type: 0,
        sender: message.sender,
        destinations: [message.destination]
      };

      const response = await fetch(
        'https://api.smsonlinegh.com/v5/message/sms/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `key ${apiKey}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();
      console.log('=== PERSONALIZED SMS DEBUG ===');
      console.log('Message to:', message.destination);
      console.log('Personalized text:', message.text);
      console.log('Response status:', response.status, response.statusText);
      console.log('Raw response:', responseText);
      console.log('=== END PERSONALIZED SMS DEBUG ===');
      
      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error for personalized SMS:', parseError);
        console.error('Response that failed to parse:', responseText);
        return res.status(502).json({
          error: 'Invalid JSON response from SMSOnlineGH for personalized SMS',
          rawResponse: responseText,
          parseError: String(parseError),
        });
      }

      // Enhanced logging for debugging
      console.log('=== PERSONALIZED SMS PARSED RESPONSE ===');
      console.log('Handshake:', JSON.stringify(json.handshake, null, 2));
      console.log('Data:', JSON.stringify(json.data, null, 2));
      console.log('Errors:', JSON.stringify(json.errors, null, 2));
      console.log('=== END PERSONALIZED SMS PARSED RESPONSE ===');

      // Validate handshake
      if (
        !json?.handshake ||
        json.handshake.id !== 0 ||
        json.handshake.label !== 'HSHK_OK'
      ) {
        console.error('Handshake validation failed for personalized SMS:', json?.handshake);
        return res.status(502).json({
          error: 'SMS provider rejected personalised request',
          details: json,
        });
      }

      if (json.data && json.data.destinations && Array.isArray(json.data.destinations)) {
        const deliveryStatuses = json.data.destinations.map((d: any) => ({
          phone: d.to,
          status: d.status?.label,
          message_id: d.id,
          error: null
        }));
        console.log('Personalized SMS delivery statuses:', JSON.stringify(deliveryStatuses, null, 2));
      } else {
        console.warn('No data returned from SMSONLINEGH for personalized SMS');
      }

      results.push(json.data);
    }

    return res.status(200).json({
      success: true,
      provider: results.flat(),
      count: individualMessages.length,
    });

  } catch (err: any) {
    console.error('Personalized SMS Error:', err);
    return res.status(500).json({ error: String(err) });
  }
}

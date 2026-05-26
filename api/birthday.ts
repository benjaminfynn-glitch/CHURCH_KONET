import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Only POST allowed' });

  try {
    const { member, members, sender } = req.body;

    const targets: { number: string; values: any[] }[] = [];

    if (member) {
      if (!member.phone || !member.fullName)
        return res.status(400).json({
          error: 'member.fullName and member.phone required',
        });

      targets.push({
        number: member.phone,
        values: [member.fullName],
      });
    } else if (Array.isArray(members)) {
      for (const m of members) {
        if (!m?.phone || !m?.fullName) continue;

        targets.push({
          number: m.phone,
          values: [m.fullName],
        });
      }

      if (targets.length === 0)
        return res.status(400).json({ error: 'No valid members provided' });
    } else {
      return res
        .status(400)
        .json({ error: 'member or members[] required' });
    }

    const textTemplate = `Happy Birthday, {0}
May God's light and love shine brightly upon you, filling your day and the year ahead with abundant blessings and happiness. We're so grateful for your wonderful presence at Bethel Society, Efutu.

Bethel, Nyame wa ha!`;

    const apiKey = process.env.SMSONLINEGH_API_KEY;
    const finalSender =
      sender || process.env.SMSONLINEGH_SENDER_ID;

    if (!apiKey || !finalSender)
      return res.status(500).json({
        error: 'Missing API key or sender ID in environment',
      });

    const results = [];
    for (const target of targets) {
      const name = target.values[0] || '';
      const personalizedText = textTemplate.replace('{0}', name);

      const payload = {
        text: personalizedText,
        type: 0,
        sender: finalSender,
        destinations: [target.number],
      };

      console.log('=== BIRTHDAY SMS DEBUG ===');
      console.log('Sending to:', target.number);
      console.log('Name:', name);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('=== END BIRTHDAY SMS DEBUG ===');

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

      const responseText = await response.text();
      console.log('=== BIRTHDAY SMS RESPONSE ===');
      console.log('Status:', response.status, response.statusText);
      console.log('Response:', responseText);
      console.log('=== END BIRTHDAY SMS RESPONSE ===');

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        results.push({ success: false, error: 'Invalid JSON response', raw: responseText });
        continue;
      }

      if (
        !json?.handshake ||
        json.handshake.id !== 0 ||
        json.handshake.label !== 'HSHK_OK'
      ) {
        console.error('Handshake failed:', json?.handshake);
        results.push({ success: false, error: 'SMS provider rejected request', details: json });
        continue;
      }

      results.push({
        success: true,
        data: json.data,
        deliveryStatuses: json.data?.destinations?.map((d: any) => ({
          phone: d.to,
          status: d.status?.label,
          message_id: d.id
        })) || []
      });
    }

    const allSuccess = results.every(r => r.success);
    return res.status(allSuccess ? 200 : 502).json({
      success: allSuccess,
      results,
      count: targets.length
    });
  } catch (err: any) {
    console.error('Birthday SMS Error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
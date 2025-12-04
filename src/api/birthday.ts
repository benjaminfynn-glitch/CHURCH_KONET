// /api/birthday.ts
type Req = any;
type Res = any;

export default async function handler(req: Req, res: Res) {
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

      // For personalized SMS: values array aligns with template placeholders
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

    // IMPORTANT: personalized template uses {0} for the first dynamic value
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

    const payload = {
      text: textTemplate,
      type: 2, // PERSONALIZED SMS (REQUIRED)
      sender: finalSender,
      destinations: targets,
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

    if (
      !json?.handshake ||
      json.handshake.id !== 0 ||
      json.handshake.label !== 'HSHK_OK'
    ) {
      return res.status(502).json({
        error: 'SMS provider rejected birthday message',
        details: json,
      });
    }

    return res
      .status(200)
      .json({ success: true, provider: json.data });
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
}

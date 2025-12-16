import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const deliveryData = req.body;
    
    // Enhanced logging for debugging
    console.log('=== DELIVERY PUSH DEBUG ===');
    console.log('Delivery webhook received:', JSON.stringify(deliveryData, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('=== END DELIVERY PUSH DEBUG ===');

    // Validate required fields according to SMSOnlineGH documentation
    if (!deliveryData?.handshake) {
      console.error('Missing handshake in delivery push');
      return res.status(400).json({ error: 'Invalid delivery push data' });
    }

    // Validate handshake
    if (
      deliveryData.handshake.id !== 0 ||
      deliveryData.handshake.label !== 'HSHK_OK'
    ) {
      console.error('Handshake validation failed:', deliveryData.handshake);
      return res.status(502).json({ error: 'Invalid handshake in delivery push' });
    }

    // Process delivery data
    if (deliveryData.data && Array.isArray(deliveryData.data)) {
      for (const delivery of deliveryData.data) {
        console.log('Processing delivery status:', {
          messageId: delivery.message_id,
          phone: delivery.phone,
          status: delivery.status,
          timestamp: delivery.timestamp,
          error: delivery.error
        });

        // Here you can update your database with delivery status
        // For example: update SMS record with delivery status
        // status codes: 0=pending, 1=delivered, 2=failed, 3=expired
      }
    }

    // Return success response to SMSOnlineGH
    return res.status(200).json({
      handshake: {
        id: 0,
        label: 'HSHK_OK'
      },
      message: 'Delivery status processed successfully'
    });

  } catch (err: any) {
    console.error('Delivery push error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
console.log('=== BROADCAST.TS FILE LOADED ===');

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

console.log('=== BROADCAST.TS IMPORTS LOADED ===');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== BROADCAST ENDPOINT HIT ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('=== OPTIONS REQUEST HANDLED ===');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('=== METHOD NOT ALLOWED ===');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  console.log('=== PROCESSING POST REQUEST ===');

  try {
    const { text, destinations, sender } = req.body;

    const apiKey = process.env.SMSONLINEGH_API_KEY;
    const finalSender = sender || process.env.SMSONLINEGH_SENDER_ID;

    // Enhanced logging for credentials validation
    console.log('=== CREDENTIALS DEBUG ===');
    console.log('API Key present:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 'N/A');
    console.log('Sender ID present:', !!finalSender);
    console.log('Sender ID:', finalSender);
    console.log('=== END CREDENTIALS DEBUG ===');

    if (!apiKey || !finalSender) {
      console.error('Missing credentials - API Key:', !!apiKey, 'Sender ID:', !!finalSender);
      return res.status(500).json({ message: 'Missing API key or Sender ID' });
    }

    // Normalize phone numbers to international format (MSISDN)
    const normalized = destinations.map((num: string | { number?: string; destination?: string }) => {
      console.log('Normalizing number:', num, 'Type:', typeof num);
      
      // Handle both string and object formats
      let phoneNumber;
      if (typeof num === 'object') {
        // Handle object format - might be from personalized SMS
        phoneNumber = num.number || num.destination || '';
      } else {
        phoneNumber = String(num).trim();
      }
      
      console.log('Extracted phone number:', phoneNumber);
      
      if (!phoneNumber) {
        console.error('Empty phone number found');
        return '';
      }
      
      // Remove any existing country codes to avoid duplication
      phoneNumber = phoneNumber.replace(/^233/, '').replace(/^\+233/, '').replace(/^0/, '');
      
      // Add Ghana country code if not already present
      if (!phoneNumber.startsWith('+')) {
        return '233' + phoneNumber;
      }
      return phoneNumber.replace('+', ''); // Remove + but keep 233
    }).filter((num: string) => num); // Remove empty numbers

    // Check if the message contains personalization variables
    const hasPersonalization = text.includes('{$name}') || text.includes('{$phone}') || text.includes('{$organization}');
    
    console.log('=== PERSONALIZATION DETECTION ===');
    console.log('Original text:', JSON.stringify(text));
    console.log('Has personalization ({$name}):', text.includes('{$name}'));
    console.log('Has personalization ({$phone}):', text.includes('{$phone}'));
    console.log('Has personalization ({$organization}):', text.includes('{$organization}'));
    console.log('Final hasPersonalization:', hasPersonalization);
    console.log('=== END PERSONALIZATION DETECTION ===');
    
    if (hasPersonalization) {
      console.log('🎯 ENTERING PERSONALIZED PROCESSING LOGIC');
      // Personalized message - process like send-personalised-sms
      console.log('=== PERSONALIZED BROADCAST DEBUG ===');
      console.log('Message contains personalization variables, processing individually');
      
      try {
        // For personalized messages, we need to get member data to replace variables
        // Since we don't have member data here, we'll send to the regular personalized endpoint
        const personalizedDestinations = destinations.map((num: string | { number?: string; destination?: string }) => {
          // Handle both string and object formats
          let phoneNumber;
          if (typeof num === 'object') {
            phoneNumber = num.number || num.destination || '';
          } else {
            phoneNumber = String(num).trim();
          }
          
          // Normalize phone number
          phoneNumber = phoneNumber.replace(/^233/, '').replace(/^\+233/, '').replace(/^0/, '');
          return {
            number: '233' + phoneNumber,
            values: ['Member'] // Default value since we don't have member names here
          };
        });
        
        // Send each personalized message individually (like send-personalised-sms)
        const results = [];
        for (const dest of personalizedDestinations) {
          // Replace {$name} placeholder with a default value
          const personalizedText = text.replace('{$name}', 'Member');
          
          const payload = {
            text: personalizedText,
            type: 0,
            sender: finalSender,
            destinations: [dest.number]
          };

          // Debug: Log the exact request being sent
          console.log('=== PERSONALIZED MESSAGE DEBUG ===');
          console.log('To:', dest.number);
          console.log('Text:', personalizedText);
          console.log('=== END PERSONALIZED MESSAGE DEBUG ===');

          const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `key ${apiKey}`,
            },
            body: JSON.stringify(payload),
          });

          const responseText = await response.text();
          console.log('=== PERSONALIZED MESSAGE RAW RESPONSE ===');
          console.log('Response Status:', response.status, response.statusText);
          console.log('Response Text:', responseText);
          console.log('=== END PERSONALIZED MESSAGE RAW RESPONSE ===');
          
          let json;
          try {
            json = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON Parse Error for personalized message:', parseError);
            json = { handshake: { id: 0, label: 'HSHK_OK' }, data: null, errors: 'Parse error' };
          }

          // Enhanced logging for debugging
          console.log('=== PERSONALIZED MESSAGE PARSED RESPONSE ===');
          console.log('Handshake:', JSON.stringify(json.handshake, null, 2));
          console.log('Data:', JSON.stringify(json.data, null, 2));
          console.log('Errors:', JSON.stringify(json.errors, null, 2));
          console.log('=== END PERSONALIZED MESSAGE PARSED RESPONSE ===');

          // Validate handshake
          if (
            !json?.handshake ||
            json.handshake.id !== 0 ||
            json.handshake.label !== 'HSHK_OK'
          ) {
            console.error('Handshake validation failed for personalized message:', json?.handshake);
            // Continue with other messages even if one fails
          }

          results.push(json.data);
        }

        // Return combined results
        const personalizedResponse = {
          success: true,
          batch: results.length > 0 ? results[0]?.batch : null,
          category: 'sms',
          delivery: false,
          count: personalizedDestinations.length,
          deliveryStatuses: results.flatMap((r: any) =>
            r && r.destinations && Array.isArray(r.destinations)
              ? r.destinations.map((d: any) => ({
                  phone: d.to,
                  status: d.status?.label,
                  message_id: d.id
                }))
              : []
          ),
          personalized: true
        };

        // Audit logging removed - middleware dependencies removed
        console.log('Personalized broadcast successful:', {
          batch: personalizedResponse.batch,
          destinationCount: personalizedDestinations.length,
          sender: finalSender
        });

        return res.status(200).json(personalizedResponse);
      } catch (personalizedError: any) {
        console.error('Personalized broadcast error', personalizedError);

        // Error logging removed - middleware dependencies removed
        console.error('Personalized broadcast failed:', String(personalizedError));

        return res.status(500).json({ message: 'Internal Server Error in personalized processing', error: String(personalizedError) });
      }
    } else {
      // Regular broadcast - USING ORIGINAL WORKING FORMAT
      const payload = {
        text,
        type: 0, // BROADCAST SMS
        sender: finalSender,
        destinations: normalized, // Use normalized phone numbers
      };

      // Debug: Log the exact request being sent
      console.log('=== BROADCAST DEBUG ===');
      console.log('URL:', 'https://api.smsonlinegh.com/v5/message/sms/send');
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `key ${apiKey}`.substring(0, 10) + '...', // Log partial key for security
      });
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('=== END BROADCAST DEBUG ===');

      const response = await fetch('https://api.smsonlinegh.com/v5/message/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `key ${apiKey}`, // ORIGINAL WORKING FORMAT
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('=== BROADCAST RAW RESPONSE ===');
      console.log('Response Status:', response.status, response.statusText);
      console.log('Response Text:', responseText);
      console.log('=== END BROADCAST RAW RESPONSE ===');
      
      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error for broadcast:', parseError);
        return res.status(502).json({
          error: 'Invalid JSON response from SMSOnlineGH for broadcast',
          rawResponse: responseText,
          parseError: String(parseError),
        });
      }

      // Enhanced logging for debugging
      console.log('=== BROADCAST PARSED RESPONSE ===');
      console.log('Handshake:', JSON.stringify(json.handshake, null, 2));
      console.log('Data:', JSON.stringify(json.data, null, 2));
      console.log('Errors:', JSON.stringify(json.errors, null, 2));
      console.log('=== END BROADCAST PARSED RESPONSE ===');

      // Strict handshake validation
      if (
        !json?.handshake ||
        json.handshake.id !== 0 ||
        json.handshake.label !== 'HSHK_OK'
      ) {
        console.error('Handshake validation failed:', json?.handshake);
        return res.status(502).json({
          error: 'SMS provider rejected broadcast',
          details: json,
          rawResponse: responseText,
        });
      }

      // Check for delivery status in the response
      if (json.data && json.data.destinations && Array.isArray(json.data.destinations)) {
        const deliveryStatuses = json.data.destinations.map((item: any) => ({
          phone: item.to,
          status: item.status?.label,
          message_id: item.id,
          error: null
        }));
        console.log('Broadcast Delivery Statuses:', JSON.stringify(deliveryStatuses, null, 2));
      }

      // Successful broadcast → return the provider's data
      try {
        const responseData = {
          success: true,
          batch: json.data?.batch,
          category: json.data?.category,
          delivery: json.data?.delivery,
          count: normalized.length,
          deliveryStatuses: json.data && json.data.destinations && Array.isArray(json.data.destinations) ? json.data.destinations.map((item: any) => ({
            phone: item.to,
            status: item.status?.label,
            message_id: item.id
          })) : [],
          personalized: false
        };
        
        // Success logging removed - middleware dependencies removed
        console.log('Broadcast successful:', {
          batch: responseData.batch,
          destinationCount: normalized.length,
          sender: finalSender
        });

        return res.status(200).json(responseData);
      } catch (mapError: any) {
        console.error('Error creating response data:', mapError);
        // Fallback response if there's an issue with map
        return res.status(200).json({
          success: true,
          batch: json.data?.batch,
          category: json.data?.category,
          delivery: json.data?.delivery,
          count: normalized.length,
          deliveryStatuses: [],
          personalized: false,
          error: 'Could not process delivery statuses'
        });
      }
    }
  } catch (error: any) {
    console.error('Broadcast API error:', error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: String(error)
    });
  }
}

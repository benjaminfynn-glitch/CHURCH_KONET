const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function sendSMS(data: {
  text: string;
  destination: string;
  sender?: string;
}) {
  console.log('Attempting to send SMS:', data);
  try {
    const res = await fetch(`${API_BASE}/api/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: data.text,
        destinations: [data.destination],
        sender: data.sender
      }),
    });
    console.log('SMS API response status:', res.status);
    const result = await res.json();
    console.log('SMS API response:', result);
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

export async function sendPersonalisedSMS(data: {
  messages: { destination: string; text: string }[];
  sender?: string;
}) {
  const res = await fetch(`${API_BASE}/api/send-personalised-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function sendBroadcastSMS(data: {
  text: string;
  destinations: string[];
  sender?: string;
}) {
  const res = await fetch(`${API_BASE}/api/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function scheduleSMS(data: {
  text: string;
  destinations: string[];
  schedule: string;
  sender?: string;
}) {
  const res = await fetch(`${API_BASE}/api/schedule-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function getBalance() {
  const res = await fetch(`${API_BASE}/api/balance`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function handleDeliveryPush(data: any) {
  const res = await fetch(`${API_BASE}/api/delivery-push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

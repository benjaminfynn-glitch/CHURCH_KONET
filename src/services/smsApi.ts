export async function sendSMS(data: {
  text: string;
  destination: string;
  sender?: string;
}) {
  const res = await fetch('http://localhost:3000/api/send-sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: data.text,
      destinations: [data.destination],
      sender: data.sender
    }),
  });

  return res.json();
}

export async function sendPersonalisedSMS(data: {
  messages: { destination: string; text: string }[];
  sender?: string;
}) {
  const res = await fetch('http://localhost:3000/api/send-personalised-sms', {
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
  const res = await fetch('http://localhost:3000/api/broadcast', {
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
  const res = await fetch('http://localhost:3000/api/schedule-sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function getBalance() {
  const res = await fetch('http://localhost:3000/api/balance', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function handleDeliveryPush(data: any) {
  const res = await fetch('http://localhost:3000/api/delivery-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

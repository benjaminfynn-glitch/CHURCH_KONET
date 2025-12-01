export async function sendSMS(data: {
  text: string;
  destination: string;
  sender?: string;
}) {
  const res = await fetch('/api/send-sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function sendPersonalisedSMS(data: {
  messages: { destination: string; text: string }[];
  sender?: string;
}) {
  const res = await fetch('/api/send-personalised-sms', {
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
  const res = await fetch('/api/broadcast', {
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
  const res = await fetch('/api/schedule-sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function getBalance() {
  const res = await fetch('/api/balance');
  return res.json();
}

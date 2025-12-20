import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}

// Helper function to handle API responses
async function handleApiResponse(response: Response, operation: string) {
  if (!response.ok) {
    let errorMessage = `Failed to ${operation}`;
    let errorDetails = '';

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      errorDetails = errorData.details || '';

      // Handle specific API errors
      if (errorData.error === 'Too many requests') {
        errorMessage = 'SMS sending limit exceeded. Please wait 15 minutes before sending more messages.';
      } else if (errorData.error?.includes('rate limit')) {
        errorMessage = 'Too many SMS requests. Please wait before trying again.';
      } else if (errorData.message?.includes('Missing API key')) {
        errorMessage = 'SMS service is not properly configured. Please contact support.';
      } else if (errorData.message?.includes('Authentication')) {
        errorMessage = 'Authentication failed. Please log out and log back in.';
      }
    } catch (parseError) {
      // If we can't parse the error response, check if it's HTML
      try {
        const textResponse = await response.text();
        if (textResponse.includes('<html') || textResponse.includes('<HTML')) {
          // HTML error page - likely server/config issue
          if (response.status === 404) {
            errorMessage = 'SMS service endpoint not found. Please contact support.';
          } else if (response.status === 500) {
            errorMessage = 'SMS service is temporarily unavailable. Please try again later.';
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = 'Authentication failed. Please log out and log back in.';
          } else {
            errorMessage = 'SMS service error. Please try again or contact support.';
          }
        } else {
          // Other text response
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
        }
      } catch (textError) {
        // Fallback to status-based error
        errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
      }
    }

    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).details = errorDetails;
    throw error;
  }

  try {
    return await response.json();
  } catch (error) {
    // If JSON parsing fails, check if it's an HTML response
    try {
      const textResponse = await response.clone().text();
      if (textResponse.includes('<html') || textResponse.includes('<HTML')) {
        throw new Error('Received HTML error page instead of JSON. SMS service may be misconfigured.');
      }
    } catch (htmlCheckError) {
      // Ignore HTML check error
    }

    throw new Error(`Invalid JSON response from ${operation}. Please try again.`);
  }
}

// Helper function to make API calls with timeout and auth
async function apiCall(url: string, options: RequestInit, operation: string, timeout: number = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Get auth token and add to headers
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await handleApiResponse(response, operation);
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`${operation} timed out after ${timeout/1000} seconds`);
    }

    if (error.message.includes('fetch')) {
      throw new Error(`Network error during ${operation}. Please check your connection.`);
    }

    throw error;
  }
}

export async function sendSMS(data: {
  text: string;
  destination: string;
  sender?: string;
}) {
  if (!data.text?.trim()) {
    throw new Error('SMS text cannot be empty');
  }
  if (!data.destination?.trim()) {
    throw new Error('Destination phone number is required');
  }

  console.log('Attempting to send SMS:', { destination: data.destination, sender: data.sender, textLength: data.text.length });

  return apiCall(
    `${API_BASE}/api/send-sms`,
    {
      method: 'POST',
      body: JSON.stringify({
        text: data.text.trim(),
        destinations: [data.destination.trim()],
        sender: data.sender?.trim()
      }),
    },
    'send SMS'
  );
}

export async function sendPersonalisedSMS(data: {
  messages: { destination: string; text: string }[];
  sender?: string;
}) {
  if (!data.messages?.length) {
    throw new Error('No messages provided for personalized SMS');
  }

  for (const message of data.messages) {
    if (!message.destination?.trim() || !message.text?.trim()) {
      throw new Error('All messages must have destination and text');
    }
  }

  return apiCall(
    `${API_BASE}/api/send-personalised-sms`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        messages: data.messages.map(msg => ({
          destination: msg.destination.trim(),
          text: msg.text.trim()
        }))
      }),
    },
    'send personalized SMS'
  );
}

export async function sendBroadcastSMS(data: {
  text: string;
  destinations: string[];
  sender?: string;
}) {
  if (!data.text?.trim()) {
    throw new Error('Broadcast text cannot be empty');
  }
  if (!data.destinations?.length) {
    throw new Error('No destinations provided for broadcast');
  }

  return apiCall(
    `${API_BASE}/api/broadcast`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        text: data.text.trim(),
        destinations: data.destinations.map(dest => dest.trim())
      }),
    },
    'send broadcast SMS'
  );
}

export async function scheduleSMS(data: {
  text: string;
  destinations: string[];
  schedule: string;
  sender?: string;
}) {
  if (!data.text?.trim()) {
    throw new Error('Scheduled SMS text cannot be empty');
  }
  if (!data.destinations?.length) {
    throw new Error('No destinations provided for scheduled SMS');
  }
  if (!data.schedule) {
    throw new Error('Schedule time is required');
  }

  return apiCall(
    `${API_BASE}/api/schedule-sms`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        text: data.text.trim(),
        destinations: data.destinations.map(dest => dest.trim())
      }),
    },
    'schedule SMS'
  );
}

export async function getBalance() {
  console.log('Fetching SMS balance');

  return apiCall(
    `${API_BASE}/api/balance`,
    {
      method: 'GET'
    },
    'get SMS balance'
  );
}

export async function handleDeliveryPush(data: any) {
  if (!data) {
    throw new Error('Delivery push data is required');
  }

  return apiCall(
    `${API_BASE}/api/delivery-push`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    'handle delivery push'
  );
}

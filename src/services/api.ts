import { SMSRequest, SMSResponse, BalanceResponse, SMSDestinationPersonalized } from '../types';

const API_BASE = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api');

export interface ApiError extends Error {
  status?: number;
  details?: string;
}

async function getResponseBody(response: Response): Promise<{ json: any; text: string }> {
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { json, text };
}

export async function checkHealth(): Promise<{ status: string; smsService: string }> {
  console.log('=== Health check initiated ===');
  console.log('API_BASE:', API_BASE);
  
  try {
    const url = `${API_BASE}/health`;
    console.log('Health check URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('Health check response status:', response.status);
    console.log('Health check response ok:', response.ok);

    if (!response.ok) {
      throw new Error(`Server health check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Health check data:', data);
    return data;
  } catch (error: any) {
    console.error('Health check error:', error.message);
    console.error('Health check error stack:', error.stack);
    throw error;
  }
}

export async function sendBroadcast(payload: SMSRequest): Promise<SMSResponse> {
  const response = await fetch(`${API_BASE}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const { json, text } = await getResponseBody(response);

  if (!response.ok) {
    const errorMessage = (json && (json.error || json.message)) || 'Failed to send broadcast';
    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    error.details = json?.details || json?.rawResponse || text;
    throw error;
  }

  if (!json?.success) {
    const errorMessage = json?.error || 'Broadcast request failed';
    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    error.details = json?.details || text;
    throw error;
  }

  return json;
}

export const sendPersonalizedSMS = async (payload: { text: string; sender: string; destinations: SMSDestinationPersonalized[] }): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/send-personalised-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Personalized SMS request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Personalized SMS failed", error);
    throw error;
  }
};

export const getBalance = async (): Promise<BalanceResponse> => {
  try {
    const response = await fetch(`${API_BASE}/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    return await response.json();
  } catch (error) {
    console.error("Balance check failed", error);
    // Return safe default to avoid crashing UI
    return { balance: 0.00, currency: "GHS" };
  }
};

export const cancelScheduledMessage = async (batchId: string): Promise<boolean> => {
    // Note: The specific endpoint for cancelling scheduled messages wasn't provided 
    // in the integration summary. Keeping as a stub for now.
    console.warn("Cancel scheduled message not implemented on backend yet");
    return true;
};
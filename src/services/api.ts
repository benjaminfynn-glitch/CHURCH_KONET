import { SMSRequest, SMSResponse, BalanceResponse, SMSDestinationPersonalized } from '../types';

// Points to the local development API server
const API_BASE = 'http://localhost:3000/api';

export const sendBroadcast = async (payload: SMSRequest): Promise<SMSResponse> => {
  try {
    const response = await fetch(`${API_BASE}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Broadcast request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    const result: SMSResponse = await response.json();
    return result;
  } catch (error) {
    console.error("Broadcast failed", error);
    throw error;
  }
};

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
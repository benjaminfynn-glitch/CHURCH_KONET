import { useState } from 'react';
import {
  sendSMS,
  sendPersonalisedSMS,
  sendBroadcastSMS,
  scheduleSMS,
  getBalance,
  handleDeliveryPush,
} from '../services/smsApi';

export function useSMS() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const handle = async (fn: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    response,

    sendSMS: (data: any) => handle(() => sendSMS(data)),
    sendPersonalisedSMS: (data: any) => handle(() => sendPersonalisedSMS(data)),
    sendBroadcastSMS: (data: any) => handle(() => sendBroadcastSMS(data)),
    scheduleSMS: (data: any) => handle(() => scheduleSMS(data)),
    getBalance: () => handle(() => getBalance()),
    handleDeliveryPush: (data: any) => handle(() => handleDeliveryPush(data)),
  };
}

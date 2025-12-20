import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import {
  sendSMS,
  sendPersonalisedSMS,
  sendBroadcastSMS,
  scheduleSMS,
  getBalance,
  handleDeliveryPush,
} from '../services/smsApi';

// Type definitions for SMS operations
interface SMSSingleRequest {
  text: string;
  destination: string;
  sender?: string;
}

interface SMSPersonalizedRequest {
  messages: { destination: string; text: string }[];
  sender?: string;
}

interface SMSBroadcastRequest {
  text: string;
  destinations: string[];
  sender?: string;
}

interface SMSScheduleRequest {
  text: string;
  destinations: string[];
  schedule: string;
  sender?: string;
}

type SMSRequestData = SMSSingleRequest | SMSPersonalizedRequest | SMSBroadcastRequest | SMSScheduleRequest;

interface SMSResponse {
  success?: boolean;
  batch?: string;
  count?: number;
  balance?: number;
  [key: string]: any;
}

interface SMSHookOptions {
  enableRetry?: boolean;
  maxRetries?: number;
  operationName?: string;
}

export function useSMS() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SMSResponse | null>(null);
  const { addToast } = useToast();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const retryOperation = async (
    operation: () => Promise<any>,
    maxRetries: number = 3,
    delay: number = 1000,
    operationName: string = 'operation'
  ) => {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          addToast(`Successfully completed ${operationName} on attempt ${attempt}`, 'success');
        }
        return result;
      } catch (err: any) {
        lastError = err;
        console.error(`${operationName} attempt ${attempt} failed:`, err);

        if (attempt < maxRetries) {
          const retryDelay = delay * Math.pow(2, attempt - 1); // Exponential backoff
          addToast(
            `${operationName} failed (attempt ${attempt}/${maxRetries}). Retrying in ${retryDelay/1000}s...`,
            'warning',
            {
              description: err.message || 'Unknown error occurred',
              persistent: false,
              duration: 3000,
            }
          );
          await sleep(retryDelay);
        }
      }
    }

    // All retries failed
    const errorMessage = `${operationName} failed after ${maxRetries} attempts`;
    addToast(errorMessage, 'error', {
      title: 'Operation Failed',
      description: lastError?.message || 'Please check your connection and try again.',
      actions: [
        {
          label: 'Retry',
          onClick: () => retryOperation(operation, maxRetries, delay, operationName),
        }
      ],
      persistent: true,
    });

    throw new Error(`${errorMessage}: ${lastError?.message || 'Unknown error'}`);
  };

  const handle = async (fn: () => Promise<SMSResponse>, options?: SMSHookOptions) => {
    setLoading(true);
    setError(null);
    try {
      const result = options?.enableRetry
        ? await retryOperation(fn, options.maxRetries || 3, 1000, options.operationName || 'operation')
        : await fn();
      setResponse(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Unexpected error';
      setError(errorMessage);
      throw err; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    response,

    sendSMS: (data: SMSSingleRequest) => handle(() => sendSMS(data), { enableRetry: true, operationName: 'SMS send' }),
    sendPersonalisedSMS: (data: SMSPersonalizedRequest) => handle(() => sendPersonalisedSMS(data), { enableRetry: true, operationName: 'Personalized SMS send' }),
    sendBroadcastSMS: (data: SMSBroadcastRequest) => handle(() => sendBroadcastSMS(data), { enableRetry: true, operationName: 'Broadcast SMS send' }),
    scheduleSMS: (data: SMSScheduleRequest) => handle(() => scheduleSMS(data), { enableRetry: true, operationName: 'SMS scheduling' }),
    getBalance: () => handle(() => getBalance(), { enableRetry: true, operationName: 'Balance check' }),
    handleDeliveryPush: (data: any) => handle(() => handleDeliveryPush(data), { enableRetry: false, operationName: 'Delivery push' }),
  };
}

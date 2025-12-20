import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendBroadcast, sendPersonalizedSMS, getBalance, cancelScheduledMessage } from '../api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendBroadcast', () => {
    it('should send broadcast successfully', async () => {
      const mockResponse = { success: true, messageId: '123' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sendBroadcast({
        text: 'Hello all',
        type: 0,
        sender: 'Test',
        destinations: ['123', '456'],
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Broadcast failed' }),
      });

      await expect(sendBroadcast({
        text: 'Hello',
        type: 0,
        sender: 'Test',
        destinations: ['123'],
      })).rejects.toThrow('Broadcast failed');
    });
  });

  describe('sendPersonalizedSMS', () => {
    it('should send personalized SMS', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sendPersonalizedSMS({
        text: 'Hello',
        sender: 'Test',
        destinations: [{ number: '123', values: ['John'] }],
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid request' }),
      });

      await expect(sendPersonalizedSMS({
        text: 'Hello',
        sender: 'Test',
        destinations: [],
      })).rejects.toThrow('Invalid request');
    });
  });

  describe('getBalance', () => {
    it('should get balance', async () => {
      const mockResponse = { balance: 50.00, currency: 'GHS' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getBalance();

      expect(result).toEqual(mockResponse);
    });

    it('should return default on error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getBalance();

      expect(result).toEqual({ balance: 0.00, currency: 'GHS' });
    });
  });

  describe('cancelScheduledMessage', () => {
    it('should return true', async () => {
      const result = await cancelScheduledMessage('batch123');

      expect(result).toBe(true);
    });
  });
});
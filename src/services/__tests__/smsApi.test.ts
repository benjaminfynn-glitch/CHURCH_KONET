import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendSMS,
  sendPersonalisedSMS,
  sendBroadcastSMS,
  scheduleSMS,
  getBalance,
  handleDeliveryPush,
} from '../smsApi';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('smsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendSMS', () => {
    it('should send SMS successfully', async () => {
      const mockResponse = { success: true, messageId: '123' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sendSMS({
        text: 'Hello',
        destination: '233244123456',
        sender: 'Test',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/send-sms'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            text: 'Hello',
            destinations: ['233244123456'],
            sender: 'Test',
          }),
        })
      );
    });

    it('should throw error for empty text', async () => {
      await expect(sendSMS({ text: '', destination: '123' })).rejects.toThrow('SMS text cannot be empty');
    });

    it('should throw error for empty destination', async () => {
      await expect(sendSMS({ text: 'Hello', destination: '' })).rejects.toThrow('Destination phone number is required');
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid request' }),
      });

      await expect(sendSMS({ text: 'Hello', destination: '123' })).rejects.toThrow('Invalid request');
    });
  });

  describe('sendPersonalisedSMS', () => {
    it('should send personalized SMS', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sendPersonalisedSMS({
        messages: [{ destination: '123', text: 'Hello' }],
        sender: 'Test',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error for empty messages', async () => {
      await expect(sendPersonalisedSMS({ messages: [] })).rejects.toThrow('No messages provided for personalized SMS');
    });

    it('should throw error for invalid message', async () => {
      await expect(sendPersonalisedSMS({
        messages: [{ destination: '', text: 'Hello' }],
      })).rejects.toThrow('All messages must have destination and text');
    });
  });

  describe('sendBroadcastSMS', () => {
    it('should send broadcast SMS', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sendBroadcastSMS({
        text: 'Hello all',
        destinations: ['123', '456'],
        sender: 'Test',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error for empty text', async () => {
      await expect(sendBroadcastSMS({ text: '', destinations: ['123'] })).rejects.toThrow('Broadcast text cannot be empty');
    });

    it('should throw error for empty destinations', async () => {
      await expect(sendBroadcastSMS({ text: 'Hello', destinations: [] })).rejects.toThrow('No destinations provided for broadcast');
    });
  });

  describe('scheduleSMS', () => {
    it('should schedule SMS', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await scheduleSMS({
        text: 'Scheduled message',
        destinations: ['123'],
        schedule: '2024-01-01T10:00:00Z',
        sender: 'Test',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error for missing schedule', async () => {
      await expect(scheduleSMS({
        text: 'Hello',
        destinations: ['123'],
        schedule: '',
      })).rejects.toThrow('Schedule time is required');
    });
  });

  describe('getBalance', () => {
    it('should get balance', async () => {
      const mockResponse = { balance: 100, currency: 'GHS' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getBalance();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('handleDeliveryPush', () => {
    it('should handle delivery push', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await handleDeliveryPush({ deliveryId: '123' });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error for empty data', async () => {
      await expect(handleDeliveryPush(null)).rejects.toThrow('Delivery push data is required');
    });
  });
});
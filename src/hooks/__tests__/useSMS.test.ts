import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSMS } from '../useSMS';

vi.mock('../services/smsApi', () => ({
  sendSMS: vi.fn(),
  sendPersonalisedSMS: vi.fn(),
  sendBroadcastSMS: vi.fn(),
  scheduleSMS: vi.fn(),
  getBalance: vi.fn(),
  handleDeliveryPush: vi.fn(),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

// @ts-ignore
import {
  sendSMS,
  sendPersonalisedSMS,
  sendBroadcastSMS,
  scheduleSMS,
  getBalance,
  handleDeliveryPush,
} from '../services/smsApi';

describe('useSMS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send SMS successfully', async () => {
    (sendSMS as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSMS());

    const promise = result.current.sendSMS({ text: 'test', destination: '123' });

    expect(result.current.loading).toBe(true);

    await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.response).toEqual({ success: true });
    });

    expect(sendSMS).toHaveBeenCalledWith({ text: 'test', destination: '123' });
  });

  it('should handle SMS send error', async () => {
    (sendSMS as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSMS());

    await expect(result.current.sendSMS({ text: 'test', destination: '123' })).rejects.toThrow('SMS send failed after 3 attempts: Network error');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('SMS send failed after 3 attempts: Network error');
    });
  });

  it('should send personalized SMS', async () => {
    (sendPersonalisedSMS as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSMS());

    await result.current.sendPersonalisedSMS({ messages: [{ destination: '123', text: 'Hello John' }] });

    expect(sendPersonalisedSMS).toHaveBeenCalledWith({ messages: [{ destination: '123', text: 'Hello John' }] });
  });

  it('should send broadcast SMS', async () => {
    (sendBroadcastSMS as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSMS());

    await result.current.sendBroadcastSMS({ text: 'test', destinations: ['123', '456'] });

    expect(sendBroadcastSMS).toHaveBeenCalledWith({ text: 'test', destinations: ['123', '456'] });
  });

  it('should schedule SMS', async () => {
    (scheduleSMS as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSMS());

    await result.current.scheduleSMS({ text: 'test', destinations: ['123'], schedule: '2024-01-01T10:00' });

    expect(scheduleSMS).toHaveBeenCalledWith({ text: 'test', destinations: ['123'], schedule: '2024-01-01T10:00' });
  });

  it('should get balance', async () => {
    (getBalance as any).mockResolvedValue({ balance: 100 });

    const { result } = renderHook(() => useSMS());

    await result.current.getBalance();

    expect(getBalance).toHaveBeenCalled();
  });

  it('should handle delivery push', async () => {
    (handleDeliveryPush as any).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSMS());

    await result.current.handleDeliveryPush({ delivery: 'data' });

    expect(handleDeliveryPush).toHaveBeenCalledWith({ delivery: 'data' });
  });

  it('should retry on failure', async () => {
    (sendSMS as any)
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useSMS());

    await result.current.sendSMS({ text: 'test', destination: '123' });

    expect(sendSMS).toHaveBeenCalledTimes(3);
  });
});
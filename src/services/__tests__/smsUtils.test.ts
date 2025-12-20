import { describe, it, expect } from 'vitest';
import { validatePhoneNumber, calculateSMSCost } from '../smsUtils';

describe('validatePhoneNumber', () => {
  it('should validate international format starting with 233', () => {
    const result = validatePhoneNumber('233244123456');
    expect(result).toBe('233244123456');
  });

  it('should convert local format to international', () => {
    const result = validatePhoneNumber('0244123456');
    expect(result).toBe('233244123456');
  });

  it('should handle 9 digit number by adding 233', () => {
    const result = validatePhoneNumber('244123456');
    expect(result).toBe('233244123456');
  });

  it('should return null for invalid format', () => {
    const result = validatePhoneNumber('123456789');
    expect(result).toBe(null);
  });

  it('should return null for too short number', () => {
    const result = validatePhoneNumber('0244');
    expect(result).toBe(null);
  });

  it('should return null for non-numeric', () => {
    const result = validatePhoneNumber('abc');
    expect(result).toBe(null);
  });

  it('should handle number with spaces and dashes', () => {
    const result = validatePhoneNumber('0244-123-456');
    expect(result).toBe('233244123456');
  });

  it('should handle international with +', () => {
    const result = validatePhoneNumber('+233244123456');
    expect(result).toBe('233244123456');
  });
});

describe('calculateSMSCost', () => {
  it('should calculate cost for GSM-7 text', () => {
    const result = calculateSMSCost('Hello world');
    expect(result.encoding).toBe('GSM-7');
    expect(result.segments).toBe(1);
    expect(result.limitPerSegment).toBe(160);
    expect(result.totalCost).toBe(0.05);
  });

  it('should calculate cost for Unicode text', () => {
    const result = calculateSMSCost('Hello 🌍');
    expect(result.encoding).toBe('Unicode');
    expect(result.segments).toBe(1);
    expect(result.limitPerSegment).toBe(70);
    expect(result.totalCost).toBe(0.05);
  });

  it('should handle multiple segments', () => {
    const longText = 'a'.repeat(161);
    const result = calculateSMSCost(longText);
    expect(result.segments).toBe(2);
    expect(result.totalCost).toBe(0.1);
  });

  it('should handle empty text', () => {
    const result = calculateSMSCost('');
    expect(result.segments).toBe(1);
    expect(result.totalCost).toBe(0.05);
  });

  it('should handle long Unicode text', () => {
    const longUnicode = '🌍'.repeat(71);
    const result = calculateSMSCost(longUnicode);
    expect(result.encoding).toBe('Unicode');
    expect(result.segments).toBe(2);
    expect(result.totalCost).toBe(0.1);
  });
});
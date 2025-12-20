import { describe, it, expect } from 'vitest';
import { parseDOB, formatISOToDDMMYYYY, formatISOToDDMMYYYYWithHyphens, formatDateDDMMYYYY } from '../date';

describe('parseDOB', () => {
  it('should parse valid DD/MM/YYYY date', () => {
    const result = parseDOB('25/12/1990');
    expect(result).toEqual({ iso: '1990-12-25' });
  });

  it('should return error for invalid day', () => {
    const result = parseDOB('32/12/1990');
    expect(result.error).toBe('Invalid date');
  });

  it('should return error for invalid month', () => {
    const result = parseDOB('25/13/1990');
    expect(result.error).toBe('Invalid date');
  });

  it('should return error for invalid year', () => {
    const result = parseDOB('25/12/0000');
    expect(result.error).toBe('Invalid date');
  });

  it('should return error for wrong format', () => {
    const result = parseDOB('25-12-1990');
    expect(result.error).toBe('Use DD/MM/YYYY');
  });

  it('should return error for empty string', () => {
    const result = parseDOB('');
    expect(result.error).toBe('Date of birth required');
  });

  it('should return error for non-numeric parts', () => {
    const result = parseDOB('ab/12/1990');
    expect(result.error).toBe('Invalid date numbers');
  });

  it('should handle leap year date', () => {
    const result = parseDOB('29/02/2020');
    expect(result).toEqual({ iso: '2020-02-29' });
  });

  it('should return error for invalid leap year date', () => {
    const result = parseDOB('29/02/2021');
    expect(result.error).toBe('Invalid date');
  });
});

describe('formatISOToDDMMYYYY', () => {
  it('should format valid ISO date', () => {
    const result = formatISOToDDMMYYYY('1990-12-25');
    expect(result).toBe('25/12/1990');
  });

  it('should return empty for invalid ISO', () => {
    const result = formatISOToDDMMYYYY('invalid');
    expect(result).toBe('');
  });

  it('should return empty for empty string', () => {
    const result = formatISOToDDMMYYYY('');
    expect(result).toBe('');
  });

  it('should return empty for undefined', () => {
    const result = formatISOToDDMMYYYY(undefined);
    expect(result).toBe('');
  });
});

describe('formatISOToDDMMYYYYWithHyphens', () => {
  it('should format valid ISO date with hyphens', () => {
    const result = formatISOToDDMMYYYYWithHyphens('1990-12-25');
    expect(result).toBe('25-12-1990');
  });

  it('should return empty for invalid', () => {
    const result = formatISOToDDMMYYYYWithHyphens('invalid');
    expect(result).toBe('');
  });
});

describe('formatDateDDMMYYYY', () => {
  it('should format ISO date', () => {
    const result = formatDateDDMMYYYY('1990-12-25');
    expect(result).toBe('25-12-1990');
  });

  it('should format date string', () => {
    const result = formatDateDDMMYYYY('1990/12/25');
    expect(result).toBe('25-12-1990');
  });

  it('should return N/A for empty', () => {
    const result = formatDateDDMMYYYY('');
    expect(result).toBe('N/A');
  });

  it('should return original for invalid date', () => {
    const result = formatDateDDMMYYYY('invalid');
    expect(result).toBe('invalid');
  });
});
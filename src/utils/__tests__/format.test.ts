import { describe, it, expect } from 'vitest';
import { normalizeName } from '../format';

describe('normalizeName', () => {
  it('should normalize name with proper capitalization', () => {
    const result = normalizeName('john doe');
    expect(result).toBe('John Doe');
  });

  it('should handle multiple spaces', () => {
    const result = normalizeName('  john   doe  ');
    expect(result).toBe('John Doe');
  });

  it('should handle mixed case', () => {
    const result = normalizeName('JoHn DoE');
    expect(result).toBe('John Doe');
  });

  it('should handle empty string', () => {
    const result = normalizeName('');
    expect(result).toBe('');
  });

  it('should handle single word', () => {
    const result = normalizeName('john');
    expect(result).toBe('John');
  });

  it('should handle multiple words', () => {
    const result = normalizeName('mary jane smith');
    expect(result).toBe('Mary Jane Smith');
  });

  it('should handle non-string input', () => {
    const result = normalizeName(123 as any);
    expect(result).toBe('123');
  });

  it('should filter out empty parts', () => {
    const result = normalizeName('john  doe');
    expect(result).toBe('John Doe');
  });
});
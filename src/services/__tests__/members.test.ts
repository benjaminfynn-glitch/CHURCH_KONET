import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addMember } from '../members';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'timestamp'),
}));

// @ts-ignore - Test file module resolution
vi.mock('../utils/format', () => ({
  normalizeName: vi.fn((name) => name.toUpperCase()),
}));

// @ts-ignore - Test file module resolution
vi.mock('../utils/date', () => ({
  parseDOB: vi.fn((dob) => ({ iso: '1990-12-25' })),
}));

import { collection, addDoc } from 'firebase/firestore';
// @ts-ignore - Test file module resolution
import { normalizeName } from '../utils/format';
// @ts-ignore - Test file module resolution
import { parseDOB } from '../utils/date';

describe('members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addMember', () => {
    it('should add member successfully', async () => {
      const mockDocRef = { id: '123' };
      (addDoc as any).mockResolvedValue(mockDocRef);
      (collection as any).mockReturnValue('collectionRef');

      const result = await addMember({
        fullName: 'john doe',
        phone: '0244123456',
        email: 'john@example.com',
        dob: '25/12/1990',
      });

      expect(normalizeName).toHaveBeenCalledWith('john doe');
      expect(parseDOB).toHaveBeenCalledWith('25/12/1990');
      expect(addDoc).toHaveBeenCalledWith('collectionRef', {
        fullName: 'JOHN DOE',
        phone: '0244123456',
        email: 'john@example.com',
        dob: '1990-12-25',
        dobDisplay: '25/12/1990',
        createdAt: 'timestamp',
      });
      expect(result).toEqual({
        id: '123',
        fullName: 'JOHN DOE',
        phone: '0244123456',
        email: 'john@example.com',
        dob: '1990-12-25',
        dobDisplay: '25/12/1990',
        createdAt: 'timestamp',
      });
    });

    it('should throw error for missing fullName', async () => {
      await expect(addMember({ fullName: '', phone: '123' })).rejects.toThrow('Full name is required');
    });

    it('should throw error for missing phone', async () => {
      await expect(addMember({ fullName: 'John', phone: '' })).rejects.toThrow('Phone number is required');
    });

    it('should throw error for invalid phone', async () => {
      await expect(addMember({ fullName: 'John', phone: 'abc' })).rejects.toThrow('Invalid phone number');
    });

    it('should handle DOB parsing error', async () => {
      (parseDOB as any).mockReturnValue({ error: 'Invalid date' });

      await expect(addMember({
        fullName: 'John',
        phone: '0244123456',
        dob: 'invalid',
      })).rejects.toThrow('Invalid date');
    });

    it('should handle member without email and DOB', async () => {
      const mockDocRef = { id: '123' };
      (addDoc as any).mockResolvedValue(mockDocRef);
      (collection as any).mockReturnValue('collectionRef');

      const result = await addMember({
        fullName: 'john doe',
        phone: '0244123456',
      });

      expect(result.dob).toBe(null);
      expect(result.dobDisplay).toBe('');
      expect(result.email).toBe('');
    });
  });
});
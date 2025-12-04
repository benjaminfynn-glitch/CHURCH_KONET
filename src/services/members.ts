// src/services/members.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // adjust path if your firebase.ts is in a different place
import { normalizeName } from '../utils/format';
import { parseDOB } from '../utils/date';

export interface NewMemberInput {
  fullName: string;
  phone: string;
  email?: string;
  dob?: string; // expected DD/MM/YYYY
  [k: string]: any;
}

export async function addMember(input: NewMemberInput) {
  // Basic validation
  if (!input.fullName) throw new Error('Full name is required');
  if (!input.phone) throw new Error('Phone number is required');

  // Normalize and clean values
  const fullName = normalizeName(input.fullName);
  const phone = (input.phone || '').toString().replace(/[^\d+]/g, '').trim();
  if (!phone) throw new Error('Invalid phone number');

  // DOB parsing (optional)
  let dobISO: string | null = null;
  if (input.dob) {
    const { iso, error } = parseDOB(input.dob);
    if (error) throw new Error(error);
    dobISO = iso || null;
  }

  const doc = {
    fullName,
    phone,
    email: input.email || '',
    dob: dobISO, // YYYY-MM-DD or null
    dobDisplay: dobISO ? `${dobISO.split('-').reverse().join('/')}` : '',
    createdAt: serverTimestamp(),
  };

  // Write to Firestore (creates collection automatically)
  const ref = await addDoc(collection(db, 'members'), doc);

  return { id: ref.id, ...doc };
}

// src/utils/format.ts
export function normalizeName(raw: string) {
  if (!raw) return '';
  return raw
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function normalizeDOB(dob: string) {
  // expects DD/MM/YYYY
  if (!dob) return '';
  const [dd, mm, yyyy] = dob.split('/');
  if (!dd || !mm || !yyyy) return '';
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`; // canonical format
}

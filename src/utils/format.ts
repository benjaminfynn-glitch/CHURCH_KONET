// src/utils/format.ts
export function normalizeName(raw: string) {
  if (!raw) return '';
  return raw
    .toString()
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

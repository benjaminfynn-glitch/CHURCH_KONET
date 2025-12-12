// src/utils/date.ts
export function parseDOB(ddmmyyyy: string): { iso?: string; error?: string } {
  if (!ddmmyyyy) return { error: 'Date of birth required' };
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return { error: 'Use DD/MM/YYYY' };
  const [dd, mm, yyyy] = parts.map(p => p.trim());
  const day = Number(dd);
  const month = Number(mm) - 1;
  const year = Number(yyyy);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return { error: 'Invalid date numbers' };
  }

  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return { error: 'Invalid date' };

  // Validate roundtrip (handles weird dates)
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return { error: 'Invalid date' };
  }

  const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
  return { iso };
}

export function formatISOToDDMMYYYY(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

export function formatISOToDDMMYYYYWithHyphens(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}-${m}-${y}`;
}

// Standardized date formatting function for the entire application
export function formatDateDDMMYYYY(dateStr?: string) {
  if (!dateStr) return "N/A";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  const dt = new Date(dateStr);
  if (!isNaN(dt.getTime())) return dt.toLocaleDateString("en-GB").replace(/\//g, "-");
  return dateStr;
}

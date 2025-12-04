
export const validatePhoneNumber = (phone: string): string | null => {
  // Remove all non-numeric characters
  const clean = phone.replace(/\D/g, '');

  // Handle various formats
  // 1. International format without + (e.g. 233244...)
  if (clean.startsWith('233') && clean.length === 12) {
    return clean;
  }
  
  // 2. Local format (e.g. 0244...) -> Convert to 233
  if (clean.startsWith('0') && clean.length === 10) {
    return '233' + clean.substring(1);
  }

  // 3. Ten digits without 0 (rare but possible input error) -> assume 233 prefix needed
  if (clean.length === 9) {
    return '233' + clean;
  }

  return null; // Invalid format
};

export const calculateSMSCost = (text: string) => {
  // Check for non-GSM-7 characters (like emojis or special symbols)
  // GSM 03.38 character set regex (simplified)
  // eslint-disable-next-line no-control-regex
  const isGSM = /^[\x00-\x7F]*$/.test(text); 
  
  const encoding = isGSM ? 'GSM-7' : 'Unicode';
  const limitPerSegment = isGSM ? 160 : 70;
  
  const length = text.length;
  const segments = Math.ceil((length || 1) / limitPerSegment);
  
  // Cost per unit (Mock)
  const unitCost = 0.05;
  const totalCost = segments * unitCost;

  return {
    encoding,
    segments,
    limitPerSegment,
    totalCost
  };
};

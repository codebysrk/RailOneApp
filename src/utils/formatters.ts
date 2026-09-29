// FIX C4: null/undefined guards added to prevent crash on null inputs
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '₹0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num as number) || num === null) return '₹0.00';
  return `₹${(num as number).toFixed(2)}`;
};

export const formatMobile = (mobile: string | null | undefined): string => {
  // FIX: null guard — prevent crash on undefined/null mobile
  if (!mobile) return '';
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned;
  }
  return mobile;
};

const IR_GST_BY_STATE: Record<string, string> = {
  '09': 'IR:09AAAGM0289C1ZH', // Uttar Pradesh
  '23': 'IR:23AAAGM0289C1ZR', // Madhya Pradesh
  '10': 'IR:10AAAGM0289C1ZY', // Bihar
  '07': 'IR:07AAAGM0289C1ZU', // Delhi
  '27': 'IR:27AAAGM0289C1ZL', // Maharashtra
  '08': 'IR:08AAAGM0289C1ZJ', // Rajasthan
  '19': 'IR:19AAAGM0289C1Z5', // West Bengal
  '24': 'IR:24AAAGM0289C1ZP', // Gujarat
  '06': 'IR:06AAAGM0289C1ZW', // Haryana
  '03': 'IR:03AAAGM0289C1Z2', // Punjab
  '29': 'IR:29AAAGM0289C1ZH', // Karnataka
  '33': 'IR:33AAAGM0289C1Z4', // Tamil Nadu
  '36': 'IR:36AAAGM0289C1Z1', // Telangana
  '37': 'IR:37AAAGM0289C1ZZ', // Andhra Pradesh
  '32': 'IR:32AAAGM0289C1Z6', // Kerala
  '20': 'IR:20AAAGM0289C1ZA', // Jharkhand
  '21': 'IR:21AAAGM0289C1ZT', // Odisha
  '22': 'IR:22AAAGM0289C1ZT', // Chhattisgarh
  '05': 'IR:05AAAGM0289C1ZX', // Uttarakhand
  '18': 'IR:18AAAGM0289C1Z7', // Assam
};

/**
 * Returns genuine Indian Railways GSTIN IR code based on source station/state.
 */
export const getIndianRailwaysIrCode = (stationCodeOrName?: string): string => {
  if (!stationCodeOrName) {
    return 'IR:09AAAGM0289C1ZH';
  }
  const normalized = stationCodeOrName.toUpperCase().trim();
  if (IR_GST_BY_STATE[normalized]) {
    return IR_GST_BY_STATE[normalized];
  }
  if (/DELHI|NDLS|DLI|NZM|ANVT/i.test(normalized)) return 'IR:07AAAGM0289C1ZU';
  if (/MUMBAI|CSTM|CSMT|BCT|MMCT|PUNE|NAGPUR|MAHARASHTRA/i.test(normalized)) return 'IR:27AAAGM0289C1ZL';
  if (/PATNA|GAYA|MUZAFFARPUR|BIHAR/i.test(normalized)) return 'IR:10AAAGM0289C1ZY';
  if (/BHOPAL|INDORE|JABALPUR|GWALIOR|MORENA|MRA|GWL|MADHYA/i.test(normalized)) return 'IR:23AAAGM0289C1ZR';
  if (/JAIPUR|KOTA|JODHPUR|AJMER|RAJASTHAN/i.test(normalized)) return 'IR:08AAAGM0289C1ZJ';
  if (/KOLKATA|HOWRAH|HWH|SEALDAH|SDAH|BENGAL/i.test(normalized)) return 'IR:19AAAGM0289C1Z5';
  if (/AHMEDABAD|ADI|SURAT|VADODARA|BRC|GUJARAT/i.test(normalized)) return 'IR:24AAAGM0289C1ZP';
  if (/LUCKNOW|LKO|VARANASI|BSB|KANPUR|CNB|AGRA|AGC|MATHURA|MTJ|PRAYAGRAJ|PRYJ|GKP|UP|UTTAR/i.test(normalized)) return 'IR:09AAAGM0289C1ZH';

  return 'IR:09AAAGM0289C1ZH';
};

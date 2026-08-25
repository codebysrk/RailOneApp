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

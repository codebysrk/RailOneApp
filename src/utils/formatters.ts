export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toFixed(2)}`;
};

export const formatMobile = (mobile: string): string => {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned;
  }
  return mobile;
};


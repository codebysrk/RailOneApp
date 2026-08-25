// FIX M12: invalid date guards prevent RangeError on bad Date objects
export const formatDate = (date: Date = new Date()): string => {
  if (!date || isNaN(date.getTime())) return '---';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
};

export const formatFullDateTime = (date: Date = new Date()): string => {
  if (!date || isNaN(date.getTime())) return '---';
  const dateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr}, ${timeStr}`;
};

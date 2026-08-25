const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

/**
 * Universal date parser that handles Firestore Timestamps, epoch numbers,
 * standard ISO dates, "Day, DD Mon YYYY", "DD Mon YYYY", and "DD/MM/YYYY"
 * with noon anchoring (12:00:00) to guarantee timezone offset immunity.
 */
export const parseToDate = (rawDate: any): Date | null => {
  if (!rawDate) return null;

  // 1. Already a valid Date object
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return rawDate;
  }

  // 2. Firestore Timestamp { seconds, nanoseconds }
  if (typeof rawDate === 'object' && typeof rawDate.seconds === 'number') {
    const d = new Date(rawDate.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  // 3. Number timestamp
  if (typeof rawDate === 'number') {
    const d = rawDate < 10000000000 ? new Date(rawDate * 1000) : new Date(rawDate);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  // 4. "Day, DD Mon YYYY" or "Day, DD Mon YY" (e.g. "Thu, 30 Jul 2026" or "Thu, 30 Jul 25")
  const dayNameDdMonYear = str.match(/^[A-Za-z]{3},?\s+(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2,4})/);
  if (dayNameDdMonYear) {
    const day = parseInt(dayNameDdMonYear[1], 10);
    const mStr = dayNameDdMonYear[2].toLowerCase();
    const month = MONTH_MAP[mStr];
    let year = parseInt(dayNameDdMonYear[3], 10);
    if (year < 100) year += 2000;
    if (month !== undefined) {
      const d = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 5. "DD Mon YYYY" (e.g. "25 Aug 2026, 12:21" or "25 Aug 2026")
  const ddMonYear = str.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2,4})/);
  if (ddMonYear) {
    const day = parseInt(ddMonYear[1], 10);
    const mStr = ddMonYear[2].toLowerCase();
    const month = MONTH_MAP[mStr];
    let year = parseInt(ddMonYear[3], 10);
    if (year < 100) year += 2000;
    if (month !== undefined) {
      const d = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 6. "DD/MM/YYYY" or "DD-MM-YYYY" (e.g. "25/08/2026 12:14" or "25-08-2026")
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    let year = parseInt(ddmmyyyy[3], 10);
    if (year < 100) year += 2000;
    if (month >= 0 && month <= 11) {
      const d = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 7. ISO Date string "YYYY-MM-DD"
  const yyyymmdd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    if (month >= 0 && month <= 11) {
      const d = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 8. General Date fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d;
  }

  return null;
};

/**
 * Formats Journey Date as "Day, DD Mon YY"
 * Example: "Thu, 30 Jul 25", "Mon, 05 Jan 26", "Sun, 15 Feb 26"
 */
export const formatJourneyDate = (rawDate: any): string => {
  const d = parseToDate(rawDate);
  if (!d) return String(rawDate || '---');

  const dayName = DAYS[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthName = MONTHS[d.getMonth()];
  const year2Digit = String(d.getFullYear()).slice(-2);

  return `${dayName}, ${dayNum} ${monthName} ${year2Digit}`;
};

/**
 * Formats Upcoming Journey Date as "Day, DD Mon YYYY"
 * Example: "Thu, 30 Jul 2026"
 */
export const formatUpcomingDate = (rawDate: any): string => {
  const d = parseToDate(rawDate);
  if (!d) return String(rawDate || '---');

  const dayName = DAYS[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthName = MONTHS[d.getMonth()];
  const year4Digit = d.getFullYear();

  return `${dayName}, ${dayNum} ${monthName} ${year4Digit}`;
};

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


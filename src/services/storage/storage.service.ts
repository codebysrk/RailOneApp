// In-memory fallback cache to ensure zero crashes if native AsyncStorage module is unlinked
const memoryStore: Record<string, string> = {
  railone_booked_tickets: JSON.stringify([
    {
      id: '1',
      pnr: '2160978001',
      ticketId: 'XMSQEB4004',
      train: '12279 (TAJ EXPRESS)',
      date: 'Sat, 29 Aug 26',
      source: 'MORENA',
      dest: 'HAZRAT NIZAMUDDIN JN',
      duration: '4h:8m',
      fare: '120.00',
      passengers: '1 Adult, 0 Child',
      classType: 'SECOND',
      trainType: 'SUPERFAST',
      status: 'upcoming',
    },
    {
      id: '2',
      pnr: '2261626145',
      ticketId: 'XMSQEB4005',
      train: '12279 (TAJ EXPRESS)',
      date: 'Sat, 29 Aug 26',
      source: 'MORENA',
      dest: 'HAZRAT NIZAMUDDIN JN',
      duration: '4h:7m',
      fare: '120.00',
      passengers: '1 Adult, 0 Child',
      classType: 'SECOND',
      trainType: 'SUPERFAST',
      status: 'upcoming',
    },
  ]),
};

const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // Native module unavailable, use memoryStore fallback
  }
  return memoryStore[key] ?? null;
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  memoryStore[key] = value;
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(key, value);
    }
  } catch {
    // Native module unavailable, silently persist in memoryStore
  }
};

const KEYS = {
  RECENT_SEARCHES: 'un_recent',
  BOOKED_TICKETS: 'railone_booked_tickets',
};

export const StorageService = {
  getRecentSearches: async () => {
    try {
      const data = await safeGetItem(KEYS.RECENT_SEARCHES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveRecentSearch: async (from: any, to: any) => {
    try {
      const recent = await StorageService.getRecentSearches();
      const filtered = recent.filter((r: any) => !(r.fromCode === from.code && r.toCode === to.code));
      filtered.unshift({
        fromCode: from.code,
        fromName: from.name,
        toCode: to.code,
        toName: to.name,
      });
      await safeSetItem(KEYS.RECENT_SEARCHES, JSON.stringify(filtered.slice(0, 5)));
    } catch {
      // Ignored
    }
  },
  getBookedTickets: async () => {
    try {
      const data = await safeGetItem(KEYS.BOOKED_TICKETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveBookedTicket: async (ticket: any) => {
    try {
      const tickets = await StorageService.getBookedTickets();
      tickets.unshift(ticket);
      await safeSetItem(KEYS.BOOKED_TICKETS, JSON.stringify(tickets));
    } catch {
      // Ignored
    }
  },
};


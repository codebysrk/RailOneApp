// In-memory fallback cache to ensure zero crashes if native AsyncStorage module is unlinked
const memoryStore: Record<string, string> = {
  railone_booked_tickets: JSON.stringify([]),
  railone_saved_passengers: JSON.stringify([]),
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
  SAVED_PASSENGERS: 'railone_saved_passengers',
};

export interface SavedPassenger {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'T';
  berthPreference?: string;
  foodPreference?: string;
  verified?: boolean;
}

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
  getSavedPassengers: async (): Promise<SavedPassenger[]> => {
    try {
      const data = await safeGetItem(KEYS.SAVED_PASSENGERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  savePassenger: async (passenger: SavedPassenger): Promise<SavedPassenger[]> => {
    try {
      const list = await StorageService.getSavedPassengers();
      const existingIndex = list.findIndex(p => p.id === passenger.id);
      if (existingIndex >= 0) {
        list[existingIndex] = passenger;
      } else {
        list.push(passenger);
      }
      await safeSetItem(KEYS.SAVED_PASSENGERS, JSON.stringify(list));
      return list;
    } catch {
      return [];
    }
  },
  deletePassenger: async (id: string): Promise<SavedPassenger[]> => {
    try {
      const list = await StorageService.getSavedPassengers();
      const filtered = list.filter(p => p.id !== id);
      await safeSetItem(KEYS.SAVED_PASSENGERS, JSON.stringify(filtered));
      return filtered;
    } catch {
      return [];
    }
  },
  getLanguage: async (): Promise<string> => {
    try {
      const lang = await safeGetItem('railone_language');
      return lang || 'en';
    } catch {
      return 'en';
    }
  },
  saveLanguage: async (lang: string): Promise<void> => {
    try {
      await safeSetItem('railone_language', lang);
    } catch {}
  },
};

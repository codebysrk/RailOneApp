let AsyncStorageModule: any = null;
try {
  AsyncStorageModule = require('@react-native-async-storage/async-storage').default;
} catch {
  // Native module unavailable, use memory fallback
}

// In-memory fallback cache to ensure zero crashes if native AsyncStorage module is unlinked
const memoryStore: Record<string, string> = {
  railone_booked_tickets: JSON.stringify([]),
  railone_saved_passengers: JSON.stringify([]),
};

const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    if (AsyncStorageModule && typeof AsyncStorageModule.getItem === 'function') {
      const val = await AsyncStorageModule.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // Native module error, fallback to memoryStore
  }
  return memoryStore[key] ?? null;
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  memoryStore[key] = value;
  try {
    if (AsyncStorageModule && typeof AsyncStorageModule.setItem === 'function') {
      await AsyncStorageModule.setItem(key, value);
    }
  } catch {
    // Native module error, memoryStore is already updated
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
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const DEFAULT_PASSENGERS: SavedPassenger[] = [
        { id: '1', name: 'Akbar Khan', age: 45, gender: 'M', berthPreference: 'WS', foodPreference: 'Veg' },
        { id: '2', name: 'Bano Begam', age: 51, gender: 'F', berthPreference: 'WS', foodPreference: 'No Food', verified: true },
        { id: '3', name: 'Islam Khan', age: 53, gender: 'M', berthPreference: 'NC', foodPreference: 'No Food' },
        { id: '4', name: 'Shabnam Khan', age: 29, gender: 'F', berthPreference: 'WS', foodPreference: 'Veg' },
        { id: '5', name: 'Shahrukh Khan', age: 26, gender: 'M', berthPreference: 'NC', foodPreference: 'No Food', verified: true },
        { id: '6', name: 'Shivam Tomar', age: 24, gender: 'M', berthPreference: 'NC', foodPreference: 'Diabetic Veg', verified: true },
      ];
      await safeSetItem(KEYS.SAVED_PASSENGERS, JSON.stringify(DEFAULT_PASSENGERS));
      return DEFAULT_PASSENGERS;
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
  getLastUserEmail: async (): Promise<{ email: string; name?: string } | null> => {
    try {
      const data = await safeGetItem('railone_last_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setLastUserEmail: async (user: { email: string; name?: string }): Promise<void> => {
    try {
      await safeSetItem('railone_last_user', JSON.stringify(user));
    } catch {}
  },
};

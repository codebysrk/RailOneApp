import AsyncStorage from '@react-native-async-storage/async-storage';
import { StationModel, INITIAL_STATIONS } from '@/services/firebase/seed';

const CACHE_KEY_STATIONS = '@railone_cached_stations_v1';
const CACHE_KEY_TIME = '@railone_cached_stations_time';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 Hours

export const StationsCacheService = {
  /**
   * Get stations from local AsyncStorage cache if still valid
   */
  getCachedStations: async (): Promise<StationModel[] | null> => {
    try {
      const [cachedData, cachedTime] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEY_STATIONS),
        AsyncStorage.getItem(CACHE_KEY_TIME),
      ]);

      if (!cachedData || !cachedTime) return null;

      const time = parseInt(cachedTime, 10);
      const isExpired = Date.now() - time > CACHE_EXPIRY_MS;
      if (isExpired) return null;

      const parsed = JSON.parse(cachedData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return null;
    } catch (err) {
      console.warn('Error reading cached stations:', err);
      return null;
    }
  },

  /**
   * Save fetched stations into AsyncStorage cache
   */
  setCachedStations: async (stations: StationModel[]): Promise<void> => {
    try {
      if (!Array.isArray(stations) || stations.length === 0) return;
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEY_STATIONS, JSON.stringify(stations)),
        AsyncStorage.setItem(CACHE_KEY_TIME, Date.now().toString()),
      ]);
    } catch (err) {
      console.warn('Error saving stations to cache:', err);
    }
  },

  /**
   * Invalidate / purge local stations cache
   */
  invalidateCache: async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEY_STATIONS),
        AsyncStorage.removeItem(CACHE_KEY_TIME),
      ]);
    } catch (err) {
      console.warn('Error invalidating stations cache:', err);
    }
  },

  /**
   * Helper to get stations: checks cache first, then executes fetcher, and caches the result
   */
  loadStationsWithCache: async (
    fetchFromFirestore: () => Promise<StationModel[]>,
    forceRefresh: boolean = false
  ): Promise<StationModel[]> => {
    if (!forceRefresh) {
      const cached = await StationsCacheService.getCachedStations();
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    try {
      const live = await fetchFromFirestore();
      if (live && live.length > 0) {
        await StationsCacheService.setCachedStations(live);
        return live;
      }
    } catch (err) {
      console.warn('Could not fetch live stations, checking stale cache/seed:', err);
    }

    // Try stale cache if offline
    try {
      const staleData = await AsyncStorage.getItem(CACHE_KEY_STATIONS);
      if (staleData) {
        const parsed = JSON.parse(staleData);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return INITIAL_STATIONS;
  },
};


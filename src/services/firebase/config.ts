import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
} from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  memoryLruGarbageCollector,
  getFirestore,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: "AIzaSyB5dQBQdBUSvxtpQNQ3dHhMaTbTUktTZLU",
  authDomain: "railonee.firebaseapp.com",
  projectId: "railonee",
  storageBucket: "railonee.firebasestorage.app",
  messagingSenderId: "1055350325560",
  appId: "1:1055350325560:android:7321d846705015b32701cd",
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage Persistence safely
let authInstance: any;
try {
  const persistence = typeof getReactNativePersistence === 'function' && AsyncStorage ? getReactNativePersistence(AsyncStorage) : undefined;
  if (persistence) {
    authInstance = initializeAuth(app, { persistence });
  } else {
    authInstance = getAuth(app);
  }
} catch {
  try {
    authInstance = getAuth(app);
  } catch (err) {
    console.warn('Firebase getAuth error:', err);
  }
}

// Initialize Firestore with React Native optimized Memory Cache and LRU GC (auto memory cleanup)
let firestoreInstance: any;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: memoryLocalCache({
      garbageCollector: memoryLruGarbageCollector(),
    }),
  });
} catch {
  try {
    firestoreInstance = getFirestore(app);
  } catch (err) {
    console.warn('Firebase getFirestore error:', err);
  }
}

export const auth = authInstance;
export const db = firestoreInstance;


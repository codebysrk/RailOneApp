import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  getDocs,
  where,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseSeedService, StationModel, TrainModel, INITIAL_STATIONS, INITIAL_TRAINS } from './DatabaseSeedService';

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  balanceAfter: number;
  timestamp: any;
  status: 'success' | 'failed';
}

export interface PNRPassenger {
  name: string;
  bookingStatus: string;
  currentStatus: string;
  coach: string;
  berth: number;
}

export interface PNRRecord {
  pnr: string;
  trainNumber: string;
  trainName: string;
  doj: string;
  from: string;
  to: string;
  chartStatus: string;
  passengers: PNRPassenger[];
}

const firebaseConfig = {
  apiKey: "AIzaSyB5dQBQdBUSvxtpQNQ3dHhMaTbTUktTZLU",
  authDomain: "railonee.firebaseapp.com",
  projectId: "railonee",
  storageBucket: "railonee.firebasestorage.app",
  messagingSenderId: "1055350325560",
  appId: "1:1055350325560:android:7321d846705015b32701cd",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage Persistence safely
let auth: any;
try {
  const persistence = typeof getReactNativePersistence === 'function' && AsyncStorage ? getReactNativePersistence(AsyncStorage) : undefined;
  if (persistence) {
    auth = initializeAuth(app, { persistence });
  } else {
    auth = getAuth(app);
  }
} catch {
  try {
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase getAuth error:', err);
  }
}

// Initialize Firestore
const db = getFirestore(app);

// Attempt master seed in background
DatabaseSeedService.seedMastersIfEmpty();

export const FirebaseService = {
  // ─── Auth ───────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  },

  register: async (name: string, mobile: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          name,
          mobile,
          wallet: 250.0, // Welcome bonus balance
          createdAt: serverTimestamp(),
        });
        // Add welcome bonus transaction to wallet ledger
        const txnId = 'TXN_' + Date.now();
        await setDoc(doc(db, 'users', user.uid, 'wallet_ledger', txnId), {
          id: txnId,
          type: 'credit',
          amount: 250.0,
          description: 'Welcome Bonus',
          balanceAfter: 250.0,
          timestamp: serverTimestamp(),
          status: 'success',
        });
      } catch (err) {
        console.warn('Could not save user profile to Firestore:', err);
      }
    }
    return user;
  },

  logout: async () => {
    return signOut(auth);
  },

  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // ─── User Profile & Wallet ───────────────────────────────────
  getUserProfile: async (uid: string) => {
    return getDoc(doc(db, 'users', uid));
  },

  updateUserProfile: async (uid: string, data: { name?: string; mobile?: string; wallet?: number }) => {
    const userRef = doc(db, 'users', uid);
    return setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  updateWallet: async (uid: string, amount: number) => {
    return updateDoc(doc(db, 'users', uid), { wallet: amount });
  },

  addWalletFunds: async (uid: string, amount: number, description: string = 'Added via UPI') => {
    const userRef = doc(db, 'users', uid);
    return runTransaction(db, async (txn) => {
      const userDoc = await txn.get(userRef);
      const currentWallet = userDoc.exists() ? (userDoc.data()?.wallet || 0) : 0;
      const newBalance = Number((currentWallet + amount).toFixed(2));
      txn.update(userRef, { wallet: newBalance });

      const txnId = 'TXN_' + Date.now();
      const ledgerRef = doc(db, 'users', uid, 'wallet_ledger', txnId);
      txn.set(ledgerRef, {
        id: txnId,
        type: 'credit',
        amount,
        description,
        balanceAfter: newBalance,
        timestamp: serverTimestamp(),
        status: 'success',
      });
      return newBalance;
    });
  },

  getWalletTransactions: async (uid: string) => {
    try {
      const q = query(collection(db, 'users', uid, 'wallet_ledger'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const txns: WalletTransaction[] = [];
      snap.forEach((d) => txns.push({ id: d.id, ...d.data() } as WalletTransaction));
      return txns;
    } catch {
      return [];
    }
  },

  // ─── Tickets ────────────────────────────────────────────────
  saveTicket: async (uid: string, ticket: any, deductWallet: boolean = false) => {
    const userRef = doc(db, 'users', uid);
    const ticketRef = doc(db, 'users', uid, 'tickets', ticket.id);
    const fareNum = parseFloat(ticket.fare) || 0;

    if (deductWallet && fareNum > 0) {
      return runTransaction(db, async (txn) => {
        const userDoc = await txn.get(userRef);
        const currentWallet = userDoc.exists() ? (userDoc.data()?.wallet || 0) : 0;
        const newBalance = Math.max(0, Number((currentWallet - fareNum).toFixed(2)));
        txn.update(userRef, { wallet: newBalance });

        const txnId = 'TXN_' + Date.now();
        const ledgerRef = doc(db, 'users', uid, 'wallet_ledger', txnId);
        txn.set(ledgerRef, {
          id: txnId,
          type: 'debit',
          amount: fareNum,
          description: `Ticket booking ${ticket.ticketId}`,
          balanceAfter: newBalance,
          timestamp: serverTimestamp(),
          status: 'success',
        });

        txn.set(ticketRef, {
          ...ticket,
          bookedAt: serverTimestamp(),
        });
      });
    }

    return setDoc(ticketRef, {
      ...ticket,
      bookedAt: serverTimestamp(),
    });
  },

  getTickets: async (uid: string) => {
    const q = query(collection(db, 'users', uid, 'tickets'), orderBy('bookedAt', 'desc'));
    return getDocs(q);
  },

  listenToTickets: (uid: string, callback: (snapshot: any) => void) => {
    const q = query(collection(db, 'users', uid, 'tickets'), orderBy('bookedAt', 'desc'));
    return onSnapshot(q, callback, (err) => {
      console.warn('Firestore tickets subscription error:', err);
    });
  },

  updateTicketStatus: async (uid: string, ticketId: string, status: string) => {
    return updateDoc(doc(db, 'users', uid, 'tickets', ticketId), { status });
  },

  // ─── Station Masters ────────────────────────────────────────
  getStations: async (): Promise<StationModel[]> => {
    try {
      const snap = await getDocs(collection(db, 'stations'));
      if (!snap.empty) {
        const stations: StationModel[] = [];
        snap.forEach((d) => stations.push(d.data() as StationModel));
        return stations;
      }
    } catch {
      // Fallback
    }
    return INITIAL_STATIONS;
  },

  searchStations: async (queryText: string): Promise<StationModel[]> => {
    const q = queryText.toUpperCase().trim();
    if (!q) return INITIAL_STATIONS.slice(0, 10);
    const all = await FirebaseService.getStations();
    return all.filter(
      (s) => s.code.includes(q) || s.name.toUpperCase().includes(q) || s.city.toUpperCase().includes(q)
    );
  },

  // ─── Train Masters ──────────────────────────────────────────
  getTrains: async (): Promise<TrainModel[]> => {
    try {
      const snap = await getDocs(collection(db, 'trains'));
      if (!snap.empty) {
        const trains: TrainModel[] = [];
        snap.forEach((d) => trains.push(d.data() as TrainModel));
        return trains;
      }
    } catch {
      // Fallback
    }
    return INITIAL_TRAINS;
  },

  // ─── PNR Lookup ─────────────────────────────────────────────
  lookupPNR: async (pnr: string): Promise<PNRRecord> => {
    try {
      const docSnap = await getDoc(doc(db, 'pnr_records', pnr));
      if (docSnap.exists()) {
        return docSnap.data() as PNRRecord;
      }
    } catch {
      // Fallback
    }
    // Dynamic realistic Indian Railways PNR fallback mock
    return {
      pnr,
      trainNumber: '12279',
      trainName: 'TAJ EXPRESS',
      doj: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      from: 'MORENA (MRA)',
      to: 'HAZRAT NIZAMUDDIN (NZM)',
      chartStatus: 'CHART PREPARED',
      passengers: [
        {
          name: 'Passenger 1',
          bookingStatus: 'CNF / D1 / 42',
          currentStatus: 'CNF / D1 / 42 (Window)',
          coach: 'D1',
          berth: 42,
        },
      ],
    };
  },
};

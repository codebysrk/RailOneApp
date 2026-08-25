import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { StationModel, TrainModel, INITIAL_STATIONS, INITIAL_TRAINS } from '@/services/firebase/seed';

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

export const FirebaseFirestoreService = {
  // ─── User Profile & Wallet ───────────────────────────────────
  getUserProfile: async (uid: string) => {
    return getDoc(doc(db, 'users', uid));
  },

  getAllUsers: async () => {
    const q = query(collection(db, 'users'), limit(50));
    const snapshot = await getDocs(q);
    const users: any[] = [];
    snapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() });
    });
    return users;
  },

  topUpUserWallet: async (uid: string, amount: number, adminEmail: string = 'Admin') => {
    const userRef = doc(db, 'users', uid);
    return runTransaction(db, async (txn) => {
      const userDoc = await txn.get(userRef);
      const currentWallet = userDoc.exists() ? (userDoc.data()?.wallet || 0) : 0;
      const newBalance = Number((currentWallet + amount).toFixed(2));
      txn.set(userRef, { wallet: newBalance }, { merge: true });

      const txnId = 'TXN_' + Date.now();
      const ledgerRef = doc(db, 'users', uid, 'wallet_ledger', txnId);
      txn.set(ledgerRef, {
        id: txnId,
        type: 'credit',
        amount,
        description: `Admin Top-Up by ${adminEmail}`,
        balanceAfter: newBalance,
        timestamp: serverTimestamp(),
        status: 'success',
      });
      return newBalance;
    });
  },

  toggleUserStatus: async (uid: string, newStatus: 'active' | 'blocked') => {
    const userRef = doc(db, 'users', uid);
    return setDoc(userRef, { status: newStatus, updatedAt: serverTimestamp() }, { merge: true });
  },

  updateUserProfile: async (uid: string, data: { name?: string; mobile?: string; wallet?: number; role?: string; status?: 'active' | 'blocked' }) => {
    const userRef = doc(db, 'users', uid);
    // FIX C1: use setDoc with merge so doc is created if missing
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
      // FIX C1: set with merge instead of update so doc is created if missing
      txn.set(userRef, { wallet: newBalance }, { merge: true });

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

  getWalletTransactions: async (uid: string, maxLimit: number = 50) => {
    try {
      const q = query(
        collection(db, 'users', uid, 'wallet_ledger'),
        orderBy('timestamp', 'desc'),
        limit(maxLimit)
      );
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

        // FIX C2: reject booking if insufficient wallet balance
        if (currentWallet < fareNum) {
          throw new Error(`Insufficient wallet balance. Available: ₹${currentWallet.toFixed(2)}, Required: ₹${fareNum.toFixed(2)}`);
        }

        const newBalance = Number((currentWallet - fareNum).toFixed(2));
        // FIX C1: set with merge instead of update
        txn.set(userRef, { wallet: newBalance }, { merge: true });

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
        return newBalance;
      });
    }

    return setDoc(ticketRef, {
      ...ticket,
      bookedAt: serverTimestamp(),
    });
  },

  getTickets: async (uid: string, maxLimit: number = 50) => {
    const q = query(
      collection(db, 'users', uid, 'tickets'),
      orderBy('bookedAt', 'desc'),
      limit(maxLimit)
    );
    return getDocs(q);
  },

  listenToTickets: (uid: string, callback: (snapshot: any) => void, maxLimit: number = 50) => {
    const q = query(
      collection(db, 'users', uid, 'tickets'),
      orderBy('bookedAt', 'desc'),
      limit(maxLimit)
    );
    return onSnapshot(q, callback, (err) => {
      console.warn('Firestore tickets subscription error:', err);
    });
  },

  updateTicketStatus: async (uid: string, ticketId: string, status: string) => {
    return updateDoc(doc(db, 'users', uid, 'tickets', ticketId), { status });
  },

  // ─── Station Masters ────────────────────────────────────────
  getStations: async (maxLimit: number = 50): Promise<StationModel[]> => {
    try {
      const q = query(collection(db, 'stations'), limit(maxLimit));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const stations: StationModel[] = [];
        snap.forEach((d) => stations.push(d.data() as StationModel));
        return stations;
      }
    } catch {
      // Fallback to seed data
    }
    return INITIAL_STATIONS.slice(0, maxLimit);
  },

  searchStations: async (queryText: string, maxLimit: number = 25): Promise<StationModel[]> => {
    const qRaw = queryText.trim();
    const qLower = qRaw.toLowerCase();
    const qUpper = qRaw.toUpperCase();

    // 1. Empty query: return popular stations with limit
    if (!qRaw) {
      try {
        const qPopular = query(
          collection(db, 'stations'),
          where('isPopular', '==', true),
          limit(maxLimit)
        );
        const snap = await getDocs(qPopular);
        if (!snap.empty) {
          const stations: StationModel[] = [];
          snap.forEach((d) => stations.push(d.data() as StationModel));
          return stations;
        }
      } catch {}

      // Fallback to memory
      const popular = INITIAL_STATIONS.filter((s) => s.isPopular);
      return popular.length > 0 ? popular.slice(0, maxLimit) : INITIAL_STATIONS.slice(0, maxLimit);
    }

    // 2. Keyword Indexed Firestore search
    try {
      const qKeywords = query(
        collection(db, 'stations'),
        where('keywords', 'array-contains', qLower),
        limit(maxLimit)
      );
      const snap = await getDocs(qKeywords);
      if (!snap.empty) {
        const stations: StationModel[] = [];
        snap.forEach((d) => stations.push(d.data() as StationModel));
        return stations;
      }
    } catch {}

    // 3. High performance in-memory fallback (Instant & Offline-Safe)
    return INITIAL_STATIONS.filter(
      (s) =>
        s.code?.toUpperCase().includes(qUpper) ||
        s.name?.toUpperCase().includes(qUpper) ||
        s.city?.toUpperCase().includes(qUpper) ||
        s.state?.toUpperCase().includes(qUpper)
    ).slice(0, maxLimit);
  },

  // ─── Train Masters ──────────────────────────────────────────
  getTrains: async (maxLimit: number = 50): Promise<TrainModel[]> => {
    try {
      const q = query(collection(db, 'trains'), limit(maxLimit));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const trains: TrainModel[] = [];
        snap.forEach((d) => trains.push(d.data() as TrainModel));
        return trains;
      }
    } catch {
      // Fallback to seed data
    }
    return INITIAL_TRAINS.slice(0, maxLimit);
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

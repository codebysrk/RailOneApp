import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
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
    const all = await FirebaseFirestoreService.getStations();
    if (!q) {
      const popular = all.filter((s) => s.isPopular);
      return popular.length > 0 ? popular : all.slice(0, 25);
    }
    return all.filter(
      (s) =>
        s.code.toUpperCase().includes(q) ||
        s.name.toUpperCase().includes(q) ||
        s.city.toUpperCase().includes(q) ||
        s.state.toUpperCase().includes(q)
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


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
  deleteDoc,
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

  initializeUserProfile: async (uid: string, data: any) => {
    const userRef = doc(db, 'users', uid);
    return setDoc(
      userRef,
      {
        uid,
        ...data,
        role: data.role || 'user',
        status: data.status || 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  recordLastLogin: async (uid: string) => {
    const userRef = doc(db, 'users', uid);
    return updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  getAllUsers: async () => {
    const q = query(collection(db, 'users'), limit(100));
    const snapshot = await getDocs(q);
    const users: any[] = [];
    snapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() });
    });
    return users;
  },

  updateUserStatus: async (uid: string, status: 'active' | 'disabled') => {
    const userRef = doc(db, 'users', uid);
    return updateDoc(userRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  deleteUserAndLog: async (targetUser: any, adminUser: any) => {
    const uid = targetUser.id || targetUser.uid;
    if (!uid) throw new Error('Invalid user ID for deletion');

    // 1. Write comprehensive audit log to deleted_users collection
    const logRef = doc(db, 'deleted_users', uid);
    await setDoc(logRef, {
      uid,
      email: targetUser.email || 'No email',
      name: targetUser.name || targetUser.displayName || 'Unnamed User',
      mobile: targetUser.mobile || '',
      role: targetUser.role || 'user',
      walletBalanceAtDeletion: targetUser.wallet || 0,
      deletedByAdminId: adminUser?.uid || 'admin',
      deletedByAdminEmail: adminUser?.email || 'admin@railone.com',
      deletedAt: new Date().toISOString(),
      deletedAtTimestamp: serverTimestamp(),
      firebaseAuthStatus: 'pending_auth_removal',
      reason: 'Admin Manual Deletion',
    });

    // 2. Clean up any wallet_ledger subcollection documents to avoid phantom IDs in console
    try {
      const ledgerSnap = await getDocs(collection(db, 'users', uid, 'wallet_ledger'));
      const deletePromises = ledgerSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch {}

    // 3. Delete the user document from Firestore users collection
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);

    return { success: true, uid, email: targetUser.email };
  },

  getDeletedUsersLogs: async () => {
    const q = query(collection(db, 'deleted_users'), limit(50));
    const snapshot = await getDocs(q);
    const logs: any[] = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort client-side by deletedAt descending
    return logs.sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || ''));
  },

  updateDeletedUserAuthStatus: async (uid: string, status: 'auth_removed' | 'pending_auth_removal') => {
    const logRef = doc(db, 'deleted_users', uid);
    return updateDoc(logRef, {
      firebaseAuthStatus: status,
      authRemovedAt: status === 'auth_removed' ? new Date().toISOString() : null,
      updatedAt: serverTimestamp(),
    });
  },

  deleteSingleDeletedUserLog: async (uid: string) => {
    const logRef = doc(db, 'deleted_users', uid);
    return deleteDoc(logRef);
  },

  clearDeletedUsersLogs: async () => {
    const q = query(collection(db, 'deleted_users'), limit(200));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    return { success: true, count: snapshot.docs.length };
  },

  topUpUserWallet: async (uid: string, amount: number, adminEmail: string = 'Admin') => {
    const userRef = doc(db, 'users', uid);
    return runTransaction(db, async (txn) => {
      const userDoc = await txn.get(userRef);
      const currentWallet = userDoc.exists() ? (userDoc.data()?.wallet || 0) : 0;
      const newBalance = Number((currentWallet + amount).toFixed(2));
      txn.set(userRef, { wallet: newBalance, updatedAt: serverTimestamp() }, { merge: true });

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

  updateUserProfile: async (uid: string, data: { name?: string; displayName?: string; mobile?: string; wallet?: number; role?: string }) => {
    const userRef = doc(db, 'users', uid);
    return setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  updateWallet: async (uid: string, amount: number) => {
    return updateDoc(doc(db, 'users', uid), { wallet: amount, updatedAt: serverTimestamp() });
  },

  addWalletFunds: async (uid: string, amount: number, description: string = 'Added via UPI') => {
    const userRef = doc(db, 'users', uid);
    return runTransaction(db, async (txn) => {
      const userDoc = await txn.get(userRef);
      const currentWallet = userDoc.exists() ? (userDoc.data()?.wallet || 0) : 0;
      const newBalance = Number((currentWallet + amount).toFixed(2));
      txn.set(userRef, { wallet: newBalance, updatedAt: serverTimestamp() }, { merge: true });

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

  // ─── Bookings (Top-Level Collection) ──────────────────────────
  saveTicket: async (uid: string, ticket: any, deductWallet: boolean = false) => {
    const userRef = doc(db, 'users', uid);
    const bookingId = ticket.id || ticket.bookingId || ('BK_' + Date.now());
    const bookingRef = doc(db, 'bookings', bookingId);
    const fareNum = parseFloat(ticket.fare) || 0;

    const bookingPayload = {
      ...ticket,
      id: bookingId,
      bookingId: bookingId,
      userId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (deductWallet && fareNum > 0) {
      return runTransaction(db, async (txn) => {
        const userDoc = await txn.get(userRef);
        const currentWallet = userDoc.exists() ? (userDoc.data()?.wallet || 0) : 0;

        if (currentWallet < fareNum) {
          throw new Error(`Insufficient wallet balance. Available: ₹${currentWallet.toFixed(2)}, Required: ₹${fareNum.toFixed(2)}`);
        }

        const newBalance = Number((currentWallet - fareNum).toFixed(2));
        txn.set(userRef, { wallet: newBalance, updatedAt: serverTimestamp() }, { merge: true });

        const txnId = 'TXN_' + Date.now();
        const ledgerRef = doc(db, 'users', uid, 'wallet_ledger', txnId);
        txn.set(ledgerRef, {
          id: txnId,
          type: 'debit',
          amount: fareNum,
          description: `Ticket booking ${ticket.ticketId || ticket.pnr || bookingId}`,
          balanceAfter: newBalance,
          timestamp: serverTimestamp(),
          status: 'success',
        });

        txn.set(bookingRef, bookingPayload);
        return newBalance;
      });
    }

    return setDoc(bookingRef, bookingPayload);
  },

  getTickets: async (uid: string, maxLimit: number = 50) => {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', uid),
      limit(maxLimit)
    );
    return getDocs(q);
  },

  listenToTickets: (uid: string, callback: (snapshot: any) => void, maxLimit: number = 50) => {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', uid),
      limit(maxLimit)
    );
    return onSnapshot(q, callback, (err) => {
      console.warn('Firestore bookings subscription error:', err);
    });
  },

  getAllBookings: async (maxLimit: number = 100) => {
    const q = query(
      collection(db, 'bookings'),
      limit(maxLimit)
    );
    const snapshot = await getDocs(q);
    const bookings: any[] = [];
    snapshot.forEach((d) => bookings.push({ id: d.id, ...d.data() }));
    return bookings;
  },

  getAdminStatistics: async () => {
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(500)));
      const bookingsSnap = await getDocs(query(collection(db, 'bookings'), limit(500)));

      let totalUsers = 0;
      let activeUsers = 0;
      let disabledUsers = 0;
      let totalRevenue = 0;
      let upcomingBookings = 0;
      let completedBookings = 0;
      let cancelledBookings = 0;

      usersSnap.forEach((d) => {
        const u = d.data();
        totalUsers++;
        if (u.status === 'disabled') {
          disabledUsers++;
        } else {
          activeUsers++;
        }
      });

      bookingsSnap.forEach((d) => {
        const b = d.data();
        const fare = parseFloat(b.fare) || 0;
        if (b.status !== 'cancelled') {
          totalRevenue += fare;
        }
        if (b.status === 'upcoming') upcomingBookings++;
        else if (b.status === 'completed') completedBookings++;
        else if (b.status === 'cancelled') cancelledBookings++;
      });

      return {
        totalUsers,
        activeUsers,
        disabledUsers,
        totalBookings: bookingsSnap.size,
        upcomingBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: Number(totalRevenue.toFixed(2)),
      };
    } catch (err) {
      console.warn('Could not compute admin stats:', err);
      return {
        totalUsers: 0,
        activeUsers: 0,
        disabledUsers: 0,
        totalBookings: 0,
        upcomingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
      };
    }
  },

  updateTicketStatus: async (ticketId: string, status: string) => {
    return updateDoc(doc(db, 'bookings', ticketId), {
      status,
      updatedAt: serverTimestamp(),
    });
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

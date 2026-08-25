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
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { StationModel, TrainModel, INITIAL_STATIONS, INITIAL_TRAINS } from '@/services/firebase/seed';
import { StationsCacheService } from '@/services/storage/stationsCache';
import { generateStationKeywords } from '@/constants/stations';

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

export interface WalletRechargeRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userMobile?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  createdAt: any;
  createdAtStr?: string;
  updatedAt?: any;
  approvedAt?: any;
  rejectedAt?: any;
  adminEmail?: string;
  adminId?: string;
  rejectionReason?: string;
}

export const FirebaseFirestoreService = {
  // ─── User Profile & Wallet ───────────────────────────────────
  getUserProfile: async (uid: string) => {
    return getDoc(doc(db, 'users', uid));
  },

  listenToUserProfile: (uid: string, callback: (data: any) => void) => {
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      }
    });
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

    // 2. Clean up ALL user subcollections to avoid phantom documents in console
    const subcollections = ['wallet_ledger', 'notifications', 'saved_routes', 'search_history'];
    for (const sub of subcollections) {
      try {
        const subSnap = await getDocs(collection(db, 'users', uid, sub));
        if (subSnap.size > 0) {
          await Promise.all(subSnap.docs.map((d) => deleteDoc(d.ref)));
        }
      } catch {}
    }

    // 3. Clean up ALL top-level collections associated with this user
    // a) bookings
    try {
      const bSnap = await getDocs(query(collection(db, 'bookings'), where('userId', '==', uid)));
      if (bSnap.size > 0) {
        await Promise.all(bSnap.docs.map((d) => deleteDoc(d.ref)));
      }
    } catch {}

    // b) tickets (legacy / alternate collection if any)
    try {
      const tSnap = await getDocs(query(collection(db, 'tickets'), where('userId', '==', uid)));
      if (tSnap.size > 0) {
        await Promise.all(tSnap.docs.map((d) => deleteDoc(d.ref)));
      }
    } catch {}

    // c) notifications
    try {
      const nSnap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)));
      if (nSnap.size > 0) {
        await Promise.all(nSnap.docs.map((d) => deleteDoc(d.ref)));
      }
    } catch {}

    // d) wallet recharge requests
    try {
      const wrSnap = await getDocs(query(collection(db, 'wallet_requests'), where('userId', '==', uid)));
      if (wrSnap.size > 0) {
        await Promise.all(wrSnap.docs.map((d) => deleteDoc(d.ref)));
      }
    } catch {}

    // e) feedback & support requests
    try {
      const fSnap = await getDocs(query(collection(db, 'feedback'), where('userId', '==', uid)));
      if (fSnap.size > 0) {
        await Promise.all(fSnap.docs.map((d) => deleteDoc(d.ref)));
      }
    } catch {}

    // 4. Delete the root user document from Firestore users collection
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

  // ─── Wallet Recharge Requests (Approval Workflow) ────────────
  createWalletRechargeRequest: async (
    userId: string,
    amount: number,
    userDetails: { name: string; email: string; mobile?: string },
    note: string = 'User App Request'
  ) => {
    const requestId = 'REQ_' + Date.now();
    const reqRef = doc(db, 'wallet_requests', requestId);
    const payload: WalletRechargeRequest = {
      id: requestId,
      userId,
      userName: userDetails.name || 'User',
      userEmail: userDetails.email || '',
      userMobile: userDetails.mobile || '',
      amount,
      status: 'pending',
      note,
      createdAt: serverTimestamp(),
      createdAtStr: new Date().toLocaleString('en-IN'),
    };
    await setDoc(reqRef, payload);

    // Create In-App Notification for Admin
    try {
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        title: 'New Wallet Recharge Request 💰',
        message: `${userDetails.name || 'Passenger'} has requested ₹${amount.toFixed(2)} recharge for approval.`,
        type: 'recharge_request',
        forAdmin: true,
        requestId,
        amount,
        userId,
        userName: userDetails.name,
        isRead: false,
        createdAt: serverTimestamp(),
        createdAtStr: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (e) {
      console.warn('Could not create admin notification:', e);
    }

    return payload;
  },

  getAllRechargeRequests: async (maxLimit: number = 100): Promise<WalletRechargeRequest[]> => {
    try {
      const q = query(collection(db, 'wallet_requests'), limit(maxLimit));
      const snap = await getDocs(q);
      const list: WalletRechargeRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as WalletRechargeRequest));
      // Sort client-side: pending first, then newest
      return list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return (b.id || '').localeCompare(a.id || '');
      });
    } catch (err) {
      console.warn('Error getting recharge requests:', err);
      return [];
    }
  },

  listenToPendingRechargeRequests: (callback: (requests: WalletRechargeRequest[]) => void) => {
    const q = query(
      collection(db, 'wallet_requests'),
      where('status', '==', 'pending'),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      const list: WalletRechargeRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as WalletRechargeRequest));
      callback(list);
    }, (err) => {
      console.warn('Recharge requests listener error:', err);
    });
  },

  approveRechargeRequest: async (
    request: WalletRechargeRequest,
    adminUser: any
  ) => {
    const reqRef = doc(db, 'wallet_requests', request.id);
    const userRef = doc(db, 'users', request.userId);

    const newBalance = await runTransaction(db, async (txn) => {
      const userDoc = await txn.get(userRef);
      const currentWallet = userDoc.exists() ? (userDoc.data()?.wallet || 0) : 0;
      const balance = Number((currentWallet + request.amount).toFixed(2));

      // 1. Update user wallet
      txn.set(userRef, { wallet: balance, updatedAt: serverTimestamp() }, { merge: true });

      // 2. Add credit entry in user's wallet_ledger
      const txnId = 'TXN_' + Date.now();
      const ledgerRef = doc(db, 'users', request.userId, 'wallet_ledger', txnId);
      txn.set(ledgerRef, {
        id: txnId,
        type: 'credit',
        amount: request.amount,
        description: `Approved Recharge (${request.id}) by ${adminUser?.email || 'Admin'}`,
        balanceAfter: balance,
        timestamp: serverTimestamp(),
        status: 'success',
      });

      // 3. Update request status to approved
      txn.update(reqRef, {
        status: 'approved',
        adminRole: adminUser?.role || 'admin',
        adminEmail: adminUser?.email || 'Admin',
        adminId: adminUser?.uid || 'admin',
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return balance;
    });

    // Create Notification for the User
    try {
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        title: 'Wallet Recharge Approved! 🎉',
        message: `₹${request.amount.toFixed(2)} has been credited to your R-Wallet balance.`,
        type: 'recharge_approved',
        userId: request.userId,
        amount: request.amount,
        isRead: false,
        createdAt: serverTimestamp(),
        createdAtStr: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (e) {
      console.warn('Could not create user notification:', e);
    }

    return newBalance;
  },

  rejectRechargeRequest: async (
    requestId: string,
    adminUser: any,
    reason: string = 'Rejected by Administrator'
  ) => {
    const reqRef = doc(db, 'wallet_requests', requestId);
    const snap = await getDoc(reqRef);
    const reqData = snap.data();

    await updateDoc(reqRef, {
      status: 'rejected',
      adminRole: adminUser?.role || 'admin',
      adminEmail: adminUser?.email || 'Admin',
      adminId: adminUser?.uid || 'admin',
      rejectionReason: reason,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Notify User
    if (reqData?.userId) {
      try {
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          title: 'Wallet Recharge Update ⚠️',
          message: `Your recharge request for ₹${(reqData.amount || 0).toFixed(2)} was rejected.`,
          type: 'recharge_rejected',
          userId: reqData.userId,
          isRead: false,
          createdAt: serverTimestamp(),
          createdAtStr: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (e) {
        console.warn('Could not create rejection notification:', e);
      }
    }
  },

  // ─── Notifications Collection ─────────────────────────────────
  getUserNotifications: async (userId: string, isAdmin: boolean = false, maxLimit: number = 50) => {
    try {
      let q;
      if (isAdmin) {
        q = query(collection(db, 'notifications'), limit(maxLimit));
      } else {
        q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          limit(maxLimit)
        );
      }
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const timeA = a.createdAtMillis || (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
        const timeB = b.createdAtMillis || (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
        return timeB - timeA;
      });
      return list;
    } catch {
      return [];
    }
  },

  listenToUserNotifications: (
    userId: string,
    isAdminOrCallback: boolean | ((notifs: any[]) => void) = false,
    callback?: (notifs: any[]) => void
  ) => {
    let actualIsAdmin = false;
    let actualCallback: (notifs: any[]) => void = () => {};
    if (typeof isAdminOrCallback === 'function') {
      actualCallback = isAdminOrCallback;
      actualIsAdmin = false;
    } else {
      actualIsAdmin = !!isAdminOrCallback;
      if (callback) actualCallback = callback;
    }

    let q;
    if (actualIsAdmin) {
      q = query(collection(db, 'notifications'), limit(50));
    } else {
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        limit(50)
      );
    }

    return onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      // Sort new notifications to top
      list.sort((a, b) => {
        const timeA = a.createdAtMillis || (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
        const timeB = b.createdAtMillis || (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
        return timeB - timeA;
      });
      actualCallback(list);
    });
  },

  deleteNotification: async (notificationId: string) => {
    return deleteDoc(doc(db, 'notifications', notificationId));
  },

  clearAllUserNotifications: async (userId: string, isAdmin: boolean = false) => {
    let q;
    if (isAdmin) {
      q = query(collection(db, 'notifications'), limit(100));
    } else {
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        limit(100)
      );
    }
    const snap = await getDocs(q);
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
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

  deleteBooking: async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    return deleteDoc(bookingRef);
  },

  deleteAllUserBookings: async (userId: string) => {
    const q = query(collection(db, 'bookings'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    return { success: true, count: snapshot.docs.length };
  },

  cancelBooking: async (bookingId: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    return updateDoc(bookingRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  },

  updateBookingDistance: async (bookingId: string, newDistance: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    return updateDoc(bookingRef, {
      distance: newDistance,
      updatedAt: serverTimestamp(),
    });
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

  getAllStationsList: async (maxLimit: number = 500, forceRefresh: boolean = false): Promise<StationModel[]> => {
    return StationsCacheService.loadStationsWithCache(async () => {
      const q = query(collection(db, 'stations'), limit(maxLimit));
      const snap = await getDocs(q);
      const firestoreStations: StationModel[] = [];
      snap.forEach((d) => firestoreStations.push(d.data() as StationModel));

      if (firestoreStations.length > 0) {
        // Return sorted Firestore stations
        return firestoreStations.sort((a, b) => a.name.localeCompare(b.name));
      }

      return INITIAL_STATIONS;
    }, forceRefresh);
  },

  syncAllStationsToFirestore: async (): Promise<{ count: number }> => {
    const batch = writeBatch(db);
    let count = 0;

    for (const station of INITIAL_STATIONS) {
      const code = station.code.trim().toUpperCase();
      const stationRef = doc(db, 'stations', code);
      const keywords = generateStationKeywords(station);
      batch.set(
        stationRef,
        {
          code,
          name: station.name.trim(),
          city: station.city ? station.city.trim() : station.name.trim(),
          state: station.state ? station.state.trim() : 'India',
          zone: station.zone ? station.zone.trim().toUpperCase() : 'NR',
          isPopular: Boolean(station.isPopular),
          keywords,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      count++;
    }

    await batch.commit();
    await StationsCacheService.invalidateCache();
    return { count };
  },

  addStation: async (station: StationModel): Promise<StationModel> => {
    const code = station.code.trim().toUpperCase();
    const name = station.name.trim();
    const city = station.city ? station.city.trim() : name;
    const state = station.state ? station.state.trim() : 'India';
    const zone = station.zone ? station.zone.trim().toUpperCase() : 'NR';
    const isPopular = Boolean(station.isPopular);

    const fullStation: StationModel = {
      code,
      name,
      city,
      state,
      zone,
      isPopular,
    };
    fullStation.keywords = generateStationKeywords(fullStation);

    // Save in Firestore
    await setDoc(
      doc(db, 'stations', code),
      {
        ...fullStation,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Update in-memory cache for instant search
    const idx = INITIAL_STATIONS.findIndex((s) => s.code.toUpperCase() === code);
    if (idx >= 0) {
      INITIAL_STATIONS[idx] = fullStation;
    } else {
      INITIAL_STATIONS.unshift(fullStation);
    }

    // Invalidate local storage cache so next fetch gets updated data
    await StationsCacheService.invalidateCache();

    return fullStation;
  },

  deleteStation: async (stationCode: string): Promise<void> => {
    const code = stationCode.trim().toUpperCase();
    await deleteDoc(doc(db, 'stations', code));
    const idx = INITIAL_STATIONS.findIndex((s) => s.code.toUpperCase() === code);
    if (idx >= 0) {
      INITIAL_STATIONS.splice(idx, 1);
    }
    await StationsCacheService.invalidateCache();
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

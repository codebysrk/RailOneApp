import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Share,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FocusAwareStatusBar } from '@/components/common';
import { AppAlert } from '@/context/AlertContext';
import { FirebaseService, FirebaseAuthService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import {
  AdminHeader,
  AdminTabsNav,
  AdminTabType,
  AdminDashboardTab,
  AdminRequestsTab,
  AdminStationsTab,
  AdminUsersTab,
  AdminCreateUserTab,
  AdminBookingsTab,
  AdminAddStationModal,
  AdminEditDistanceModal,
  AdminTopUpModal,
  AdminUserTicketsModal,
  AdminDeletedLogsModal,
} from '@/components/admin';

export const AdminScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user: currentAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTabType>('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  // ─── 1. Metrics & Statistics State ─────────────────────────────
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    disabledUsers: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });

  // ─── 2. User Management State ──────────────────────────────────
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [walletAmount, setWalletAmount] = useState('250');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [createdUser, setCreatedUser] = useState<{
    name: string;
    email: string;
    mobile: string;
    password: string;
    wallet: number;
    role: string;
  } | null>(null);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'active' | 'disabled' | 'admin' | 'user'>('all');
  const [toppingUpId, setToppingUpId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Custom Top-Up Modal State
  const [selectedUserForTopUp, setSelectedUserForTopUp] = useState<any | null>(null);
  const [customTopUpAmount, setCustomTopUpAmount] = useState('500');

  // User-Wise Ticket Modal State
  const [selectedUserForTickets, setSelectedUserForTickets] = useState<any | null>(null);
  const [userTicketsSearch, setUserTicketsSearch] = useState('');
  const [deletingAllUserTickets, setDeletingAllUserTickets] = useState(false);

  // ─── 3. Deleted Users Audit Logs State ─────────────────────────
  const [deletedLogs, setDeletedLogs] = useState<any[]>([]);
  const [showDeletedLogsModal, setShowDeletedLogsModal] = useState(false);

  // ─── 4. Global Bookings State ──────────────────────────────────
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [selectedUserFilterId, setSelectedUserFilterId] = useState<string | 'all'>('all');

  // ─── 5. Wallet Recharge Requests State ─────────────────────────
  const [rechargeRequests, setRechargeRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  // ─── 6. Station Management State ──────────────────────────────
  const [stationsList, setStationsList] = useState<any[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [stationSearchQuery, setStationSearchQuery] = useState('');
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [stnCode, setStnCode] = useState('');
  const [stnName, setStnName] = useState('');
  const [stnCity, setStnCity] = useState('');
  const [stnState, setStnState] = useState('');
  const [stnZone, setStnZone] = useState('NR');
  const [stnIsPopular, setStnIsPopular] = useState(false);
  const [addingStation, setAddingStation] = useState(false);
  const [syncingStations, setSyncingStations] = useState(false);
  const [deletingStationCode, setDeletingStationCode] = useState<string | null>(null);

  // ─── 7. Edit Ticket Distance State ─────────────────────────────
  const [editingDistanceTicket, setEditingDistanceTicket] = useState<any | null>(null);
  const [editDistanceValue, setEditDistanceValue] = useState('');
  const [savingDistance, setSavingDistance] = useState(false);

  useEffect(() => {
    loadAllData();
    const unsub = FirebaseService.listenToPendingRechargeRequests(() => {
      FirebaseService.getAllRechargeRequests().then(setRechargeRequests).catch(() => {});
    });
    return () => unsub();
  }, []);

  const loadAllData = async (forceRefresh: boolean = false) => {
    setLoadingUsers(true);
    setLoadingBookings(true);
    setLoadingRequests(true);
    setLoadingStations(true);
    try {
      const [statsData, usersData, bookingsData, logsData, requestsData, stationsData] = await Promise.all([
        FirebaseService.getAdminStatistics(),
        FirebaseService.getAllUsers(),
        FirebaseService.getAllBookings(),
        FirebaseService.getDeletedUsersLogs().catch(() => []),
        FirebaseService.getAllRechargeRequests().catch(() => []),
        FirebaseService.getAllStationsList(500, forceRefresh).catch(() => []),
      ]);
      setStats(statsData);
      setUsersList(usersData);
      setAllBookings(bookingsData);
      setDeletedLogs(logsData);
      setRechargeRequests(requestsData);
      setStationsList(stationsData);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    } finally {
      setLoadingUsers(false);
      setLoadingBookings(false);
      setLoadingRequests(false);
      setLoadingStations(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    triggerHaptic('light');
    loadAllData(true);
  };

  // Map of userId -> User object for rapid lookups
  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    usersList.forEach((u) => {
      if (u.id) map.set(u.id, u);
      if (u.uid) map.set(u.uid, u);
    });
    return map;
  }, [usersList]);

  // Map of userId -> count of bookings
  const userBookingCountMap = useMemo(() => {
    const map = new Map<string, number>();
    allBookings.forEach((b) => {
      if (b.userId) {
        map.set(b.userId, (map.get(b.userId) || 0) + 1);
      }
    });
    return map;
  }, [allBookings]);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    try {
      if (Platform.OS === 'web') return;
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (type === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      else if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
  };

  // ─── Account Creation Handlers ─────────────────────────────────
  const generateRandomPassword = () => {
    triggerHaptic('light');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
  };

  const handleCreateUser = async () => {
    triggerHaptic('medium');
    if (!name.trim()) {
      AppAlert.show('Required Field', 'Please enter passenger full name.', undefined, 'warning');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      AppAlert.show('Invalid Email', 'Please provide a valid email address.', undefined, 'warning');
      return;
    }
    if (!password.trim() || password.length < 6) {
      AppAlert.show('Weak Password', 'Password must be at least 6 characters long.', undefined, 'warning');
      return;
    }

    const walletNum = parseFloat(walletAmount) || 0;
    setSubmitting(true);
    try {
      const res = await FirebaseAuthService.createManagedUser(
        name.trim(),
        mobile.trim(),
        email.trim().toLowerCase(),
        password.trim(),
        walletNum,
        role
      );

      triggerHaptic('success');
      setCreatedUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim() || '---',
        password: password.trim(),
        wallet: walletNum,
        role,
      });

      setName('');
      setMobile('');
      setEmail('');
      setPassword('');
      setWalletAmount('250');
      setRole('user');

      AppAlert.show(
        'Account Provisioned',
        `User ${res?.email || email} created with ₹${walletNum.toFixed(2)} initial balance.`,
        undefined,
        'success'
      );
      loadAllData();
    } catch (err: any) {
      AppAlert.show('Creation Failed', err?.message || 'Could not provision account.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareCredentials = async (user: any) => {
    triggerHaptic('light');
    try {
      await Share.share({
        message: `RailOne Account Credentials:\n\nRole: ${user.role.toUpperCase()}\nName: ${user.name}\nEmail: ${user.email}\nPassword: ${user.password}\nWallet: ₹${user.wallet}\n\nLogin at RailOne App.`,
      });
    } catch {}
  };

  // ─── User Status & Top-Up Handlers ─────────────────────────────
  const handleToggleUserStatus = async (user: any) => {
    triggerHaptic('medium');
    const uid = user.id || user.uid;
    const isBlocked = user.status === 'disabled';
    const newStatus = isBlocked ? 'active' : 'disabled';

    setStatusUpdatingId(uid);
    try {
      await FirebaseService.updateUserStatus(uid, newStatus);
      triggerHaptic('success');
      setUsersList((prev) =>
        prev.map((u) => ((u.id || u.uid) === uid ? { ...u, status: newStatus } : u))
      );
      AppAlert.show(
        'Status Updated',
        `User ${user.name || user.email} is now ${newStatus === 'active' ? 'Active' : 'Blocked'}.`,
        undefined,
        'info'
      );
    } catch (err: any) {
      AppAlert.show('Action Failed', err?.message || 'Could not update user status.', undefined, 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleTopUpAmount = async (user: any, amount: number) => {
    triggerHaptic('medium');
    const uid = user.id || user.uid;
    setToppingUpId(uid);
    try {
      await FirebaseService.topUpUserWallet(uid, amount, 'Admin Instant Credit');
      triggerHaptic('success');
      setUsersList((prev) =>
        prev.map((u) =>
          (u.id || u.uid) === uid ? { ...u, wallet: (u.wallet || 0) + amount } : u
        )
      );
      AppAlert.show(
        'Wallet Credited',
        `Successfully added ₹${amount} to ${user.name || 'User'}'s wallet.`,
        undefined,
        'success'
      );
    } catch (err: any) {
      AppAlert.show('Top-Up Failed', err?.message || 'Could not credit wallet.', undefined, 'error');
    } finally {
      setToppingUpId(null);
    }
  };

  const handleConfirmCustomTopUp = async () => {
    if (!selectedUserForTopUp) return;
    const amt = parseFloat(customTopUpAmount);
    if (!amt || amt <= 0) {
      AppAlert.show('Invalid Amount', 'Please enter a valid recharge amount.', undefined, 'warning');
      return;
    }
    const user = selectedUserForTopUp;
    setSelectedUserForTopUp(null);
    await handleTopUpAmount(user, amt);
  };

  // ─── User Deletion Handlers ────────────────────────────────────
  const handleDeleteUser = (user: any) => {
    triggerHaptic('heavy');
    const uid = user.id || user.uid;
    AppAlert.show(
      'Permanent Deletion',
      `Delete account for ${user.name || user.email}? All Firestore data (bookings, wallet records, notifications) will be permanently wiped.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete User',
          style: 'destructive',
          onPress: async () => {
            setDeletingUserId(uid);
            try {
              await FirebaseService.deleteUserAndLog(user, currentAdmin?.email || 'admin@railone.com');
              triggerHaptic('success');
              setUsersList((prev) => prev.filter((u) => (u.id || u.uid) !== uid));
              setAllBookings((prev) => prev.filter((b) => b.userId !== uid));
              setRechargeRequests((prev) => prev.filter((r) => r.userId !== uid));
              const updatedLogs = await FirebaseService.getDeletedUsersLogs();
              setDeletedLogs(updatedLogs);

              AppAlert.show(
                'User Deleted & Logged',
                `User wiped from Firestore and logged in Audit Logs with UID:\n${uid}`,
                undefined,
                'info'
              );
            } catch (err: any) {
              AppAlert.show('Deletion Failed', err?.message || 'Could not delete user.', undefined, 'error');
            } finally {
              setDeletingUserId(null);
            }
          },
        },
      ],
      'confirm'
    );
  };

  // ─── Deleted Logs Handlers ─────────────────────────────────────
  const handleClearAllLogs = () => {
    triggerHaptic('heavy');
    AppAlert.show(
      'Clear All Audit Logs',
      'Are you sure you want to permanently clear all deleted user audit records?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.clearDeletedUsersLogs();
              setDeletedLogs([]);
              AppAlert.show('Logs Cleared', 'All audit log entries have been cleared.', undefined, 'info');
            } catch (err: any) {
              AppAlert.show('Failed', err?.message || 'Could not clear logs.', undefined, 'error');
            }
          },
        },
      ],
      'confirm'
    );
  };

  const handleToggleAuthRemoved = async (log: any) => {
    triggerHaptic('light');
    const newStatus = log.firebaseAuthStatus === 'auth_removed' ? 'pending_auth_removal' : 'auth_removed';
    try {
      await FirebaseService.updateDeletedUserAuthStatus(log.id, newStatus);
      setDeletedLogs((prev) =>
        prev.map((l) => (l.id === log.id ? { ...l, firebaseAuthStatus: newStatus } : l))
      );
    } catch {}
  };

  const handleDeleteSingleLog = async (log: any) => {
    triggerHaptic('light');
    try {
      await FirebaseService.deleteSingleDeletedUserLog(log.id);
      setDeletedLogs((prev) => prev.filter((l) => l.id !== log.id));
    } catch {}
  };

  const handleShareOrCopyUid = async (log: any) => {
    triggerHaptic('light');
    try {
      await Share.share({
        message: `Firebase Auth UID for deletion:\n${log.uid}`,
      });
    } catch {}
  };

  // ─── Ticket Management Handlers ───────────────────────────────
  const handleCancelTicket = (booking: any) => {
    triggerHaptic('medium');
    const ticketId = booking.id || booking.bookingId || booking.pnr;
    AppAlert.show(
      'Cancel Ticket',
      `Cancel ticket UTS: ${booking.ticketId || booking.pnr}?`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.cancelBooking(ticketId);
              triggerHaptic('success');
              setAllBookings((prev) =>
                prev.map((b) =>
                  (b.id || b.bookingId || b.pnr) === ticketId ? { ...b, status: 'cancelled' } : b
                )
              );
              AppAlert.show('Ticket Cancelled', 'Booking status updated to cancelled.', undefined, 'info');
            } catch (err: any) {
              AppAlert.show('Action Failed', err?.message || 'Could not cancel ticket.', undefined, 'error');
            }
          },
        },
      ],
      'confirm'
    );
  };

  const handleDeleteBooking = (booking: any) => {
    triggerHaptic('heavy');
    const ticketId = booking.id || booking.bookingId || booking.pnr;
    AppAlert.show(
      'Delete Ticket Record',
      `Permanently remove ticket record ${booking.ticketId || booking.pnr} from Firestore database?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Record',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteBooking(ticketId);
              triggerHaptic('success');
              setAllBookings((prev) =>
                prev.filter((b) => (b.id || b.bookingId || b.pnr) !== ticketId)
              );
              AppAlert.show('Record Deleted', 'Ticket record permanently deleted.', undefined, 'info');
            } catch (err: any) {
              AppAlert.show('Failed', err?.message || 'Could not delete ticket record.', undefined, 'error');
            }
          },
        },
      ],
      'confirm'
    );
  };

  const handleDeleteAllUserBookings = (user: any) => {
    if (!user) return;
    const uid = user.id || user.uid;
    triggerHaptic('heavy');
    AppAlert.show(
      'Delete All User Tickets',
      `Permanently delete all ticket booking records for ${user.name || user.displayName || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Tickets',
          style: 'destructive',
          onPress: async () => {
            setDeletingAllUserTickets(true);
            try {
              const res = await FirebaseService.deleteAllUserBookings(uid);
              triggerHaptic('success');
              setAllBookings((prev) => prev.filter((b) => b.userId !== uid));
              AppAlert.show('All Tickets Deleted', `Successfully deleted ${res.count} tickets for this user.`, undefined, 'info');
              setSelectedUserForTickets(null);
            } catch (err: any) {
              AppAlert.show('Failed', err?.message || 'Could not delete user tickets.', undefined, 'error');
            } finally {
              setDeletingAllUserTickets(false);
            }
          },
        },
      ],
      'confirm'
    );
  };

  // ─── Edit Ticket Distance Handlers ────────────────────────────
  const handleOpenEditDistance = (ticket: any) => {
    triggerHaptic('light');
    setEditingDistanceTicket(ticket);
    const numericOnly = (ticket.distance || '').replace(/[^0-9.]/g, '').trim();
    setEditDistanceValue(numericOnly);
  };

  const handleSaveDistance = async () => {
    if (!editingDistanceTicket) return;
    const numericOnly = editDistanceValue.replace(/[^0-9.]/g, '').trim();
    if (!numericOnly) {
      AppAlert.show('Validation Error', 'Please enter a valid distance (e.g. 345).', undefined, 'warning');
      return;
    }
    const formatted = `${numericOnly} km`;
    setSavingDistance(true);
    try {
      const ticketId = editingDistanceTicket.id || editingDistanceTicket.bookingId;
      await FirebaseService.updateBookingDistance(ticketId, formatted);
      triggerHaptic('success');
      setAllBookings((prev) =>
        prev.map((b) => ((b.id || b.bookingId) === ticketId ? { ...b, distance: formatted } : b))
      );
      AppAlert.show('Distance Updated', `Ticket distance updated to "${formatted}".`, undefined, 'success');
      setEditingDistanceTicket(null);
    } catch (err: any) {
      AppAlert.show('Update Failed', err?.message || 'Could not update ticket distance.', undefined, 'error');
    } finally {
      setSavingDistance(false);
    }
  };

  // ─── Recharge Approval Handlers ────────────────────────────────
  const handleApproveRequest = async (item: any) => {
    triggerHaptic('medium');
    setApprovingRequestId(item.id);
    try {
      await FirebaseService.approveRechargeRequest(item.id, currentAdmin?.email || 'admin@railone.com');
      triggerHaptic('success');
      setRechargeRequests((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, status: 'approved', adminRole: 'Admin' } : r
        )
      );
      setUsersList((prev) =>
        prev.map((u) =>
          (u.id || u.uid) === item.userId ? { ...u, wallet: (u.wallet || 0) + item.amount } : u
        )
      );
      AppAlert.show(
        'Request Approved',
        `Recharge of ₹${item.amount.toFixed(2)} approved & credited to ${item.userName || 'user'}.`,
        undefined,
        'success'
      );
    } catch (err: any) {
      AppAlert.show('Action Failed', err?.message || 'Could not approve request.', undefined, 'error');
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleRejectRequest = (item: any) => {
    triggerHaptic('medium');
    AppAlert.show(
      'Reject Request',
      `Are you sure you want to reject the recharge request of ₹${item.amount.toFixed(2)} from ${item.userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejectingRequestId(item.id);
            try {
              await FirebaseService.rejectRechargeRequest(
                item.id,
                currentAdmin?.email || 'admin@railone.com',
                'Admin rejected'
              );
              triggerHaptic('info' as any);
              setRechargeRequests((prev) =>
                prev.map((r) =>
                  r.id === item.id ? { ...r, status: 'rejected', adminRole: 'Admin' } : r
                )
              );
              AppAlert.show('Request Rejected', 'Recharge request marked as rejected.', undefined, 'info');
            } catch (err: any) {
              AppAlert.show('Action Failed', err?.message || 'Could not reject request.', undefined, 'error');
            } finally {
              setRejectingRequestId(null);
            }
          },
        },
      ],
      'confirm'
    );
  };

  // ─── Station Management Handlers ──────────────────────────────
  const handleAddStation = async () => {
    triggerHaptic('medium');
    if (!stnCode.trim() || !stnName.trim()) {
      AppAlert.show('Required Fields', 'Please enter Station Code and Station Name.', undefined, 'warning');
      return;
    }

    setAddingStation(true);
    try {
      await FirebaseService.addStation({
        code: stnCode.trim().toUpperCase(),
        name: stnName.trim(),
        city: stnCity.trim() || stnName.trim(),
        state: stnState.trim() || 'India',
        zone: stnZone.trim().toUpperCase() || 'NR',
        isPopular: stnIsPopular,
      });

      triggerHaptic('success');
      AppAlert.show(
        'Station Added',
        `Station ${stnName.trim()} (${stnCode.trim().toUpperCase()}) has been registered and published.`,
        undefined,
        'success'
      );

      setShowAddStationModal(false);
      setStnCode('');
      setStnName('');
      setStnCity('');
      setStnState('');
      setStnZone('NR');
      setStnIsPopular(false);

      const updated = await FirebaseService.getAllStationsList();
      setStationsList(updated);
    } catch (err: any) {
      AppAlert.show('Failed to Add Station', err?.message || 'Could not save station.', undefined, 'error');
    } finally {
      setAddingStation(false);
    }
  };

  const handleDeleteStation = (station: any) => {
    triggerHaptic('medium');
    AppAlert.show(
      'Delete Station',
      `Are you sure you want to remove station ${station.name} (${station.code})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingStationCode(station.code);
            try {
              await FirebaseService.deleteStation(station.code);
              AppAlert.show('Station Deleted', `Station ${station.code} removed.`, undefined, 'info');
              const updated = await FirebaseService.getAllStationsList();
              setStationsList(updated);
            } catch (err: any) {
              AppAlert.show('Failed', err?.message || 'Could not delete station.', undefined, 'error');
            } finally {
              setDeletingStationCode(null);
            }
          },
        },
      ],
      'confirm'
    );
  };

  const handleSyncStationsToDb = () => {
    triggerHaptic('medium');
    AppAlert.show(
      'Sync All Stations to Database',
      'Upload and sync all 300+ Indian Railway stations into your Firestore database collection (/stations)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync to DB',
          style: 'default',
          onPress: async () => {
            setSyncingStations(true);
            try {
              const res = await FirebaseService.syncAllStationsToFirestore();
              triggerHaptic('success');
              const updated = await FirebaseService.getAllStationsList();
              setStationsList(updated);
              AppAlert.show(
                'Sync Successful',
                `Successfully synced ${res.count} stations to Firestore database (/stations).`,
                undefined,
                'success'
              );
            } catch (err: any) {
              AppAlert.show('Sync Failed', err?.message || 'Could not sync stations.', undefined, 'error');
            } finally {
              setSyncingStations(false);
            }
          },
        },
      ],
      'confirm'
    );
  };

  // Filtered Stations
  const filteredStations = useMemo(() => {
    const q = stationSearchQuery.trim().toLowerCase();
    if (!q) return stationsList;
    return stationsList.filter((s) => {
      return (
        s.code?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q) ||
        s.zone?.toLowerCase().includes(q)
      );
    });
  }, [stationsList, stationSearchQuery]);

  const pendingRequestsCount = useMemo(
    () => rechargeRequests.filter((r) => r.status === 'pending').length,
    [rechargeRequests]
  );

  // Filtered Recharge Requests
  const filteredRequests = useMemo(() => {
    return rechargeRequests.filter((r) => {
      const q = requestSearchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        r.userName?.toLowerCase().includes(q) ||
        r.userEmail?.toLowerCase().includes(q) ||
        r.userMobile?.includes(q) ||
        r.id?.toLowerCase().includes(q);

      if (!matchesQuery) return false;
      if (requestStatusFilter !== 'all' && r.status !== requestStatusFilter) return false;
      return true;
    });
  }, [rechargeRequests, requestSearchQuery, requestStatusFilter]);

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesQuery =
      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.mobile?.includes(userSearchQuery);

    if (!matchesQuery) return false;
    if (userRoleFilter === 'active') return u.status !== 'disabled';
    if (userRoleFilter === 'disabled') return u.status === 'disabled';
    if (userRoleFilter === 'admin') return u.role === 'admin';
    if (userRoleFilter === 'user') return u.role === 'user';
    return true;
  });

  // Filtered Bookings
  const filteredBookings = allBookings.filter((b) => {
    const user = userMap.get(b.userId);
    const userName = user?.name?.toLowerCase() || '';
    const userEmail = user?.email?.toLowerCase() || '';

    const matchesQuery =
      b.pnr?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.ticketId?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.source?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.dest?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.sourceName?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.destName?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      userName.includes(bookingSearchQuery.toLowerCase()) ||
      userEmail.includes(bookingSearchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false;
    if (selectedUserFilterId !== 'all' && b.userId !== selectedUserFilterId) return false;
    return true;
  });

  // Selected User's Tickets for Modal
  const selectedUserTickets = useMemo(() => {
    if (!selectedUserForTickets) return [];
    const uid = selectedUserForTickets.id || selectedUserForTickets.uid;
    const q = userTicketsSearch.toLowerCase().trim();
    return allBookings.filter((b) => {
      if (b.userId !== uid) return false;
      if (!q) return true;
      return (
        b.ticketId?.toLowerCase().includes(q) ||
        b.pnr?.toLowerCase().includes(q) ||
        b.source?.toLowerCase().includes(q) ||
        b.dest?.toLowerCase().includes(q) ||
        b.sourceName?.toLowerCase().includes(q) ||
        b.destName?.toLowerCase().includes(q) ||
        b.date?.toLowerCase().includes(q)
      );
    });
  }, [selectedUserForTickets, allBookings, userTicketsSearch]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FocusAwareStatusBar backgroundColor="#090d16" barStyle="light-content" />

      {/* ─── Modern Compact Header ────────────────────────────────── */}
      <AdminHeader
        onBack={() => {
          triggerHaptic('light');
          navigation.goBack();
        }}
        onRefresh={onRefresh}
        adminEmail={currentAdmin?.email}
        stats={stats}
      />

      {/* ─── Main Admin Body Container ─────────────────────────────── */}
      <View style={styles.bodyContainer}>
        {/* ─── Segmented Navigation Pills ─────────────────────────── */}
        <AdminTabsNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            triggerHaptic('light');
            setActiveTab(tab);
          }}
          pendingRequestsCount={pendingRequestsCount}
          stationsCount={stationsList.length}
          usersCount={usersList.length}
          bookingsCount={allBookings.length}
        />

        {/* ─── TAB 1: METRICS / DASHBOARD ─────────────────────────── */}
        {activeTab === 'dashboard' && (
          <AdminDashboardTab
            stats={stats}
            pendingRequestsCount={pendingRequestsCount}
            deletedLogsCount={deletedLogs.length}
            refreshing={refreshing}
            onRefresh={onRefresh}
            setActiveTab={(tab) => {
              triggerHaptic('light');
              setActiveTab(tab);
            }}
            onOpenDeletedLogs={() => {
              triggerHaptic('light');
              setShowDeletedLogsModal(true);
            }}
            triggerHaptic={triggerHaptic}
          />
        )}

        {/* ─── TAB 2: RECHARGE REQUESTS ───────────────────────────── */}
        {activeTab === 'requests' && (
          <AdminRequestsTab
            rechargeRequests={rechargeRequests}
            filteredRequests={filteredRequests}
            requestSearchQuery={requestSearchQuery}
            setRequestSearchQuery={setRequestSearchQuery}
            requestStatusFilter={requestStatusFilter}
            setRequestStatusFilter={setRequestStatusFilter}
            loadingRequests={loadingRequests}
            refreshing={refreshing}
            onRefresh={onRefresh}
            approvingRequestId={approvingRequestId}
            rejectingRequestId={rejectingRequestId}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            triggerHaptic={triggerHaptic}
          />
        )}

        {/* ─── TAB 3: STATIONS MANAGEMENT ─────────────────────────── */}
        {activeTab === 'stations' && (
          <AdminStationsTab
            stationsList={stationsList}
            filteredStations={filteredStations}
            stationSearchQuery={stationSearchQuery}
            setStationSearchQuery={setStationSearchQuery}
            loadingStations={loadingStations}
            refreshing={refreshing}
            onRefresh={onRefresh}
            syncingStations={syncingStations}
            deletingStationCode={deletingStationCode}
            onSyncStations={handleSyncStationsToDb}
            onOpenAddModal={() => {
              triggerHaptic('light');
              setShowAddStationModal(true);
            }}
            onDeleteStation={handleDeleteStation}
          />
        )}

        {/* ─── TAB 4: USERS DIRECTORY ─────────────────────────────── */}
        {activeTab === 'users' && (
          <AdminUsersTab
            filteredUsers={filteredUsers}
            deletedLogsCount={deletedLogs.length}
            userSearchQuery={userSearchQuery}
            setUserSearchQuery={setUserSearchQuery}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            loadingUsers={loadingUsers}
            refreshing={refreshing}
            onRefresh={onRefresh}
            userBookingCountMap={userBookingCountMap}
            currentAdminUid={currentAdmin?.uid}
            statusUpdatingId={statusUpdatingId}
            toppingUpId={toppingUpId}
            deletingUserId={deletingUserId}
            onOpenDeletedLogs={() => {
              triggerHaptic('light');
              setShowDeletedLogsModal(true);
            }}
            onSelectUserForTickets={(user) => {
              triggerHaptic('light');
              setUserTicketsSearch('');
              setSelectedUserForTickets(user);
            }}
            onToggleUserStatus={handleToggleUserStatus}
            onTopUpAmount={handleTopUpAmount}
            onSelectUserForTopUp={(user) => setSelectedUserForTopUp(user)}
            onDeleteUser={handleDeleteUser}
            triggerHaptic={triggerHaptic}
          />
        )}

        {/* ─── TAB 5: CREATE USER / ADMIN ─────────────────────────── */}
        {activeTab === 'create-user' && (
          <AdminCreateUserTab
            createdUser={createdUser}
            setCreatedUser={setCreatedUser}
            role={role}
            setRole={setRole}
            name={name}
            setName={setName}
            mobile={mobile}
            setMobile={setMobile}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            walletAmount={walletAmount}
            setWalletAmount={setWalletAmount}
            submitting={submitting}
            onCreateUser={handleCreateUser}
            onGeneratePassword={generateRandomPassword}
            onShareCredentials={handleShareCredentials}
            triggerHaptic={triggerHaptic}
          />
        )}

        {/* ─── TAB 6: GLOBAL & USER BOOKINGS ──────────────────────── */}
        {activeTab === 'bookings' && (
          <AdminBookingsTab
            allBookings={allBookings}
            filteredBookings={filteredBookings}
            bookingSearchQuery={bookingSearchQuery}
            setBookingSearchQuery={setBookingSearchQuery}
            usersList={usersList}
            userBookingCountMap={userBookingCountMap}
            selectedUserFilterId={selectedUserFilterId}
            setSelectedUserFilterId={setSelectedUserFilterId}
            bookingStatusFilter={bookingStatusFilter}
            setBookingStatusFilter={setBookingStatusFilter}
            loadingBookings={loadingBookings}
            refreshing={refreshing}
            onRefresh={onRefresh}
            userMap={userMap}
            onOpenEditDistance={handleOpenEditDistance}
            onSelectUserForTickets={(user) => {
              triggerHaptic('light');
              setUserTicketsSearch('');
              setSelectedUserForTickets(user);
            }}
            onCancelTicket={handleCancelTicket}
            onDeleteBooking={handleDeleteBooking}
            triggerHaptic={triggerHaptic}
          />
        )}
      </View>

      {/* ─── MODALS ─────────────────────────────────────────────────── */}
      <AdminDeletedLogsModal
        visible={showDeletedLogsModal}
        onClose={() => setShowDeletedLogsModal(false)}
        deletedLogs={deletedLogs}
        onClearAllLogs={handleClearAllLogs}
        onToggleAuthRemoved={handleToggleAuthRemoved}
        onDeleteSingleLog={handleDeleteSingleLog}
        onShareOrCopyUid={handleShareOrCopyUid}
      />

      <AdminUserTicketsModal
        visible={!!selectedUserForTickets}
        onClose={() => setSelectedUserForTickets(null)}
        user={selectedUserForTickets}
        userTickets={selectedUserTickets}
        userTicketsSearch={userTicketsSearch}
        setUserTicketsSearch={setUserTicketsSearch}
        onOpenEditDistance={handleOpenEditDistance}
        onCancelTicket={handleCancelTicket}
        onDeleteTicket={handleDeleteBooking}
        onDeleteAllUserTickets={handleDeleteAllUserBookings}
        deletingAll={deletingAllUserTickets}
      />

      <AdminTopUpModal
        visible={!!selectedUserForTopUp}
        onClose={() => setSelectedUserForTopUp(null)}
        user={selectedUserForTopUp}
        customTopUpAmount={customTopUpAmount}
        setCustomTopUpAmount={setCustomTopUpAmount}
        toppingUpId={toppingUpId}
        onConfirmTopUp={handleConfirmCustomTopUp}
      />

      <AdminAddStationModal
        visible={showAddStationModal}
        onClose={() => setShowAddStationModal(false)}
        stnCode={stnCode}
        setStnCode={setStnCode}
        stnName={stnName}
        setStnName={setStnName}
        stnCity={stnCity}
        setStnCity={setStnCity}
        stnState={stnState}
        setStnState={setStnState}
        stnZone={stnZone}
        setStnZone={setStnZone}
        stnIsPopular={stnIsPopular}
        setStnIsPopular={setStnIsPopular}
        addingStation={addingStation}
        onAddStation={handleAddStation}
      />

      <AdminEditDistanceModal
        visible={!!editingDistanceTicket}
        onClose={() => setEditingDistanceTicket(null)}
        ticket={editingDistanceTicket}
        editDistanceValue={editDistanceValue}
        setEditDistanceValue={setEditDistanceValue}
        savingDistance={savingDistance}
        onSaveDistance={handleSaveDistance}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});

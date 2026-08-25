import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Share,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FocusAwareStatusBar } from '@/components/common';
import { FirebaseService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { AppAlert } from '@/context/AlertContext';
import { triggerHaptic } from '@/utils/haptics';

type AdminTab = 'dashboard' | 'users' | 'create' | 'bookings';

export const AdminScreen = () => {
  const navigation = useNavigation<any>();
  const { user: currentAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  // ─── 1. Statistics State ───────────────────────────────────────
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    disabledUsers: number;
    totalBookings: number;
    upcomingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
  }>({
    totalUsers: 0,
    activeUsers: 0,
    disabledUsers: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

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

  // ─── 3. Deleted Users Audit Logs State ─────────────────────────
  const [deletedLogs, setDeletedLogs] = useState<any[]>([]);
  const [showDeletedLogsModal, setShowDeletedLogsModal] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ─── 4. Global Bookings State ──────────────────────────────────
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [selectedUserFilterId, setSelectedUserFilterId] = useState<string | 'all'>('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoadingStats(true);
    setLoadingUsers(true);
    setLoadingBookings(true);
    try {
      const [statsData, usersData, bookingsData, logsData] = await Promise.all([
        FirebaseService.getAdminStatistics(),
        FirebaseService.getAllUsers(),
        FirebaseService.getAllBookings(),
        FirebaseService.getDeletedUsersLogs().catch(() => []),
      ]);
      setStats(statsData);
      setUsersList(usersData);
      setAllBookings(bookingsData);
      setDeletedLogs(logsData);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    } finally {
      setLoadingStats(false);
      setLoadingUsers(false);
      setLoadingBookings(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    triggerHaptic('light');
    loadAllData();
  };

  // Map of userId -> User object for rapid lookups
  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    usersList.forEach((u) => {
      const uid = u.id || u.uid;
      if (uid) map.set(uid, u);
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

  const generateRandomPassword = () => {
    triggerHaptic('light');
    const prefixes = ['Rail', 'Fast', 'Track', 'Super', 'Admin'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setPassword(`${randomPrefix}@${randomNum}`);
  };

  const handleCreateUser = async () => {
    triggerHaptic('medium');

    if (!name.trim() || !mobile.trim() || !email.trim() || !password.trim()) {
      AppAlert.show('Missing Fields', 'Please fill in Name, Mobile, Email, and Password.', undefined, 'warning');
      return;
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      AppAlert.show('Invalid Mobile', 'Please enter a valid 10-digit mobile number.', undefined, 'warning');
      return;
    }

    if (password.length < 6) {
      AppAlert.show('Weak Password', 'Password must be at least 6 characters.', undefined, 'warning');
      return;
    }

    const initWallet = parseFloat(walletAmount) || 0;
    setSubmitting(true);

    try {
      await FirebaseService.createManagedUser(
        name.trim(),
        mobile.trim(),
        email.trim(),
        password,
        initWallet,
        role
      );

      triggerHaptic('success');
      setCreatedUser({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        wallet: initWallet,
        role,
      });

      setName('');
      setMobile('');
      setEmail('');
      setPassword('');
      setWalletAmount('250');
      setRole('user');

      const updatedUsers = await FirebaseService.getAllUsers();
      setUsersList(updatedUsers);
      const updatedStats = await FirebaseService.getAdminStatistics();
      setStats(updatedStats);
    } catch (err: any) {
      AppAlert.show('Creation Failed', err?.message || 'Could not create user.', undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareCredentials = async (cred: any) => {
    triggerHaptic('light');
    const shareMessage = `🚆 Welcome to RailOne!\n\nYour official account credentials:\n\n👤 Name: ${cred.name}\n📱 Mobile: ${cred.mobile}\n📧 Email: ${cred.email}\n🔑 Password: ${cred.password}\n👑 Role: ${cred.role.toUpperCase()}\n💰 Initial Wallet: ₹${cred.wallet.toFixed(2)}\n\nLogin to RailOne app to start booking unreserved train tickets instantly!`;

    try {
      await Share.share({
        message: shareMessage,
        title: 'RailOne Account Credentials',
      });
    } catch {}
  };

  const handleToggleUserStatus = (targetUser: any) => {
    triggerHaptic('medium');
    const newStatus = targetUser.status === 'disabled' ? 'active' : 'disabled';
    const actionLabel = newStatus === 'disabled' ? 'Block' : 'Activate';

    AppAlert.show(
      `${actionLabel} Account`,
      `Are you sure you want to ${actionLabel.toLowerCase()} ${targetUser.name || targetUser.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: newStatus === 'disabled' ? 'destructive' : 'default',
          onPress: async () => {
            const uid = targetUser.id || targetUser.uid;
            setStatusUpdatingId(uid);
            try {
              await FirebaseService.updateUserStatus(uid, newStatus);
              triggerHaptic('success');
              setUsersList((prev) =>
                prev.map((u) => ((u.id || u.uid) === uid ? { ...u, status: newStatus } : u))
              );
              AppAlert.show('Status Updated', `User is now ${newStatus.toUpperCase()}.`, undefined, 'success');
              const updatedStats = await FirebaseService.getAdminStatistics();
              setStats(updatedStats);
            } catch (err: any) {
              AppAlert.show('Update Failed', err?.message || 'Could not update status.', undefined, 'error');
            } finally {
              setStatusUpdatingId(null);
            }
          },
        },
      ],
      'confirm'
    );
  };

  const handleDeleteUser = (targetUser: any) => {
    triggerHaptic('medium');
    const uid = targetUser.id || targetUser.uid;
    const currentAdminUid = currentAdmin?.uid;

    if (uid === currentAdminUid) {
      AppAlert.show('Action Blocked', 'You cannot delete your own logged-in Admin account.', undefined, 'error');
      return;
    }

    AppAlert.show(
      'Delete User & Create Log? ⚠️',
      `Are you sure you want to delete ${targetUser.name || targetUser.email}?\n\nThis will remove the user profile from database and save an Audit Log with UID: ${uid} so you can also remove them from Firebase Authentication.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete & Log',
          style: 'destructive',
          onPress: async () => {
            setDeletingUserId(uid);
            try {
              await FirebaseService.deleteUserAndLog(targetUser, currentAdmin);
              triggerHaptic('success');
              setUsersList((prev) => prev.filter((u) => (u.id || u.uid) !== uid));
              
              // Refresh logs
              const updatedLogs = await FirebaseService.getDeletedUsersLogs();
              setDeletedLogs(updatedLogs);

              const updatedStats = await FirebaseService.getAdminStatistics();
              setStats(updatedStats);

              AppAlert.show(
                'User Deleted & Logged ✅',
                `User removed from Firestore.\n\nAudit log saved with UID: ${uid}\nCheck "Deleted Logs" tab to view details for Firebase Auth removal.`,
                undefined,
                'success'
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

  const handleShareOrCopyUid = async (log: any) => {
    triggerHaptic('light');
    try {
      await Share.share({
        title: `Deleted User Auth Record (${log.email})`,
        message: `RailOne Deleted User Auth Record:\n\nUID: ${log.uid}\nName: ${log.name}\nEmail: ${log.email}\nDeleted At: ${log.deletedAt}\nDeleted By: ${log.deletedByAdminEmail}\n\nPaste this UID into Firebase Console > Authentication to delete the Auth record.`,
      });
    } catch {}
  };

  const handleToggleAuthRemoved = async (log: any) => {
    triggerHaptic('medium');
    const newStatus = log.firebaseAuthStatus === 'auth_removed' ? 'pending_auth_removal' : 'auth_removed';
    try {
      await FirebaseService.updateDeletedUserAuthStatus(log.uid, newStatus);
      triggerHaptic('success');
      setDeletedLogs((prev) =>
        prev.map((l) => (l.uid === log.uid ? { ...l, firebaseAuthStatus: newStatus } : l))
      );
    } catch (err: any) {
      AppAlert.show('Update Failed', err?.message || 'Could not update status.', undefined, 'error');
    }
  };

  const handleClearAllLogs = () => {
    triggerHaptic('medium');
    if (deletedLogs.length === 0) return;

    AppAlert.show(
      'Clear All Audit Logs?',
      'Are you sure you want to permanently clear all deleted user audit logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.clearDeletedUsersLogs();
              triggerHaptic('success');
              setDeletedLogs([]);
              AppAlert.show('Logs Cleared', 'All audit logs have been successfully cleared.', undefined, 'success');
            } catch (err: any) {
              AppAlert.show('Failed', err?.message || 'Could not clear logs.', undefined, 'error');
            }
          },
        },
      ],
      'confirm'
    );
  };

  const handleDeleteSingleLog = (log: any) => {
    triggerHaptic('medium');
    AppAlert.show(
      'Delete Log Entry?',
      `Remove audit log for ${log.name || log.email || log.uid}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Log',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteSingleDeletedUserLog(log.uid || log.id);
              triggerHaptic('success');
              setDeletedLogs((prev) => prev.filter((l) => (l.uid || l.id) !== (log.uid || log.id)));
              AppAlert.show('Log Removed', 'The audit entry was removed.', undefined, 'success');
            } catch (err: any) {
              AppAlert.show('Failed', err?.message || 'Could not delete log.', undefined, 'error');
            }
          },
        },
      ],
      'confirm'
    );
  };

  const handleTopUpAmount = async (targetUser: any, amount: number) => {
    triggerHaptic('medium');
    const uid = targetUser.id || targetUser.uid;
    setToppingUpId(uid);
    try {
      const newBal = await FirebaseService.topUpUserWallet(
        uid,
        amount,
        currentAdmin?.email || 'Admin'
      );
      triggerHaptic('success');
      AppAlert.show(
        'Wallet Recharged',
        `₹${amount} added to ${targetUser.name || targetUser.email}. Balance: ₹${newBal.toFixed(2)}`,
        undefined,
        'success'
      );
      setUsersList((prev) =>
        prev.map((u) => ((u.id || u.uid) === uid ? { ...u, wallet: newBal } : u))
      );
      setSelectedUserForTopUp(null);
    } catch (err: any) {
      AppAlert.show('Top-Up Failed', err?.message || 'Could not recharge wallet.', undefined, 'error');
    } finally {
      setToppingUpId(null);
    }
  };

  const handleCancelTicket = (booking: any) => {
    triggerHaptic('medium');
    AppAlert.show(
      'Cancel Booking',
      `Cancel UTS ticket ${booking.ticketId || booking.pnr}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            const bookingId = booking.id || booking.bookingId;
            try {
              await FirebaseService.updateTicketStatus(bookingId, 'cancelled');
              triggerHaptic('success');
              setAllBookings((prev) =>
                prev.map((b) => ((b.id || b.bookingId) === bookingId ? { ...b, status: 'cancelled' } : b))
              );
              AppAlert.show('Cancelled', 'Ticket cancelled.', undefined, 'success');
              const updatedStats = await FirebaseService.getAdminStatistics();
              setStats(updatedStats);
            } catch (err: any) {
              AppAlert.show('Failed', err?.message || 'Could not cancel ticket.', undefined, 'error');
            }
          },
        },
      ],
      'confirm'
    );
  };

  const handleDeleteBooking = (booking: any) => {
    triggerHaptic('medium');
    const bookingId = booking.id || booking.bookingId;
    AppAlert.show(
      'Delete Ticket Permanently?',
      `Permanently remove ticket ${booking.ticketId || booking.pnr || bookingId} from database?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.deleteBooking(bookingId);
              triggerHaptic('success');
              setAllBookings((prev) =>
                prev.filter((b) => (b.id || b.bookingId) !== bookingId)
              );
              AppAlert.show('Ticket Deleted', 'Ticket permanently removed from Firestore.', undefined, 'success');
              const updatedStats = await FirebaseService.getAdminStatistics();
              setStats(updatedStats);
            } catch (err: any) {
              AppAlert.show('Failed', err?.message || 'Could not delete ticket.', undefined, 'error');
            }
          },
        },
      ],
      'confirm'
    );
  };

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
      b.userId?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      userName.includes(bookingSearchQuery.toLowerCase()) ||
      userEmail.includes(bookingSearchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (selectedUserFilterId !== 'all' && b.userId !== selectedUserFilterId) return false;
    if (bookingStatusFilter === 'upcoming') return b.status === 'upcoming';
    if (bookingStatusFilter === 'completed') return b.status === 'completed';
    if (bookingStatusFilter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  // User-Specific Tickets for the Modal
  const userSpecificTickets = useMemo(() => {
    if (!selectedUserForTickets) return [];
    const uid = selectedUserForTickets.id || selectedUserForTickets.uid;
    return allBookings
      .filter((b) => b.userId === uid)
      .filter((b) => {
        if (!userTicketsSearch) return true;
        const q = userTicketsSearch.toLowerCase();
        return (
          b.ticketId?.toLowerCase().includes(q) ||
          b.pnr?.toLowerCase().includes(q) ||
          b.source?.toLowerCase().includes(q) ||
          b.dest?.toLowerCase().includes(q)
        );
      });
  }, [selectedUserForTickets, allBookings, userTicketsSearch]);

  const userTotalSpent = useMemo(() => {
    if (!selectedUserForTickets) return 0;
    const uid = selectedUserForTickets.id || selectedUserForTickets.uid;
    return allBookings
      .filter((b) => b.userId === uid && b.status !== 'cancelled')
      .reduce((sum, b) => sum + (parseFloat(b.fare) || 0), 0);
  }, [selectedUserForTickets, allBookings]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FocusAwareStatusBar backgroundColor="#090d16" barStyle="light-content" />

      {/* ─── Modern Compact Header ────────────────────────────────── */}
      <View style={styles.compactHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackCircle}
            onPress={() => {
              triggerHaptic('light');
              navigation.goBack();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color="#cbd5e1" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.badgeRow}>
              <View style={styles.liveDot} />
              <Text style={styles.headerBadgeText}>ADMIN CONTROL</Text>
            </View>
            <Text style={styles.adminEmailText} numberOfLines={1}>
              {currentAdmin?.email || 'admin@railone.com'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerSyncCircle}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color="#38bdf8" />
          </TouchableOpacity>
        </View>

        {/* Compact KPI Ribbon */}
        <View style={styles.kpiRibbon}>
          <View style={styles.ribbonCell}>
            <Text style={styles.ribbonLabel}>REVENUE</Text>
            <Text style={styles.ribbonValue}>
              ₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={styles.ribbonDivider} />
          <View style={styles.ribbonCell}>
            <Text style={styles.ribbonLabel}>USERS</Text>
            <Text style={styles.ribbonValue}>{stats.totalUsers}</Text>
          </View>
          <View style={styles.ribbonDivider} />
          <View style={styles.ribbonCell}>
            <Text style={styles.ribbonLabel}>BOOKINGS</Text>
            <Text style={styles.ribbonValue}>{stats.totalBookings}</Text>
          </View>
        </View>
      </View>

      {/* ─── Ultra-Sleek Segmented Tabs (4 Compact Tabs) ──────────── */}
      <View style={styles.tabsWrapper}>
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'dashboard' && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('dashboard');
            }}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
              size={14}
              color={activeTab === 'dashboard' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.segmentText, activeTab === 'dashboard' && styles.segmentTextActive]}>
              Metrics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'users' && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('users');
            }}
            activeOpacity={0.85}
          >
            <Feather
              name="users"
              size={13}
              color={activeTab === 'users' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.segmentText, activeTab === 'users' && styles.segmentTextActive]}>
              Users ({usersList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'create' && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('create');
            }}
            activeOpacity={0.85}
          >
            <Feather
              name="user-plus"
              size={13}
              color={activeTab === 'create' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.segmentText, activeTab === 'create' && styles.segmentTextActive]}>
              +Add
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'bookings' && styles.segmentBtnActive]}
            onPress={() => {
              triggerHaptic('light');
              setActiveTab('bookings');
            }}
            activeOpacity={0.85}
          >
            <Ionicons
              name={activeTab === 'bookings' ? 'receipt' : 'receipt-outline'}
              size={13}
              color={activeTab === 'bookings' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.segmentText, activeTab === 'bookings' && styles.segmentTextActive]}>
              Tickets ({allBookings.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ─── TAB 1: METRICS / DASHBOARD ──────────────────────────── */}
        {activeTab === 'dashboard' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Quick Actions Strip */}
            <View style={styles.quickGrid}>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTab('create');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="user-plus" size={17} color="#0066ff" />
                </View>
                <Text style={styles.quickCardTitle}>Add User</Text>
                <Text style={styles.quickCardSub}>Create account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTab('users');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="wallet-outline" size={18} color="#16a34a" />
                </View>
                <Text style={styles.quickCardTitle}>Recharge</Text>
                <Text style={styles.quickCardSub}>User wallets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTab('bookings');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#faf5ff' }]}>
                  <Ionicons name="ticket-outline" size={18} color="#9333ea" />
                </View>
                <Text style={styles.quickCardTitle}>Tickets</Text>
                <Text style={styles.quickCardSub}>User-wise & all</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => {
                  triggerHaptic('light');
                  setShowDeletedLogsModal(true);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#fee2e2' }]}>
                  <Feather name="trash-2" size={17} color="#b91c1c" />
                </View>
                <Text style={styles.quickCardTitle}>Deleted</Text>
                <Text style={styles.quickCardSub}>{deletedLogs.length} Logs</Text>
              </TouchableOpacity>
            </View>

            {/* Performance KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiCardLabel}>PASSENGERS</Text>
                  <Feather name="users" size={13} color="#0066ff" />
                </View>
                <Text style={styles.kpiCardNum}>{stats.totalUsers}</Text>
                <View style={styles.kpiTagsRow}>
                  <View style={[styles.microTag, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.microTagText, { color: '#15803d' }]}>
                      {stats.activeUsers} Act
                    </Text>
                  </View>
                  <View style={[styles.microTag, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.microTagText, { color: '#b91c1c' }]}>
                      {stats.disabledUsers} Blk
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiCardHeader}>
                  <Text style={styles.kpiCardLabel}>BOOKINGS</Text>
                  <Ionicons name="ticket-outline" size={14} color="#16a34a" />
                </View>
                <Text style={styles.kpiCardNum}>{stats.totalBookings}</Text>
                <View style={styles.kpiTagsRow}>
                  <View style={[styles.microTag, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.microTagText, { color: '#b45309' }]}>
                      {stats.upcomingBookings} Upc
                    </Text>
                  </View>
                  <View style={[styles.microTag, { backgroundColor: '#ffe4e6' }]}>
                    <Text style={[styles.microTagText, { color: '#be123c' }]}>
                      {stats.cancelledBookings} Cnl
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Compact Security & Audit Log Banner */}
            <TouchableOpacity
              style={styles.securityStrip}
              onPress={() => {
                triggerHaptic('light');
                setShowDeletedLogsModal(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#0066ff" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.securityTitle}>Deleted Users Audit Logs ({deletedLogs.length})</Text>
                <Text style={styles.securitySubtitle}>
                  View deleted accounts UIDs to remove them from Firebase Auth.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── TAB 2: USER DIRECTORY (WITH DELETE & AUDIT LOG ACCESS) ─ */}
        {activeTab === 'users' && (
          <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }}>
            {/* Search Input & Deleted Logs Shortcut Button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={[styles.searchBar, { flex: 1, marginBottom: 0 }]}>
                <Ionicons name="search" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search name, mobile, email..."
                  placeholderTextColor="#94a3b8"
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                  autoCapitalize="none"
                />
                {userSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setUserSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.deletedLogsPill}
                onPress={() => {
                  triggerHaptic('light');
                  setShowDeletedLogsModal(true);
                }}
                activeOpacity={0.8}
              >
                <Feather name="trash-2" size={12} color="#b91c1c" style={{ marginRight: 3 }} />
                <Text style={styles.deletedLogsPillText}>Logs ({deletedLogs.length})</Text>
              </TouchableOpacity>
            </View>

            {/* Micro Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active 🟢' },
                { id: 'disabled', label: 'Blocked 🔴' },
                { id: 'admin', label: 'Admins 👑' },
                { id: 'user', label: 'Users 👤' },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.chipBtn,
                    userRoleFilter === chip.id && styles.chipBtnActive,
                  ]}
                  onPress={() => {
                    triggerHaptic('light');
                    setUserRoleFilter(chip.id as any);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipBtnText,
                      userRoleFilter === chip.id && styles.chipBtnTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loadingUsers ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color="#0066ff" />
                <Text style={styles.centerText}>Loading accounts...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id || item.uid}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                  <View style={styles.centerBox}>
                    <Feather name="users" size={32} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No users match query</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isBlocked = item.status === 'disabled';
                  const isAdmin = item.role === 'admin';
                  const uid = item.id || item.uid;
                  const ticketCount = userBookingCountMap.get(uid) || 0;
                  const isCurrentAdmin = uid === currentAdmin?.uid;

                  return (
                    <View style={[styles.compactUserCard, isBlocked && styles.compactUserCardBlocked]}>
                      {/* Top Row: Avatar + Name + Role + Balance */}
                      <View style={styles.compactUserHeader}>
                        <View style={[styles.miniAvatar, isAdmin && { backgroundColor: '#fef3c7' }]}>
                          <Text style={[styles.miniAvatarText, isAdmin && { color: '#b45309' }]}>
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 9 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.userNameText} numberOfLines={1}>
                              {item.name || item.displayName || 'Passenger'}
                            </Text>
                            <View style={[styles.roleMicroTag, isAdmin ? styles.roleAdminTag : styles.roleUserTag]}>
                              <Text style={[styles.roleMicroTagText, isAdmin ? styles.roleAdminText : styles.roleUserText]}>
                                {isAdmin ? 'ADMIN' : 'USER'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.userSubText} numberOfLines={1}>
                            {item.email || 'No email'} {item.mobile ? `• ${item.mobile}` : ''}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.walletNum}>₹{(item.wallet || 0).toFixed(0)}</Text>
                          <Text style={styles.walletMicroLabel}>WALLET</Text>
                        </View>
                      </View>

                      {/* Bottom Action Row with "View Tickets", Status, Topup & Delete */}
                      <View style={styles.userCardFooter}>
                        {/* 🎫 USER TICKETS INSPECTOR BUTTON */}
                        <TouchableOpacity
                          style={[
                            styles.userTicketsPill,
                            ticketCount > 0 ? styles.userTicketsPillActive : styles.userTicketsPillEmpty,
                          ]}
                          onPress={() => {
                            triggerHaptic('light');
                            setUserTicketsSearch('');
                            setSelectedUserForTickets(item);
                          }}
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name="ticket"
                            size={12}
                            color={ticketCount > 0 ? '#0066ff' : '#94a3b8'}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={[
                              styles.userTicketsPillText,
                              ticketCount > 0 ? styles.userTicketsPillTextActive : styles.userTicketsPillTextEmpty,
                            ]}
                          >
                            {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
                          </Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            style={[
                              styles.actionPill,
                              isBlocked ? styles.actionPillUnblock : styles.actionPillBlock,
                            ]}
                            onPress={() => handleToggleUserStatus(item)}
                            disabled={statusUpdatingId === uid}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.actionPillText,
                                isBlocked ? styles.actionPillUnblockText : styles.actionPillBlockText,
                              ]}
                            >
                              {isBlocked ? '🟢 Unblock' : '🔴 Block'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.topUpMicroChip}
                            onPress={() => handleTopUpAmount(item, 100)}
                            disabled={toppingUpId === uid}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.topUpMicroText}>+₹100</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.topUpMicroChip}
                            onPress={() => handleTopUpAmount(item, 500)}
                            disabled={toppingUpId === uid}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.topUpMicroText}>+₹500</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.topUpMicroChip, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}
                            onPress={() => setSelectedUserForTopUp(item)}
                            activeOpacity={0.75}
                          >
                            <Ionicons name="add" size={13} color="#475569" />
                          </TouchableOpacity>

                          {/* 🗑️ DELETE USER ACTION BUTTON */}
                          {!isCurrentAdmin && (
                            <TouchableOpacity
                              style={styles.deleteUserBtn}
                              onPress={() => handleDeleteUser(item)}
                              disabled={deletingUserId === uid}
                              activeOpacity={0.75}
                            >
                              {deletingUserId === uid ? (
                                <ActivityIndicator size="small" color="#b91c1c" />
                              ) : (
                                <Feather name="trash-2" size={13} color="#b91c1c" />
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}

        {/* ─── TAB 3: PROVISION ACCOUNT ────────────────────────────── */}
        {activeTab === 'create' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {createdUser && (
              <View style={styles.successBox}>
                <View style={styles.successHeader}>
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  <Text style={styles.successTitle}>Account Created!</Text>
                  <TouchableOpacity
                    style={{ marginLeft: 'auto' }}
                    onPress={() => setCreatedUser(null)}
                  >
                    <Ionicons name="close" size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.credBox}>
                  <Text style={styles.credText}><Text style={{ fontWeight: '700' }}>Name: </Text>{createdUser.name}</Text>
                  <Text style={styles.credText}><Text style={{ fontWeight: '700' }}>Email: </Text>{createdUser.email}</Text>
                  <Text style={styles.credText}><Text style={{ fontWeight: '700' }}>Password: </Text><Text style={{ color: '#0066ff', fontWeight: '700' }}>{createdUser.password}</Text></Text>
                  <Text style={styles.credText}><Text style={{ fontWeight: '700' }}>Role: </Text>{createdUser.role.toUpperCase()}</Text>
                </View>

                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => handleShareCredentials(createdUser)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.shareBtnText}>Share Credentials on WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.compactFormCard}>
              <Text style={styles.formHeader}>Provision New Account</Text>

              {/* Name */}
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              {/* Mobile */}
              <Text style={styles.label}>10-Digit Mobile *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94a3b8"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* Email */}
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. rahul@railone.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password *</Text>
                <TouchableOpacity onPress={generateRandomPassword}>
                  <Text style={styles.autoGenText}>🎲 Auto-Generate</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.formInput}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={15} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Initial Balance */}
              <Text style={styles.label}>Initial Wallet Credit (₹)</Text>
              <View style={styles.balancePillRow}>
                {['100', '250', '500', '1000'].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.balancePill,
                      walletAmount === amt && styles.balancePillActive,
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      setWalletAmount(amt);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.balancePillText,
                        walletAmount === amt && styles.balancePillTextActive,
                      ]}
                    >
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Role Switcher */}
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'user' && styles.roleChipActive]}
                  onPress={() => {
                    triggerHaptic('light');
                    setRole('user');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person" size={13} color={role === 'user' ? '#0066ff' : '#64748b'} />
                  <Text style={[styles.roleChipText, role === 'user' && styles.roleChipTextActive]}>
                    Passenger
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleChip, role === 'admin' && styles.roleChipActive]}
                  onPress={() => {
                    triggerHaptic('light');
                    setRole('admin');
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="shield-crown"
                    size={15}
                    color={role === 'admin' ? '#0066ff' : '#64748b'}
                  />
                  <Text style={[styles.roleChipText, role === 'admin' && styles.roleChipTextActive]}>
                    Administrator
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.75 }]}
                onPress={handleCreateUser}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Create & Authorize Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ─── TAB 4: GLOBAL & USER-FILTERED BOOKINGS ──────────────── */}
        {activeTab === 'bookings' && (
          <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search UTS code, Passenger, Station..."
                placeholderTextColor="#94a3b8"
                value={bookingSearchQuery}
                onChangeText={setBookingSearchQuery}
                autoCapitalize="none"
              />
              {bookingSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setBookingSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Horizontal Filter Bar: Filter by specific user */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipsScroll, { marginBottom: 6 }]}>
              <TouchableOpacity
                style={[
                  styles.chipBtn,
                  selectedUserFilterId === 'all' && styles.chipBtnActive,
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedUserFilterId('all');
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipBtnText,
                    selectedUserFilterId === 'all' && styles.chipBtnTextActive,
                  ]}
                >
                  All Passengers ({allBookings.length})
                </Text>
              </TouchableOpacity>

              {usersList.map((u) => {
                const uid = u.id || u.uid;
                const count = userBookingCountMap.get(uid) || 0;
                if (count === 0) return null;
                const isSelected = selectedUserFilterId === uid;
                return (
                  <TouchableOpacity
                    key={uid}
                    style={[
                      styles.chipBtn,
                      isSelected && styles.chipBtnActive,
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      setSelectedUserFilterId(uid);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.chipBtnText,
                        isSelected && styles.chipBtnTextActive,
                      ]}
                    >
                      👤 {u.name ? u.name.split(' ')[0] : 'User'} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Status Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {[
                { id: 'all', label: 'All Status' },
                { id: 'upcoming', label: 'Upcoming ⏳' },
                { id: 'completed', label: 'Completed ✅' },
                { id: 'cancelled', label: 'Cancelled ❌' },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.chipBtn,
                    bookingStatusFilter === chip.id && styles.chipBtnActive,
                  ]}
                  onPress={() => {
                    triggerHaptic('light');
                    setBookingStatusFilter(chip.id as any);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipBtnText,
                      bookingStatusFilter === chip.id && styles.chipBtnTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loadingBookings ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color="#0066ff" />
                <Text style={styles.centerText}>Loading bookings...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredBookings}
                keyExtractor={(item) => item.id || item.bookingId || item.pnr}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                  <View style={styles.centerBox}>
                    <Ionicons name="ticket-outline" size={32} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No bookings found</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const passenger = userMap.get(item.userId);
                  return (
                    <View style={styles.compactBookingCard}>
                      <View style={styles.bookingCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.bookingUtsCode}>
                            UTS: {item.ticketId || item.pnr || 'XMSQEB'}
                          </Text>
                          <View
                            style={[
                              styles.bookingStatusTag,
                              item.status === 'upcoming' && { backgroundColor: '#fef3c7' },
                              item.status === 'completed' && { backgroundColor: '#dcfce7' },
                              item.status === 'cancelled' && { backgroundColor: '#ffe4e6' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.bookingStatusTagText,
                                item.status === 'upcoming' && { color: '#b45309' },
                                item.status === 'completed' && { color: '#15803d' },
                                item.status === 'cancelled' && { color: '#be123c' },
                              ]}
                            >
                              {(item.status || 'upcoming').toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.bookingFareNum}>₹{item.fare}</Text>
                      </View>

                      {/* Route Line */}
                      <View style={styles.compactRouteRow}>
                        <Text style={styles.routeStation}>
                          {item.sourceCode || (item.source && item.source.substring(0, 4)) || 'SRC'}
                        </Text>
                        <View style={styles.routeLineWrapper}>
                          <Text style={styles.routeDistance}>{item.distance || '---'}</Text>
                          <View style={styles.routeBar} />
                        </View>
                        <Text style={styles.routeStation}>
                          {item.destCode || (item.dest && item.dest.substring(0, 4)) || 'DST'}
                        </Text>
                      </View>

                      {/* Passenger Name & UID Link */}
                      <View style={styles.passengerMetaRow}>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => {
                            if (passenger) {
                              triggerHaptic('light');
                              setUserTicketsSearch('');
                              setSelectedUserForTickets(passenger);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="person-circle" size={14} color="#0066ff" style={{ marginRight: 4 }} />
                          <Text style={styles.passengerNameLink}>
                            {passenger?.name || passenger?.displayName || item.userId?.substring(0, 10) || 'Passenger'}
                          </Text>
                        </TouchableOpacity>

                        <Text style={styles.bookingMetaText}>
                          📅 {item.date || item.journeyDate || '---'}
                        </Text>
                      </View>

                      {/* Footer */}
                      <View style={styles.compactBookingFooter}>
                        <Text style={styles.bookingMetaText}>
                          {item.passengers || '1 Adult'} • {item.trainType || 'Unreserved'}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {item.status === 'upcoming' && (
                            <TouchableOpacity
                              style={styles.cancelPill}
                              onPress={() => handleCancelTicket(item)}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.cancelPillText}>Cancel</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={styles.deleteTicketPill}
                            onPress={() => handleDeleteBooking(item)}
                            activeOpacity={0.75}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Feather name="trash-2" size={12} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ─── 📋 DELETED USERS AUDIT LOGS MODAL ──────────────────────── */}
      <Modal
        visible={showDeletedLogsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeletedLogsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logsModalBox}>
            <View style={styles.userTicketsModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="trash-2" size={16} color="#b91c1c" style={{ marginRight: 6 }} />
                  <Text style={styles.userTicketsModalTitle}>Deleted Users Audit Logs</Text>
                </View>
                <Text style={styles.userTicketsModalSub}>
                  Copy UIDs to delete corresponding Firebase Auth accounts.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {deletedLogs.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearLogsBtn}
                    onPress={handleClearAllLogs}
                    activeOpacity={0.8}
                  >
                    <Feather name="trash" size={11} color="#b91c1c" style={{ marginRight: 3 }} />
                    <Text style={styles.clearLogsBtnText}>Clear All</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowDeletedLogsModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={deletedLogs}
              keyExtractor={(item) => item.id || item.uid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
              ListEmptyComponent={
                <View style={styles.centerBox}>
                  <Feather name="shield" size={36} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>No deleted users logged</Text>
                  <Text style={styles.emptySubtitle}>All registered accounts are currently active in Firestore.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isAuthRemoved = item.firebaseAuthStatus === 'auth_removed';
                return (
                  <View style={styles.logCard}>
                    <View style={styles.logCardHeader}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Text style={styles.logNameText}>{item.name || 'Unnamed'}</Text>
                        <Text style={styles.logEmailText}>{item.email || 'No email'}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                          style={[
                            styles.authStatusBadge,
                            isAuthRemoved ? styles.authStatusBadgeDone : styles.authStatusBadgePending,
                          ]}
                          onPress={() => handleToggleAuthRemoved(item)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.authStatusBadgeText,
                              isAuthRemoved ? styles.authStatusBadgeDoneText : styles.authStatusBadgePendingText,
                            ]}
                          >
                            {isAuthRemoved ? 'Auth Removed ✅' : 'Auth Pending ⚠️'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteSingleLogBtn}
                          onPress={() => handleDeleteSingleLog(item)}
                          activeOpacity={0.75}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Feather name="trash-2" size={13} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* UID Box with Share/Copy */}
                    <View style={styles.uidContainer}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.uidLabel}>FIREBASE AUTH UID:</Text>
                        <Text style={styles.uidValueText} numberOfLines={1} selectable>
                          {item.uid}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.uidCopyBtn}
                        onPress={() => handleShareOrCopyUid(item)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="copy-outline" size={13} color="#0066ff" style={{ marginRight: 3 }} />
                        <Text style={styles.uidCopyBtnText}>Share/Copy</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Log Meta Details */}
                    <View style={styles.logFooterRow}>
                      <Text style={styles.logMetaDetail}>
                        📅 {item.deletedAt ? new Date(item.deletedAt).toLocaleString('en-IN') : 'Recently'}
                      </Text>
                      <Text style={styles.logMetaDetail}>
                        👤 By: {item.deletedByAdminEmail ? item.deletedByAdminEmail.split('@')[0] : 'Admin'}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ─── 🎫 USER-WISE TICKETS MODAL ─────────────────────────────── */}
      <Modal
        visible={!!selectedUserForTickets}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUserForTickets(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userTicketsModalBox}>
            {/* Modal Header */}
            <View style={styles.userTicketsModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.userTicketsModalTitle} numberOfLines={1}>
                    {selectedUserForTickets?.name || selectedUserForTickets?.displayName || 'Passenger'}
                  </Text>
                  <View style={[styles.roleMicroTag, selectedUserForTickets?.role === 'admin' ? styles.roleAdminTag : styles.roleUserTag]}>
                    <Text style={[styles.roleMicroTagText, selectedUserForTickets?.role === 'admin' ? styles.roleAdminText : styles.roleUserText]}>
                      {(selectedUserForTickets?.role || 'USER').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.userTicketsModalSub} numberOfLines={1}>
                  {selectedUserForTickets?.email} {selectedUserForTickets?.mobile ? `• 📱 ${selectedUserForTickets?.mobile}` : ''}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedUserForTickets(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* User Stats Strip */}
            <View style={styles.userModalStatsStrip}>
              <View style={styles.userModalStatCell}>
                <Text style={styles.userModalStatLabel}>TOTAL BOOKED</Text>
                <Text style={styles.userModalStatVal}>{userSpecificTickets.length} Tickets</Text>
              </View>
              <View style={styles.ribbonDivider} />
              <View style={styles.userModalStatCell}>
                <Text style={styles.userModalStatLabel}>TOTAL SPENT</Text>
                <Text style={[styles.userModalStatVal, { color: '#16a34a' }]}>₹{userTotalSpent.toFixed(2)}</Text>
              </View>
              <View style={styles.ribbonDivider} />
              <View style={styles.userModalStatCell}>
                <Text style={styles.userModalStatLabel}>WALLET</Text>
                <Text style={[styles.userModalStatVal, { color: '#0066ff' }]}>₹{(selectedUserForTickets?.wallet || 0).toFixed(0)}</Text>
              </View>
            </View>

            {/* Quick Search within this User's tickets */}
            {userSpecificTickets.length > 2 && (
              <View style={[styles.searchBar, { marginTop: 8, marginBottom: 8 }]}>
                <Ionicons name="search" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Filter this user's tickets..."
                  placeholderTextColor="#94a3b8"
                  value={userTicketsSearch}
                  onChangeText={setUserTicketsSearch}
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* User Ticket Cards List */}
            <FlatList
              data={userSpecificTickets}
              keyExtractor={(item) => item.id || item.bookingId || item.pnr}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20, paddingTop: 6 }}
              ListEmptyComponent={
                <View style={styles.centerBox}>
                  <Ionicons name="ticket-outline" size={36} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>No tickets found for this passenger</Text>
                  <Text style={styles.emptySubtitle}>User hasn't booked any unreserved tickets yet.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.userModalTicketCard}>
                  <View style={styles.bookingCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.bookingUtsCode}>
                        UTS: {item.ticketId || item.pnr || 'XMSQEB'}
                      </Text>
                      <View
                        style={[
                          styles.bookingStatusTag,
                          item.status === 'upcoming' && { backgroundColor: '#fef3c7' },
                          item.status === 'completed' && { backgroundColor: '#dcfce7' },
                          item.status === 'cancelled' && { backgroundColor: '#ffe4e6' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.bookingStatusTagText,
                            item.status === 'upcoming' && { color: '#b45309' },
                            item.status === 'completed' && { color: '#15803d' },
                            item.status === 'cancelled' && { color: '#be123c' },
                          ]}
                        >
                          {(item.status || 'upcoming').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.bookingFareNum}>₹{item.fare}</Text>
                  </View>

                  {/* Route */}
                  <View style={styles.compactRouteRow}>
                    <Text style={styles.routeStation}>
                      {item.sourceCode || (item.source && item.source.substring(0, 4)) || 'SRC'}
                    </Text>
                    <View style={styles.routeLineWrapper}>
                      <Text style={styles.routeDistance}>{item.distance || '---'}</Text>
                      <View style={styles.routeBar} />
                    </View>
                    <Text style={styles.routeStation}>
                      {item.destCode || (item.dest && item.dest.substring(0, 4)) || 'DST'}
                    </Text>
                  </View>

                  <View style={styles.compactBookingFooter}>
                    <Text style={styles.bookingMetaText}>
                      📅 {item.date || item.journeyDate || '---'} • {item.passengers || '1 Adult'}
                    </Text>

                    {item.status === 'upcoming' && (
                      <TouchableOpacity
                        style={styles.cancelPill}
                        onPress={() => handleCancelTicket(item)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.cancelPillText}>Cancel Ticket</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ─── Custom Top-Up Modal ─────────────────────────────────── */}
      <Modal
        visible={!!selectedUserForTopUp}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUserForTopUp(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.compactModalBox}>
            <Text style={styles.modalHeading}>Recharge Wallet</Text>
            <Text style={styles.modalSubheading} numberOfLines={1}>
              {selectedUserForTopUp?.name || selectedUserForTopUp?.email}
            </Text>

            <View style={styles.modalInputWrap}>
              <Text style={{ fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#16a34a', marginRight: 6 }}>₹</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Amount"
                placeholderTextColor="#94a3b8"
                value={customTopUpAmount}
                onChangeText={setCustomTopUpAmount}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setSelectedUserForTopUp(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={() => {
                  const amt = parseFloat(customTopUpAmount) || 0;
                  if (amt > 0) {
                    handleTopUpAmount(selectedUserForTopUp, amt);
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>Credit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  compactHeader: {
    backgroundColor: '#090d16',
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 5,
  },
  headerBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  adminEmailText: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
  },
  headerSyncCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131c2e',
    borderRadius: 10,
    marginTop: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  ribbonCell: {
    flex: 1,
    alignItems: 'center',
  },
  ribbonLabel: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  ribbonValue: {
    fontSize: 14,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#f8fafc',
    marginTop: 1,
  },
  ribbonDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#1e293b',
  },
  tabsWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2.5,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#0066ff',
    shadowColor: '#0066ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#64748b',
    marginLeft: 4,
  },
  segmentTextActive: {
    color: '#ffffff',
    fontFamily: 'Montserrat_700Bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickCard: {
    width: '23.5%',
    backgroundColor: '#ffffff',
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickCardTitle: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  quickCardSub: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiCardLabel: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  kpiCardNum: {
    fontSize: 18,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0f172a',
    marginVertical: 2,
  },
  kpiTagsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  microTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3.5,
  },
  microTagText: {
    fontSize: 9,
    fontFamily: 'Montserrat_700Bold',
  },
  securityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  securityTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  securitySubtitle: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
  },
  deletedLogsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deletedLogsPillText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#b91c1c',
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
    maxHeight: 30,
  },
  chipBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  chipBtnActive: {
    backgroundColor: '#0066ff',
  },
  chipBtnText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
  },
  chipBtnTextActive: {
    color: '#ffffff',
    fontFamily: 'Montserrat_700Bold',
  },
  compactUserCard: {
    backgroundColor: '#ffffff',
    borderRadius: 9,
    padding: 9,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  compactUserCardBlocked: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
  },
  compactUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#4338ca',
  },
  userNameText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    maxWidth: 130,
  },
  roleMicroTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 5,
  },
  roleUserTag: {
    backgroundColor: '#f1f5f9',
  },
  roleAdminTag: {
    backgroundColor: '#fef3c7',
  },
  roleMicroTagText: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  roleUserText: {
    color: '#64748b',
  },
  roleAdminText: {
    color: '#b45309',
  },
  userSubText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
  },
  walletNum: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#16a34a',
  },
  walletMicroLabel: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#94a3b8',
  },
  userCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  userTicketsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  userTicketsPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  userTicketsPillEmpty: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  userTicketsPillText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
  },
  userTicketsPillTextActive: {
    color: '#0066ff',
  },
  userTicketsPillTextEmpty: {
    color: '#94a3b8',
  },
  actionPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4.5,
  },
  actionPillUnblock: {
    backgroundColor: '#dcfce7',
  },
  actionPillBlock: {
    backgroundColor: '#fee2e2',
  },
  actionPillText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
  },
  actionPillUnblockText: {
    color: '#15803d',
  },
  actionPillBlockText: {
    color: '#b91c1c',
  },
  topUpMicroChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4.5,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  topUpMicroText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  deleteUserBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4.5,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formHeader: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#334155',
    marginBottom: 3,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  autoGenText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 7,
    height: 38,
    paddingHorizontal: 9,
    marginBottom: 8,
  },
  formInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
  },
  balancePillRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 5,
  },
  balancePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  balancePillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0066ff',
  },
  balancePillText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
  },
  balancePillTextActive: {
    color: '#0066ff',
    fontFamily: 'Montserrat_700Bold',
  },
  roleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  roleChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0066ff',
  },
  roleChipText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#64748b',
    marginLeft: 5,
  },
  roleChipTextActive: {
    color: '#0066ff',
    fontFamily: 'Montserrat_700Bold',
  },
  submitBtn: {
    backgroundColor: '#0066ff',
    borderRadius: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 9,
    padding: 10,
    marginBottom: 10,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#15803d',
    marginLeft: 5,
  },
  credBox: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 7,
    marginBottom: 7,
  },
  credText: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#1e293b',
    marginBottom: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 7,
    borderRadius: 6,
  },
  shareBtnText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  compactBookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 9,
    padding: 9,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingUtsCode: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    marginRight: 6,
  },
  bookingStatusTag: {
    paddingHorizontal: 4.5,
    paddingVertical: 1.5,
    borderRadius: 3.5,
  },
  bookingStatusTagText: {
    fontSize: 8,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  bookingFareNum: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  compactRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  routeStation: {
    fontSize: 12,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#1e293b',
  },
  routeLineWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  routeDistance: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#94a3b8',
    marginBottom: 1,
  },
  routeBar: {
    width: '100%',
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  passengerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  passengerNameLink: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  compactBookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderColor: '#f8fafc',
  },
  bookingMetaText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  cancelPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  cancelPillText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#b91c1c',
  },
  deleteTicketPill: {
    padding: 3,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  centerText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  userTicketsModalBox: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
  },
  userTicketsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  userTicketsModalTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  userTicketsModalSub: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  clearLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearLogsBtnText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#b91c1c',
  },
  deleteSingleLogBtn: {
    padding: 4,
    marginLeft: 6,
  },
  userModalStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userModalStatCell: {
    flex: 1,
    alignItems: 'center',
  },
  userModalStatLabel: {
    fontSize: 8,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
  },
  userModalStatVal: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0f172a',
    marginTop: 1,
  },
  userModalTicketCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 9,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logsModalBox: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
  },
  logCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 9,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logNameText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  logEmailText: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
  },
  authStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  authStatusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  authStatusBadgeDone: {
    backgroundColor: '#dcfce7',
  },
  authStatusBadgeText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
  },
  authStatusBadgePendingText: {
    color: '#b45309',
  },
  authStatusBadgeDoneText: {
    color: '#15803d',
  },
  uidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  uidLabel: {
    fontSize: 7.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#94a3b8',
  },
  uidValueText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  uidCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  uidCopyBtnText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  logFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  logMetaDetail: {
    fontSize: 9,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  compactModalBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  modalHeading: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  modalSubheading: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
    marginBottom: 12,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 7,
    height: 42,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 7,
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
  },
  modalConfirm: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 7,
    backgroundColor: '#0066ff',
  },
  modalConfirmText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
});

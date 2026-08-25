import React, { useState, useEffect } from 'react';
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

  // Custom Top-Up Modal State
  const [selectedUserForTopUp, setSelectedUserForTopUp] = useState<any | null>(null);
  const [customTopUpAmount, setCustomTopUpAmount] = useState('500');

  // ─── 3. Global Bookings State ──────────────────────────────────
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoadingStats(true);
    setLoadingUsers(true);
    setLoadingBookings(true);
    try {
      const [statsData, usersData, bookingsData] = await Promise.all([
        FirebaseService.getAdminStatistics(),
        FirebaseService.getAllUsers(),
        FirebaseService.getAllBookings(),
      ]);
      setStats(statsData);
      setUsersList(usersData);
      setAllBookings(bookingsData);
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

  const generateRandomPassword = () => {
    triggerHaptic('light');
    const prefixes = ['Rail', 'Fast', 'Express', 'Track', 'Super', 'Ticket', 'Admin'];
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

      // Refresh list
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
    const actionLabel = newStatus === 'disabled' ? 'Deactivate / Block' : 'Activate';

    AppAlert.show(
      `${actionLabel} Account`,
      `Are you sure you want to change ${targetUser.name || targetUser.email}'s account status to ${newStatus.toUpperCase()}?`,
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
              AppAlert.show('Status Updated', `User account is now ${newStatus.toUpperCase()}.`, undefined, 'success');
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
        'Wallet Recharged! 💰',
        `₹${amount} has been added to ${targetUser.name || targetUser.email}. New Balance: ₹${newBal.toFixed(2)}`,
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
      `Are you sure you want to cancel UTS ticket ${booking.ticketId || booking.pnr}? This will mark it as cancelled.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Ticket',
          style: 'destructive',
          onPress: async () => {
            const bookingId = booking.id || booking.bookingId;
            try {
              await FirebaseService.updateTicketStatus(bookingId, 'cancelled');
              triggerHaptic('success');
              setAllBookings((prev) =>
                prev.map((b) => ((b.id || b.bookingId) === bookingId ? { ...b, status: 'cancelled' } : b))
              );
              AppAlert.show('Ticket Cancelled', 'Booking status set to CANCELLED.', undefined, 'success');
              const updatedStats = await FirebaseService.getAdminStatistics();
              setStats(updatedStats);
            } catch (err: any) {
              AppAlert.show('Cancellation Failed', err?.message || 'Could not cancel ticket.', undefined, 'error');
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
    const matchesQuery =
      b.pnr?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.ticketId?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.source?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.dest?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
      b.userId?.toLowerCase().includes(bookingSearchQuery.toLowerCase());

    if (!matchesQuery) return false;
    if (bookingStatusFilter === 'upcoming') return b.status === 'upcoming';
    if (bookingStatusFilter === 'completed') return b.status === 'completed';
    if (bookingStatusFilter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FocusAwareStatusBar backgroundColor="#0f172a" barStyle="light-content" />

      {/* ─── Executive Admin Header ───────────────────────────────── */}
      <View style={styles.headerHero}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              triggerHaptic('light');
              navigation.goBack();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <View style={styles.adminCrownBadge}>
              <MaterialCommunityIcons name="shield-crown" size={16} color="#facc15" />
              <Text style={styles.adminCrownText}>ADMIN CONSOLE</Text>
            </View>
            <Text style={styles.headerEmail} numberOfLines={1}>
              {currentAdmin?.email || 'admin@railone.com'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerRefreshBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Hero KPI Summary Bar */}
        <View style={styles.heroSummaryBar}>
          <View style={styles.heroSummaryItem}>
            <Text style={styles.heroSummaryLabel}>TOTAL REVENUE</Text>
            <Text style={styles.heroSummaryValue}>
              ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroSummaryItem}>
            <Text style={styles.heroSummaryLabel}>USERS</Text>
            <Text style={styles.heroSummaryValue}>{stats.totalUsers}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroSummaryItem}>
            <Text style={styles.heroSummaryLabel}>BOOKINGS</Text>
            <Text style={styles.heroSummaryValue}>{stats.totalBookings}</Text>
          </View>
        </View>
      </View>

      {/* ─── Navigation Tabs Bar (4 Tabs) ─────────────────────────── */}
      <View style={styles.navTabsBar}>
        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'dashboard' && styles.navTabBtnActive]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('dashboard');
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="speedometer-outline"
            size={18}
            color={activeTab === 'dashboard' ? '#0066ff' : '#64748b'}
          />
          <Text style={[styles.navTabText, activeTab === 'dashboard' && styles.navTabTextActive]}>
            Metrics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'users' && styles.navTabBtnActive]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('users');
          }}
          activeOpacity={0.8}
        >
          <Feather
            name="users"
            size={17}
            color={activeTab === 'users' ? '#0066ff' : '#64748b'}
          />
          <Text style={[styles.navTabText, activeTab === 'users' && styles.navTabTextActive]}>
            Users ({usersList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'create' && styles.navTabBtnActive]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('create');
          }}
          activeOpacity={0.8}
        >
          <Feather
            name="user-plus"
            size={17}
            color={activeTab === 'create' ? '#0066ff' : '#64748b'}
          />
          <Text style={[styles.navTabText, activeTab === 'create' && styles.navTabTextActive]}>
            + Provision
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'bookings' && styles.navTabBtnActive]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('bookings');
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={activeTab === 'bookings' ? '#0066ff' : '#64748b'}
          />
          <Text style={[styles.navTabText, activeTab === 'bookings' && styles.navTabTextActive]}>
            Bookings
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ─── TAB 1: METRICS & DASHBOARD ───────────────────────────── */}
        {activeTab === 'dashboard' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Quick Actions Grid */}
            <Text style={styles.sectionHeaderTitle}>QUICK MANAGEMENT ACTIONS</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTab('create');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="user-plus" size={22} color="#0066ff" />
                </View>
                <Text style={styles.actionCardTitle}>Create Account</Text>
                <Text style={styles.actionCardSubtitle}>Add user or admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTab('users');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="wallet-outline" size={22} color="#16a34a" />
                </View>
                <Text style={styles.actionCardTitle}>Wallet Top-Up</Text>
                <Text style={styles.actionCardSubtitle}>Credit user balances</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveTab('bookings');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#faf5ff' }]}>
                  <Ionicons name="ticket-outline" size={22} color="#9333ea" />
                </View>
                <Text style={styles.actionCardTitle}>Inspect Tickets</Text>
                <Text style={styles.actionCardSubtitle}>View live bookings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={onRefresh}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="sync-outline" size={22} color="#d97706" />
                </View>
                <Text style={styles.actionCardTitle}>Sync Masters</Text>
                <Text style={styles.actionCardSubtitle}>Refresh database</Text>
              </TouchableOpacity>
            </View>

            {/* Performance KPI Cards */}
            <Text style={styles.sectionHeaderTitle}>SYSTEM PERFORMANCE & STATUS</Text>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { backgroundColor: '#ffffff', borderColor: '#e2e8f0' }]}>
                <View style={styles.kpiBoxHeader}>
                  <Text style={styles.kpiBoxLabel}>REGISTERED PASSENGERS</Text>
                  <Feather name="user-check" size={16} color="#0066ff" />
                </View>
                <Text style={styles.kpiBoxValue}>{stats.totalUsers}</Text>
                <View style={styles.kpiPillsRow}>
                  <View style={[styles.miniStatusPill, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.miniStatusPillText, { color: '#15803d' }]}>
                      {stats.activeUsers} Active
                    </Text>
                  </View>
                  <View style={[styles.miniStatusPill, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.miniStatusPillText, { color: '#b91c1c' }]}>
                      {stats.disabledUsers} Blocked
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: '#ffffff', borderColor: '#e2e8f0' }]}>
                <View style={styles.kpiBoxHeader}>
                  <Text style={styles.kpiBoxLabel}>BOOKINGS OVERVIEW</Text>
                  <Ionicons name="train-outline" size={17} color="#16a34a" />
                </View>
                <Text style={styles.kpiBoxValue}>{stats.totalBookings}</Text>
                <View style={styles.kpiPillsRow}>
                  <View style={[styles.miniStatusPill, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.miniStatusPillText, { color: '#b45309' }]}>
                      {stats.upcomingBookings} Upcoming
                    </Text>
                  </View>
                  <View style={[styles.miniStatusPill, { backgroundColor: '#ffe4e6' }]}>
                    <Text style={[styles.miniStatusPillText, { color: '#be123c' }]}>
                      {stats.cancelledBookings} Cancelled
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Architecture Info Card */}
            <View style={styles.architectureCard}>
              <View style={styles.archCardHeader}>
                <MaterialCommunityIcons name="shield-lock" size={24} color="#0066ff" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.archTitle}>Production Security Active</Text>
                  <Text style={styles.archSubtitle}>Two-Role Authorization Model</Text>
                </View>
              </View>
              <Text style={styles.archBody}>
                • All database operations are restricted strictly to Authenticated <Text style={{ fontWeight: '700' }}>Admin</Text> and <Text style={{ fontWeight: '700' }}>User</Text> roles.{'\n'}
                • Role escalation is prevented server-side by declarative Firestore security rules.{'\n'}
                • Digital wallet recharges and debits are tracked with atomic ledger transactions.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ─── TAB 2: USER DIRECTORY & MANAGEMENT ──────────────────── */}
        {activeTab === 'users' && (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14 }}>
            {/* Search Input */}
            <View style={styles.searchBarBox}>
              <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search by name, email, or mobile..."
                placeholderTextColor="#94a3b8"
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
                autoCapitalize="none"
              />
              {userSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setUserSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
              {[
                { id: 'all', label: 'All Users' },
                { id: 'active', label: 'Active 🟢' },
                { id: 'disabled', label: 'Blocked 🔴' },
                { id: 'admin', label: 'Admins 👑' },
                { id: 'user', label: 'Passengers 👤' },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.filterChip,
                    userRoleFilter === chip.id && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    triggerHaptic('light');
                    setUserRoleFilter(chip.id as any);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      userRoleFilter === chip.id && styles.filterChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loadingUsers ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#0066ff" />
                <Text style={styles.loadingText}>Fetching registered user directory...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id || item.uid}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="users" size={44} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No matching accounts</Text>
                    <Text style={styles.emptySubtitle}>Try changing your search or filter.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isBlocked = item.status === 'disabled';
                  const isAdminRole = item.role === 'admin';
                  return (
                    <View style={[styles.userCardItem, isBlocked && styles.userCardItemBlocked]}>
                      <View style={styles.userCardTopRow}>
                        <View
                          style={[
                            styles.userAvatar,
                            isAdminRole && { backgroundColor: '#fef3c7' },
                            isBlocked && { backgroundColor: '#f1f5f9' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.userAvatarText,
                              isAdminRole && { color: '#b45309' },
                              isBlocked && { color: '#94a3b8' },
                            ]}
                          >
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>

                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.userDisplayName} numberOfLines={1}>
                              {item.name || item.displayName || 'Passenger'}
                            </Text>
                            <View
                              style={[
                                styles.roleTag,
                                isAdminRole ? styles.roleTagAdmin : styles.roleTagUser,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleTagText,
                                  isAdminRole ? styles.roleTagAdminText : styles.roleTagUserText,
                                ]}
                              >
                                {(item.role || 'USER').toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.userEmailText} numberOfLines={1}>
                            {item.email || 'No email'}
                          </Text>
                          {item.mobile ? (
                            <Text style={styles.userMobileText}>📱 {item.mobile}</Text>
                          ) : null}
                        </View>

                        <View style={styles.userWalletBox}>
                          <Text style={styles.userWalletLabel}>BALANCE</Text>
                          <Text style={styles.userWalletValue}>
                            ₹{(item.wallet || 0).toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {/* Management Action Buttons */}
                      <View style={styles.userCardActions}>
                        <TouchableOpacity
                          style={[
                            styles.statusBtn,
                            isBlocked ? styles.statusBtnActivate : styles.statusBtnBlock,
                          ]}
                          onPress={() => handleToggleUserStatus(item)}
                          disabled={statusUpdatingId === (item.id || item.uid)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.statusBtnText,
                              isBlocked ? styles.statusBtnActivateText : styles.statusBtnBlockText,
                            ]}
                          >
                            {isBlocked ? '🟢 Unblock / Activate' : '🔴 Deactivate'}
                          </Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            style={styles.quickTopUpChip}
                            onPress={() => handleTopUpAmount(item, 100)}
                            disabled={toppingUpId === (item.id || item.uid)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.quickTopUpChipText}>+₹100</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.quickTopUpChip}
                            onPress={() => handleTopUpAmount(item, 500)}
                            disabled={toppingUpId === (item.id || item.uid)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.quickTopUpChipText}>+₹500</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.quickTopUpChip, { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}
                            onPress={() => {
                              setSelectedUserForTopUp(item);
                            }}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.quickTopUpChipText, { color: '#475569' }]}>Custom</Text>
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

        {/* ─── TAB 3: PROVISION NEW USER ───────────────────────────── */}
        {activeTab === 'create' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {createdUser && (
              <View style={styles.successCardBox}>
                <View style={styles.successCardTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                    <Text style={styles.successCardTitle}>Account Provisioned Successfully!</Text>
                  </View>
                  <TouchableOpacity onPress={() => setCreatedUser(null)}>
                    <Ionicons name="close" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.successCredentialsBox}>
                  <Text style={styles.credRow}><Text style={styles.credRowLabel}>Name: </Text>{createdUser.name}</Text>
                  <Text style={styles.credRow}><Text style={styles.credRowLabel}>Email: </Text>{createdUser.email}</Text>
                  <Text style={styles.credRow}><Text style={styles.credRowLabel}>Password: </Text><Text style={styles.credRowPass}>{createdUser.password}</Text></Text>
                  <Text style={styles.credRow}><Text style={styles.credRowLabel}>Role: </Text><Text style={{ fontWeight: '700', color: createdUser.role === 'admin' ? '#b45309' : '#0066ff' }}>{createdUser.role.toUpperCase()}</Text></Text>
                  <Text style={styles.credRow}><Text style={styles.credRowLabel}>Initial Wallet: </Text>₹{createdUser.wallet.toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.shareCredentialsBtn}
                  onPress={() => handleShareCredentials(createdUser)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.shareCredentialsBtnText}>Share Credentials on WhatsApp / SMS</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.createAccountCard}>
              <Text style={styles.createCardTitle}>Provision New User / Staff</Text>
              <Text style={styles.createCardSubtitle}>
                Create an authorized account and configure digital wallet balance.
              </Text>

              <Text style={styles.fieldLabel}>Full Name *</Text>
              <View style={styles.fieldInputBox}>
                <Ionicons name="person-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.fieldLabel}>10-Digit Mobile Number *</Text>
              <View style={styles.fieldInputBox}>
                <Ionicons name="call-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94a3b8"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <Text style={styles.fieldLabel}>Email Address *</Text>
              <View style={styles.fieldInputBox}>
                <Ionicons name="mail-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. rahul@gmail.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Password *</Text>
                <TouchableOpacity onPress={generateRandomPassword} activeOpacity={0.7}>
                  <Text style={styles.autoGenLink}>🎲 Auto-Generate</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.fieldInputBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Initial Welcome Balance (₹)</Text>
              <View style={styles.walletAmountPills}>
                {['100', '250', '500', '1000'].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.walletAmountPill,
                      walletAmount === amt && styles.walletAmountPillActive,
                    ]}
                    onPress={() => {
                      triggerHaptic('light');
                      setWalletAmount(amt);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.walletAmountPillText,
                        walletAmount === amt && styles.walletAmountPillTextActive,
                      ]}
                    >
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Account Authorization Role</Text>
              <View style={styles.rolePickerRow}>
                <TouchableOpacity
                  style={[styles.rolePickerBtn, role === 'user' && styles.rolePickerBtnActive]}
                  onPress={() => {
                    triggerHaptic('light');
                    setRole('user');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person" size={16} color={role === 'user' ? '#0066ff' : '#64748b'} />
                  <Text style={[styles.rolePickerBtnText, role === 'user' && styles.rolePickerBtnTextActive]}>
                    Passenger (User)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rolePickerBtn, role === 'admin' && styles.rolePickerBtnActive]}
                  onPress={() => {
                    triggerHaptic('light');
                    setRole('admin');
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="shield-crown"
                    size={18}
                    color={role === 'admin' ? '#0066ff' : '#64748b'}
                  />
                  <Text style={[styles.rolePickerBtnText, role === 'admin' && styles.rolePickerBtnTextActive]}>
                    Administrator
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitCreateBtn, submitting && { opacity: 0.75 }]}
                onPress={handleCreateUser}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitCreateBtnText}>Create & Authorize Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ─── TAB 4: GLOBAL BOOKINGS INSPECTOR ────────────────────── */}
        {activeTab === 'bookings' && (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14 }}>
            <View style={styles.searchBarBox}>
              <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search by PNR, UTS Code, or Station..."
                placeholderTextColor="#94a3b8"
                value={bookingSearchQuery}
                onChangeText={setBookingSearchQuery}
                autoCapitalize="none"
              />
              {bookingSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setBookingSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Status Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
              {[
                { id: 'all', label: 'All Bookings' },
                { id: 'upcoming', label: 'Upcoming ⏳' },
                { id: 'completed', label: 'Completed ✅' },
                { id: 'cancelled', label: 'Cancelled ❌' },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.filterChip,
                    bookingStatusFilter === chip.id && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    triggerHaptic('light');
                    setBookingStatusFilter(chip.id as any);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      bookingStatusFilter === chip.id && styles.filterChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loadingBookings ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#0066ff" />
                <Text style={styles.loadingText}>Loading all system bookings...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredBookings}
                keyExtractor={(item) => item.id || item.bookingId || item.pnr}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="ticket-outline" size={44} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No matching bookings</Text>
                    <Text style={styles.emptySubtitle}>No tickets match your query.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.globalBookingCard}>
                    <View style={styles.globalBookingHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.globalUtsText}>
                          UTS: {item.ticketId || item.pnr || 'XMSQEB'}
                        </Text>
                        <View
                          style={[
                            styles.globalStatusTag,
                            item.status === 'upcoming' && { backgroundColor: '#fef3c7' },
                            item.status === 'completed' && { backgroundColor: '#dcfce7' },
                            item.status === 'cancelled' && { backgroundColor: '#ffe4e6' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.globalStatusTagText,
                              item.status === 'upcoming' && { color: '#b45309' },
                              item.status === 'completed' && { color: '#15803d' },
                              item.status === 'cancelled' && { color: '#be123c' },
                            ]}
                          >
                            {(item.status || 'upcoming').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.globalFareText}>₹{item.fare}</Text>
                    </View>

                    {/* Route */}
                    <View style={styles.globalRouteBar}>
                      <Text style={styles.globalStationCode}>
                        {item.sourceCode || (item.source && item.source.substring(0, 4)) || 'SRC'}
                      </Text>
                      <View style={styles.globalRouteDivider}>
                        <Text style={styles.globalDistanceText}>{item.distance || '---'}</Text>
                        <View style={styles.globalRouteLine} />
                      </View>
                      <Text style={styles.globalStationCode}>
                        {item.destCode || (item.dest && item.dest.substring(0, 4)) || 'DST'}
                      </Text>
                    </View>

                    <View style={styles.globalBookingFooter}>
                      <View>
                        <Text style={styles.globalBookingMeta}>
                          📅 {item.date || item.journeyDate || '---'} • {item.passengers || '1 Adult'}
                        </Text>
                        <Text style={styles.globalBookingUid} numberOfLines={1}>
                          UID: {item.userId ? `${item.userId.substring(0, 12)}...` : 'Guest'}
                        </Text>
                      </View>

                      {item.status === 'upcoming' && (
                        <TouchableOpacity
                          style={styles.cancelTicketBtn}
                          onPress={() => handleCancelTicket(item)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.cancelTicketBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ─── Custom Top-Up Modal ─────────────────────────────────── */}
      <Modal
        visible={!!selectedUserForTopUp}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUserForTopUp(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Recharge User Wallet</Text>
            <Text style={styles.modalSubtitle}>
              Adding funds to: {selectedUserForTopUp?.name || selectedUserForTopUp?.email}
            </Text>

            <Text style={styles.fieldLabel}>Enter Amount (₹)</Text>
            <View style={styles.fieldInputBox}>
              <Ionicons name="cash-outline" size={18} color="#16a34a" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. 500"
                placeholderTextColor="#94a3b8"
                value={customTopUpAmount}
                onChangeText={setCustomTopUpAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedUserForTopUp(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  const amt = parseFloat(customTopUpAmount) || 0;
                  if (amt > 0) {
                    handleTopUpAmount(selectedUserForTopUp, amt);
                  }
                }}
              >
                <Text style={styles.modalConfirmBtnText}>Credit Wallet</Text>
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
    backgroundColor: '#f8fafc',
  },
  headerHero: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  adminCrownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 3,
  },
  adminCrownText: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#facc15',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  headerEmail: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
  },
  headerRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  heroSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroSummaryLabel: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#94a3b8',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  heroSummaryValue: {
    fontSize: 16,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  heroDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  navTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  navTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginHorizontal: 3,
  },
  navTabBtnActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
  },
  navTabText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#64748b',
    marginLeft: 5,
  },
  navTabTextActive: {
    color: '#0066ff',
    fontFamily: 'Montserrat_700Bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionCardTitle: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  actionCardSubtitle: {
    fontSize: 11,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
    marginTop: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  kpiBox: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 3,
    borderWidth: 1,
  },
  kpiBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiBoxLabel: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  kpiBoxValue: {
    fontSize: 22,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0f172a',
    marginBottom: 6,
  },
  kpiPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  miniStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginTop: 2,
  },
  miniStatusPillText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
  },
  architectureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  archCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  archTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  archSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  archBody: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#475569',
    lineHeight: 18,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
  },
  filterChipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    maxHeight: 36,
  },
  filterChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0066ff',
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#0066ff',
    fontFamily: 'Montserrat_700Bold',
  },
  userCardItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userCardItemBlocked: {
    backgroundColor: '#f8fafc',
    opacity: 0.65,
  },
  userCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#4338ca',
  },
  userDisplayName: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    maxWidth: 130,
  },
  roleTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 6,
  },
  roleTagUser: {
    backgroundColor: '#f1f5f9',
  },
  roleTagAdmin: {
    backgroundColor: '#fef3c7',
  },
  roleTagText: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  roleTagUserText: {
    color: '#475569',
  },
  roleTagAdminText: {
    color: '#b45309',
  },
  userEmailText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
  },
  userMobileText: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#475569',
    marginTop: 1,
  },
  userWalletBox: {
    alignItems: 'flex-end',
  },
  userWalletLabel: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#94a3b8',
  },
  userWalletValue: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#16a34a',
  },
  userCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBtnActivate: {
    backgroundColor: '#dcfce7',
  },
  statusBtnBlock: {
    backgroundColor: '#fee2e2',
  },
  statusBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
  statusBtnActivateText: {
    color: '#15803d',
  },
  statusBtnBlockText: {
    color: '#b91c1c',
  },
  quickTopUpChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  quickTopUpChipText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  createAccountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  createCardTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  createCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#334155',
    marginBottom: 4,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  autoGenLink: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  fieldInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    height: 44,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  fieldInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
  },
  walletAmountPills: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  walletAmountPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  walletAmountPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0066ff',
  },
  walletAmountPillText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
  },
  walletAmountPillTextActive: {
    color: '#0066ff',
    fontFamily: 'Montserrat_700Bold',
  },
  rolePickerRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  rolePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 6,
  },
  rolePickerBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#0066ff',
  },
  rolePickerBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#64748b',
    marginLeft: 6,
  },
  rolePickerBtnTextActive: {
    color: '#0066ff',
    fontFamily: 'Montserrat_700Bold',
  },
  submitCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066ff',
    borderRadius: 10,
    height: 48,
  },
  submitCreateBtnText: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  successCardBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.2,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  successCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  successCardTitle: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#15803d',
    marginLeft: 6,
  },
  successCredentialsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  credRow: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#1e293b',
    marginBottom: 3,
  },
  credRowLabel: {
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
  },
  credRowPass: {
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  shareCredentialsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareCredentialsBtnText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  globalBookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  globalBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  globalUtsText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    marginRight: 8,
  },
  globalStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  globalStatusTagText: {
    fontSize: 9,
    fontFamily: 'Montserrat_800ExtraBold',
  },
  globalFareText: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  globalRouteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  globalStationCode: {
    fontSize: 14,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#1e293b',
  },
  globalRouteDivider: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  globalDistanceText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#94a3b8',
    marginBottom: 2,
  },
  globalRouteLine: {
    width: '100%',
    height: 1.5,
    backgroundColor: '#cbd5e1',
  },
  globalBookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#f8fafc',
  },
  globalBookingMeta: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  globalBookingUid: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
  },
  cancelTicketBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelTicketBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#b91c1c',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#94a3b8',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
    marginBottom: 16,
    marginTop: 2,
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
  },
  modalConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: '#0066ff',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
});

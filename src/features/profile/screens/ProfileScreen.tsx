import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
  Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card } from '../../../components/common';
import { colors } from '../../../theme/colors';
import { spacing, elevation } from '../../../theme/spacing';
import { useAuth } from '../../../context/AuthContext';

export const ProfileScreen = () => {
  const { user, logout, updateUserProfile, addWalletBalance, getWalletTransactions } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('100');
  const [recharging, setRecharging] = useState(false);
  const [txns, setTxns] = useState<any[]>([]);

  // Edit Profile State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadTransactions();
    if (user) {
      setEditName(user.name || '');
      setEditMobile(user.mobile || '');
    }
  }, [user?.wallet, user?.mobile, user?.name]);

  const loadTransactions = async () => {
    const list = await getWalletTransactions();
    setTxns(list);
  };

  const handleSaveProfile = async () => {
    if (!editMobile.trim() || editMobile.trim().length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUserProfile(editName.trim() || 'User', editMobile.trim());
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch {
      Alert.alert('Error', 'Could not update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddMoney = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to recharge.');
      return;
    }
    setRecharging(true);
    try {
      await addWalletBalance(val, 'Recharge via UPI / Netbanking');
      setModalVisible(false);
      setAmount('100');
      Alert.alert('Success', `₹${val.toFixed(2)} added to your R-Wallet!`);
    } catch {
      Alert.alert('Error', 'Could not recharge wallet. Please try again.');
    } finally {
      setRecharging(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from RailOne?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="My Profile" variant="blue" />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.title}>{user?.name || 'User'}</Text>
            <Text style={[styles.subtitle, !user?.mobile && { color: '#ef4444' }]}>
              {user?.mobile ? `+91 ${user.mobile}` : 'Tap Edit to add Mobile Number'}
            </Text>
            <Text style={styles.email}>{user?.email || ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => setEditModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={16} color="#0066ff" />
          </TouchableOpacity>
        </Card>

        {/* R-Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletLeft}>
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet-outline" size={24} color="#6366f1" />
            </View>
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.walletTitle}>R-Wallet Balance</Text>
              <Text style={styles.walletAmt}>₹ {user?.wallet?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addMoneyBtn} activeOpacity={0.85} onPress={() => setModalVisible(true)}>
            <Text style={styles.addMoneyText}>+ Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Wallet Transactions */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Ionicons name="receipt-outline" size={18} color="#64748b" />
          </View>
          {txns.length === 0 ? (
            <Text style={styles.emptyTxnText}>No transactions yet.</Text>
          ) : (
            txns.slice(0, 4).map((t, idx) => (
              <View key={t.id || idx}>
                <View style={styles.txnRow}>
                  <View style={[styles.txnIcon, { backgroundColor: t.type === 'credit' ? '#dcfce7' : '#fee2e2' }]}>
                    <Ionicons
                      name={t.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={t.type === 'credit' ? '#16a34a' : '#dc2626'}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.txnDesc}>{t.description || (t.type === 'credit' ? 'Wallet Top-up' : 'Ticket Booking')}</Text>
                    <Text style={styles.txnSub}>{t.status === 'success' ? 'Successful' : 'Pending'}</Text>
                  </View>
                  <Text style={[styles.txnAmount, { color: t.type === 'credit' ? '#16a34a' : '#1e293b' }]}>
                    {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount || 0).toFixed(2)}
                  </Text>
                </View>
                {idx < Math.min(txns.length - 1, 3) && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        {/* Account Details */}
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.brandBlue} style={{ marginRight: 14 }} />
            <Text style={styles.settingLabel}>Verified Profile</Text>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" style={{ marginLeft: 'auto' }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Ionicons name="card-outline" size={22} color={colors.brandBlue} style={{ marginRight: 14 }} />
            <Text style={styles.settingLabel}>Payment Methods</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" style={{ marginLeft: 'auto' }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={22} color={colors.brandBlue} style={{ marginRight: 14 }} />
            <Text style={styles.settingLabel}>Notification Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" style={{ marginLeft: 'auto' }} />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Money Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.rechargeBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Recharge R-Wallet</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Enter amount to add to your Indian Railways wallet:</Text>

            <View style={styles.amountInputRow}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="100"
              />
            </View>

            <View style={styles.quickPillsRow}>
              {['100', '250', '500', '1000'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.quickPill, amount === p && styles.quickPillActive]}
                  onPress={() => setAmount(p)}
                >
                  <Text style={[styles.quickPillText, amount === p && styles.quickPillTextActive]}>+₹{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.confirmRechargeBtn, recharging && { opacity: 0.7 }]}
              onPress={handleAddMoney}
              disabled={recharging}
            >
              {recharging ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmRechargeText}>Proceed to Pay ₹{amount || '0'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.rechargeBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Name"
            />

            <Text style={styles.fieldLabel}>Mobile Number (for SMS & Ticket Booking)</Text>
            <View style={styles.mobileInputRow}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.mobileInput}
                keyboardType="phone-pad"
                value={editMobile}
                onChangeText={setEditMobile}
                placeholder="10-digit mobile"
                maxLength={10}
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmRechargeBtn, savingProfile && { opacity: 0.7 }]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmRechargeText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  editProfileBtn: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  fieldInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1e293b' },
  mobileInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, marginBottom: 18 },
  countryCode: { fontSize: 15, fontWeight: '700', color: '#64748b', marginRight: 8 },
  mobileInput: { flex: 1, fontSize: 15, color: '#1e293b', paddingVertical: 10 },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0066ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.textHeading },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 3 },
  email: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ede9fe',
    borderRadius: 16,
    padding: 16,
    marginTop: spacing.md,
  },
  walletLeft: { flexDirection: 'row', alignItems: 'center' },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#c4b5fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletTitle: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  walletAmt: { color: '#1e293b', fontSize: 22, fontWeight: '800', marginTop: 2 },
  addMoneyBtn: { backgroundColor: '#0066ff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  addMoneyText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: spacing.md,
    ...elevation.sm,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  emptyTxnText: { color: '#94a3b8', fontSize: 13, paddingVertical: 8 },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  txnIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  txnDesc: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  txnSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  txnAmount: { fontSize: 15, fontWeight: '700' },

  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  settingLabel: { fontSize: 15, color: '#1e293b', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: spacing.xl,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  rechargeBox: { backgroundColor: '#fff', width: '100%', borderRadius: 20, padding: 20, ...elevation.md },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  modalSub: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#0066ff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 14 },
  rupeePrefix: { fontSize: 24, fontWeight: '700', color: '#0066ff', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1e293b' },
  quickPillsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  quickPill: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginHorizontal: 3 },
  quickPillActive: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#0066ff' },
  quickPillText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  quickPillTextActive: { color: '#0066ff' },
  confirmRechargeBtn: { backgroundColor: '#0066ff', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmRechargeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});


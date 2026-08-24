import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
  Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StorageService, SavedPassenger } from '@/services/storage/storage.service';
import { FocusAwareStatusBar } from '@/components/common';

export const ProfileScreen = () => {
  const { width } = useWindowDimensions();
  const gridBoxWidth = (width - 40) / 3;
  const { user, logout, updateUserProfile, addWalletBalance } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('100');
  const [recharging, setRecharging] = useState(false);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Passengers State
  const [passengers, setPassengers] = useState<SavedPassenger[]>([]);
  const [addPassengerVisible, setAddPassengerVisible] = useState(false);
  const [pName, setPName] = useState('');
  const [pAge, setPAge] = useState('');
  const [pGender, setPGender] = useState<'M' | 'F' | 'T'>('M');
  const [pBerth, setPBerth] = useState('WS');
  const [pFood, setPFood] = useState('Veg');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditMobile(user.mobile || '');
    }
    loadPassengers();
  }, [user?.mobile, user?.name]);

  const loadPassengers = async () => {
    const list = await StorageService.getSavedPassengers();
    setPassengers(list);
  };

  const handleAddPassenger = async () => {
    if (!pName.trim()) {
      Alert.alert('Required', 'Please enter passenger name.');
      return;
    }
    const ageNum = parseInt(pAge) || 25;
    const newP: SavedPassenger = {
      id: Date.now().toString(),
      name: pName.trim(),
      age: ageNum,
      gender: pGender,
      berthPreference: pBerth,
      foodPreference: pFood,
      verified: true,
    };
    const updated = await StorageService.savePassenger(newP);
    setPassengers(updated);
    setAddPassengerVisible(false);
    setPName('');
    setPAge('');
  };

  const handleDeletePassenger = async (id: string) => {
    Alert.alert('Remove Passenger', 'Are you sure you want to remove this passenger?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = await StorageService.deletePassenger(id);
          setPassengers(updated);
        },
      },
    ]);
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
    <View style={styles.container}>
      <FocusAwareStatusBar backgroundColor="#e4f7fc" barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerBg}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#0066ff" />
          </TouchableOpacity>
          
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#a4d3f5" />
          </View>
          
          <Text style={styles.nameText}>{user?.name || 'Passenger'}</Text>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="information-circle-outline" size={16} color="#0066ff" />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>
            <Text style={styles.divider}>|</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setEditModalVisible(true)}>
              <Ionicons name="pencil" size={14} color="#0066ff" />
              <Text style={styles.actionText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletLeft}>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet-outline" size={20} color="#fff" />
            </View>
            <View style={styles.walletTexts}>
              <Text style={styles.walletLabel}>R-Wallet</Text>
              <Text style={styles.walletAmt}>₹ {user?.wallet?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
          <View style={styles.walletRight}>
            <TouchableOpacity style={styles.mr8}>
              <Ionicons name="refresh" size={22} color="#0066ff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtnBlue} onPress={() => setModalVisible(true)}>
              <Text style={styles.addBtnBlueText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.passContainer}>
          <View style={styles.passHeader}>
            <View style={styles.passHeaderLeft}>
              <Ionicons name="people" size={28} color="#f59e0b" />
              <View style={styles.ml8}>
                <Text style={styles.passHeaderTitle}>Saved Passengers</Text>
                <Text style={styles.passHeaderSub}>Add/Edit Passenger info</Text>
              </View>
            </View>
            <View style={styles.passHeaderRight}>
              <TouchableOpacity style={styles.mr10} onPress={loadPassengers}>
                <Ionicons name="refresh" size={22} color="#f59e0b" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtnOrange} onPress={() => setAddPassengerVisible(true)}>
                <Text style={styles.addBtnOrangeText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.passList}>
            {passengers.length === 0 ? (
              <View style={styles.emptyPass}>
                <Text style={styles.emptyPassText}>No saved passengers. Tap Add to create one.</Text>
              </View>
            ) : (
              passengers.map((p, idx) => (
                <View key={p.id || idx} style={[styles.passItem, idx === passengers.length - 1 && styles.noBorderBottom]}>
                  <View style={styles.pInfo}>
                    <View style={styles.pAvatar}>
                      <Ionicons name="person" size={16} color="#f97316" />
                    </View>
                    <View style={styles.pDetails}>
                      <View style={styles.pNameRow}>
                        <Text style={styles.pName}>{p.name}</Text>
                        <Ionicons name="checkmark-circle-outline" size={14} color="#94a3b8" />
                      </View>
                      <View style={styles.pSubRow}>
                        <Text style={styles.pSub}>{p.age} Y, {p.gender}, {p.berthPreference || 'WS'} | {p.foodPreference || 'No Food'}</Text>
                        {p.verified && <Ionicons name="checkmark-circle" size={14} color="#22c55e" style={styles.ml3} />}
                      </View>
                    </View>
                  </View>
                  <View style={styles.pActions}>
                    <TouchableOpacity onPress={() => handleDeletePassenger(p.id)}>
                      <Ionicons name="trash-outline" size={18} color="#fbb756" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={[styles.gridBox, { width: gridBoxWidth }]}>
            <View style={[styles.gridIcon, styles.gridCyan]}>
              <Ionicons name="lock-closed" size={22} color="#06b6d4" />
            </View>
            <Text style={styles.gridText}>Change{"\n"}Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridBox, { width: gridBoxWidth }]}>
            <View style={[styles.gridIcon, styles.gridGreen]}>
              <Ionicons name="person-circle" size={24} color="#22c55e" />
            </View>
            <Text style={styles.gridText}>My{"\n"}Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridBox, { width: gridBoxWidth }]}>
            <View style={[styles.gridIcon, styles.gridPurple]}>
              <Ionicons name="finger-print" size={22} color="#a855f7" />
            </View>
            <Text style={styles.gridText}>Biometric</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridBox, { width: gridBoxWidth }]}>
            <View style={[styles.gridIcon, styles.gridCyan]}>
              <Ionicons name="ticket" size={22} color="#06b6d4" />
            </View>
            <Text style={styles.gridText}>Transfer{"\n"}Ticket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridBox, { width: gridBoxWidth }]}>
            <View style={[styles.gridIcon, styles.gridOrange]}>
              <Ionicons name="list" size={22} color="#f97316" />
            </View>
            <Text style={styles.gridText}>My{"\n"}Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridBox, { width: gridBoxWidth }]}>
            <View style={[styles.gridIcon, styles.gridYellow]}>
              <Ionicons name="card" size={22} color="#eab308" />
            </View>
            <Text style={styles.gridText}>DeLink{"\n"}Aadhar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={addPassengerVisible} transparent animationType="slide" onRequestClose={() => setAddPassengerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.rechargeBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Add Passenger</Text>
              <TouchableOpacity onPress={() => setAddPassengerVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Passenger Full Name</Text>
            <TextInput style={styles.fieldInput} value={pName} onChangeText={setPName} placeholder="Enter Full Name" />
            <View style={styles.formRowGap10}>
              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>Age</Text>
                <TextInput style={styles.fieldInput} keyboardType="numeric" value={pAge} onChangeText={setPAge} placeholder="Age" maxLength={3} />
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.genderRow}>
                  {(['M', 'F', 'T'] as const).map(g => (
                    <TouchableOpacity key={g} style={[styles.genderBtn, pGender === g && styles.genderBtnActive]} onPress={() => setPGender(g)}>
                      <Text style={[styles.genderText, pGender === g && styles.genderTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.confirmRechargeBtn} onPress={handleAddPassenger}>
              <Text style={styles.confirmRechargeText}>Save Passenger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              <TextInput style={styles.amountInput} keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="100" />
            </View>
            <View style={styles.quickPillsRow}>
              {['100', '250', '500', '1000'].map((p) => (
                <TouchableOpacity key={`quick-pill-${p}`} style={[styles.quickPill, amount === p && styles.quickPillActive]} onPress={() => setAmount(p)}>
                  <Text style={[styles.quickPillText, amount === p && styles.quickPillTextActive]}>+₹{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.confirmRechargeBtn, recharging && { opacity: 0.7 }]} onPress={handleAddMoney} disabled={recharging}>
              {recharging ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmRechargeText}>Proceed to Pay ₹{amount || '0'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <TextInput style={styles.fieldInput} value={editName} onChangeText={setEditName} placeholder="Your Name" />
            <Text style={styles.fieldLabel}>Mobile Number (for SMS & Ticket Booking)</Text>
            <View style={styles.mobileInputRow}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput style={styles.mobileInput} keyboardType="phone-pad" value={editMobile} onChangeText={setEditMobile} placeholder="10-digit mobile" maxLength={10} />
            </View>
            <TouchableOpacity style={[styles.confirmRechargeBtn, savingProfile && { opacity: 0.7 }]} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmRechargeText}>Save Profile</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  headerBg: {
    backgroundColor: '#e4f7fc',
    paddingHorizontal: 10,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative'
  },
  backBtn: {
    position: 'absolute',
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4ea8e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066ff',
    marginLeft: 3,
  },
  divider: {
    color: '#94a3b8',
    marginHorizontal: 8,
    fontSize: 12,
  },

  walletCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    padding: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -30, 
    zIndex: 2,
  },
  walletLeft: { flexDirection: 'row', alignItems: 'center' },
  walletIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  walletTexts: { justifyContent: 'center' },
  walletLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  walletAmt: { fontSize: 14, color: '#0f172a', fontWeight: '700' },
  walletRight: { flexDirection: 'row', alignItems: 'center' },
  addBtnBlue: { backgroundColor: '#0066ff', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 16 },
  addBtnBlueText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    padding: 12,
  },
  cardTitle: { fontSize: 12.5, fontWeight: '600', color: '#334155', marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressBg: { flex: 1, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden', marginRight: 10 },
  progressFill: { width: '100%', height: '100%', backgroundColor: '#22c55e' },
  progressText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },

  passContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    overflow: 'hidden',
  },
  passHeader: { backgroundColor: '#fff6eb', padding: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  passHeaderTitle: { fontSize: 12.5, fontWeight: '700', color: '#0f172a' },
  passHeaderSub: { fontSize: 10.5, fontWeight: '500', color: '#64748b' },
  passHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  addBtnOrange: { backgroundColor: '#fbb756', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  addBtnOrangeText: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  passList: { paddingHorizontal: 12 },
  emptyPass: { paddingVertical: 18, alignItems: 'center' },
  emptyPassText: { color: '#94a3b8', fontSize: 12 },
  passItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pInfo: { flexDirection: 'row', alignItems: 'center' },
  pAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#ffedd5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  pDetails: { justifyContent: 'center' },
  pNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  pName: { fontSize: 13, fontWeight: '700', color: '#334155', marginRight: 4 },
  pSub: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  pActions: { flexDirection: 'row', alignItems: 'center' },

  genderBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: '#f8fafc' },
  genderBtnActive: { borderColor: '#0066ff', backgroundColor: '#dbeafe' },
  genderText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  genderTextActive: { color: '#0066ff' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 8,
    marginBottom: 14,
  },
  gridBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
    elevation: 1,
  },
  gridIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  gridCyan: { backgroundColor: '#cffafe' },
  gridGreen: { backgroundColor: '#dcfce7' },
  gridPurple: { backgroundColor: '#f3e8ff' },
  gridOrange: { backgroundColor: '#ffedd5' },
  gridYellow: { backgroundColor: '#fef08a' },
  gridText: { fontSize: 10.5, fontWeight: '600', color: '#1e293b', textAlign: 'center', lineHeight: 13 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 14,
    paddingVertical: 12,
    marginHorizontal: 12,
    elevation: 1,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700', marginLeft: 6 },

  // Modals
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  rechargeBox: { backgroundColor: '#fff', width: '100%', maxWidth: 420, borderRadius: 20, padding: 20, elevation: 5 },
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
  confirmRechargeBtn: { backgroundColor: '#0066ff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  confirmRechargeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  fieldInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1e293b' },
  mobileInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, marginBottom: 18 },
  countryCode: { fontSize: 15, fontWeight: '700', color: '#64748b', marginRight: 8 },
  mobileInput: { flex: 1, fontSize: 15, color: '#1e293b', paddingVertical: 10 },
  scrollContent: { paddingBottom: 40 },
  mr8: { marginRight: 8 },
  ml8: { marginLeft: 8 },
  mr10: { marginRight: 10 },
  pSubRow: { flexDirection: 'row', alignItems: 'center' },
  ml3: { marginLeft: 3 },
  formRowGap10: { flexDirection: 'row', gap: 10 },
  flexOne: { flex: 1 },
  genderRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  noBorderBottom: { borderBottomWidth: 0 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  linkLeft: { flexDirection: 'row', alignItems: 'center' },
  linkText: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginLeft: 10 },
});

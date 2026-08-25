import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StorageService, SavedPassenger } from '@/services/storage/storage.service';
import { FocusAwareStatusBar } from '@/components/common';

// Food Preference Badge (Indian Railways Veg / Non-Veg / No-Food icon)
const FoodTypeBadge = ({ type = 'Veg' }: { type?: string }) => {
  const isVeg = type.toLowerCase().includes('veg') && !type.toLowerCase().includes('non');
  const color = isVeg ? '#16a34a' : '#64748b';

  return (
    <View style={[styles.foodBadgeContainer, { borderColor: color }]}>
      <View style={[styles.foodBadgeDot, { backgroundColor: color }]} />
    </View>
  );
};

// Custom Wallet SVG Icon
const RWalletIcon = () => (
  <Svg width={36} height={26} viewBox="0 0 36 26" fill="none">
    <Rect width="36" height="26" rx="6" fill="#22c55e" />
    <Circle cx="27" cy="13" r="3.5" fill="#ffffff" />
    <Path d="M0 6C0 2.68629 2.68629 0 6 0H30C33.3137 0 36 2.68629 36 6V7H0V6Z" fill="#16a34a" fillOpacity="0.3" />
  </Svg>
);

// Custom Biometric Toggle Icon
const BiometricToggle = ({ enabled = true }: { enabled?: boolean }) => (
  <View style={[styles.bioToggleContainer, enabled ? styles.bioToggleOn : styles.bioToggleOff]}>
    {enabled && <Text style={styles.bioToggleText}>On</Text>}
    <View style={styles.bioToggleKnob} />
  </View>
);

export const ProfileScreen = () => {
  const { width } = useWindowDimensions();
  const gridBoxWidth = (width - 44) / 3;
  const { user, updateUserProfile, addWalletBalance } = useAuth();
  const navigation = useNavigation<any>();

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('100');
  const [recharging, setRecharging] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // View Details Modal
  const [viewDetailsVisible, setViewDetailsVisible] = useState(false);

  // Passengers State
  const [passengers, setPassengers] = useState<SavedPassenger[]>([]);
  const [addPassengerVisible, setAddPassengerVisible] = useState(false);
  const [editingPassengerId, setEditingPassengerId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pAge, setPAge] = useState('');
  const [pGender, setPGender] = useState<'M' | 'F' | 'T'>('M');
  const [pBerth, setPBerth] = useState('WS');
  const [pFood, setPFood] = useState('Veg');

  // Biometric state
  const [biometricEnabled, setBiometricEnabled] = useState(true);

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

  const handleOpenAddPassenger = () => {
    setEditingPassengerId(null);
    setPName('');
    setPAge('');
    setPGender('M');
    setPBerth('WS');
    setPFood('Veg');
    setAddPassengerVisible(true);
  };

  const handleOpenEditPassenger = (p: SavedPassenger) => {
    setEditingPassengerId(p.id);
    setPName(p.name);
    setPAge(p.age.toString());
    setPGender(p.gender);
    setPBerth(p.berthPreference || 'WS');
    setPFood(p.foodPreference || 'Veg');
    setAddPassengerVisible(true);
  };

  const handleSavePassenger = async () => {
    if (!pName.trim()) {
      Alert.alert('Required', 'Please enter passenger name.');
      return;
    }
    const ageNum = parseInt(pAge) || 25;
    const passengerData: SavedPassenger = {
      id: editingPassengerId || Date.now().toString(),
      name: pName.trim(),
      age: ageNum,
      gender: pGender,
      berthPreference: pBerth,
      foodPreference: pFood,
      verified: true,
    };
    const updated = await StorageService.savePassenger(passengerData);
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

  const userName = user?.name || 'Shahrukh';
  const walletAmount = user?.wallet !== undefined ? user.wallet.toFixed(2) : '0.00';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FocusAwareStatusBar backgroundColor="#e4f7fc" barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── 1. Curved Sky-Blue Header ───────────────────────────── */}
        <View style={styles.headerBanner}>
          {/* Back Circle Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0066ff" />
          </TouchableOpacity>

          {/* User Avatar Circle */}
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={38} color="#b4e2fb" />
          </View>

          {/* User Name */}
          <Text style={styles.userNameText}>{userName}</Text>

          {/* View Details | Edit Details Row */}
          <View style={styles.detailsActionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setViewDetailsVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="eye-outline" size={16} color="#0066ff" />
              <Text style={styles.actionBtnText}>View Details</Text>
            </TouchableOpacity>

            <Text style={styles.actionDivider}>|</Text>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setEditModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={14} color="#0066ff" />
              <Text style={styles.actionBtnText}>Edit Details</Text>
            </TouchableOpacity>
          </View>

          {/* Floating R-Wallet Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletLeft}>
              <RWalletIcon />
              <View style={styles.walletTextCol}>
                <Text style={styles.walletLabel}>R-Wallet</Text>
                <Text style={styles.walletAmount}>₹ {walletAmount}</Text>
              </View>
            </View>

            <View style={styles.walletRight}>
              <TouchableOpacity
                style={styles.walletRefreshBtn}
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={22} color="#0066ff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.walletAddBtn}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.walletAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ─── 2. Profile Complete Progress Card ───────────────────── */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Profile Complete</Text>
          <View style={styles.progressBarRow}>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
            <Text style={styles.progressPercentText}>100%</Text>
          </View>
        </View>

        {/* ─── 3. Saved Passengers Card ────────────────────────────── */}
        <View style={styles.passengersCard}>
          {/* Beige/Peach Header */}
          <View style={styles.passHeader}>
            <View style={styles.passHeaderLeft}>
              <Ionicons name="people" size={26} color="#f59e0b" />
              <View style={styles.passHeaderTextCol}>
                <Text style={styles.passHeaderTitle}>Saved Passengers</Text>
                <Text style={styles.passHeaderSub}>Add/Edit Passenger info</Text>
              </View>
            </View>

            <View style={styles.passHeaderRight}>
              <TouchableOpacity
                style={styles.passRefreshBtn}
                onPress={loadPassengers}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color="#f59e0b" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.passAddBtn}
                onPress={handleOpenAddPassenger}
                activeOpacity={0.85}
              >
                <Text style={styles.passAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Passenger Items */}
          <View style={styles.passengersList}>
            {passengers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No saved passengers. Tap Add to create one.</Text>
              </View>
            ) : (
              passengers.map((p, idx) => (
                <View
                  key={p.id || idx}
                  style={[
                    styles.passengerRow,
                    idx === passengers.length - 1 && styles.noBorderBottom,
                  ]}
                >
                  <View style={styles.pLeftCol}>
                    <View style={styles.pAvatarBadge}>
                      <Ionicons name="person" size={17} color="#f59e0b" />
                    </View>

                    <View style={styles.pInfoCol}>
                      {/* Name + Food Icon */}
                      <View style={styles.pNameRow}>
                        <Text style={styles.pNameText}>{p.name}</Text>
                        <FoodTypeBadge type={p.foodPreference || 'Veg'} />
                      </View>

                      {/* Subtitle Details + Verified Check */}
                      <View style={styles.pSubRow}>
                        <Text style={styles.pSubText}>
                          {p.age} Y, {p.gender}, {p.berthPreference || 'WS'} | {p.foodPreference || 'No Food'}
                        </Text>
                        {p.verified && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#16a34a"
                            style={styles.verifiedCheck}
                          />
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Actions: Edit & Trash */}
                  <View style={styles.pActionsRow}>
                    <TouchableOpacity
                      style={styles.pActionBtn}
                      onPress={() => handleOpenEditPassenger(p)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil-outline" size={18} color="#f5a623" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.pActionBtn}
                      onPress={() => handleDeletePassenger(p.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#f5a623" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* ─── 4. 6-Feature Grid Cards ─────────────────────────────── */}
        <View style={styles.gridContainer}>
          {/* 1. Change Password */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardCyan, { width: gridBoxWidth }]}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconWrap}>
              <Ionicons name="keypad-outline" size={26} color="#06b6d4" />
            </View>
            <Text style={styles.gridCardTitle}>Change{"\n"}Password</Text>
          </TouchableOpacity>

          {/* 2. My Account */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardGreen, { width: gridBoxWidth }]}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconWrap}>
              <Ionicons name="card-outline" size={26} color="#22c55e" />
            </View>
            <Text style={styles.gridCardTitle}>My{"\n"}Account</Text>
          </TouchableOpacity>

          {/* 3. Biometric Toggle */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardPink, { width: gridBoxWidth }]}
            onPress={() => setBiometricEnabled(!biometricEnabled)}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconWrap}>
              <BiometricToggle enabled={biometricEnabled} />
            </View>
            <Text style={styles.gridCardTitle}>Biometric</Text>
          </TouchableOpacity>

          {/* 4. Transfer Ticket */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardBlue, { width: gridBoxWidth }]}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconWrap}>
              <Ionicons name="ticket-outline" size={26} color="#0284c7" />
            </View>
            <Text style={styles.gridCardTitle}>Transfer{"\n"}Ticket</Text>
          </TouchableOpacity>

          {/* 5. My Transaction */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardPeach, { width: gridBoxWidth }]}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconWrap}>
              <Ionicons name="receipt-outline" size={26} color="#f59e0b" />
            </View>
            <Text style={styles.gridCardTitle}>My{"\n"}Transactions</Text>
          </TouchableOpacity>

          {/* 6. DeLink Aadhar */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardGrey, { width: gridBoxWidth }]}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconWrap}>
              <Ionicons name="card-outline" size={26} color="#65a30d" />
            </View>
            <Text style={styles.gridCardTitle}>DeLink{"\n"}Aadhar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── MODAL: Add / Edit Passenger ───────────────────────────── */}
      <Modal
        visible={addPassengerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddPassengerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>
                {editingPassengerId ? 'Edit Passenger' : 'Add Passenger'}
              </Text>
              <TouchableOpacity onPress={() => setAddPassengerVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Passenger Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={pName}
              onChangeText={setPName}
              placeholder="e.g. Akbar Khan"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.formRowGap10}>
              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>Age</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType="numeric"
                  value={pAge}
                  onChangeText={setPAge}
                  placeholder="Age"
                  maxLength={3}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <View style={styles.genderRow}>
                  {(['M', 'F', 'T'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, pGender === g && styles.genderBtnActive]}
                      onPress={() => setPGender(g)}
                    >
                      <Text style={[styles.genderText, pGender === g && styles.genderTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Food Preference Selection */}
            <Text style={styles.fieldLabel}>Food Preference</Text>
            <View style={styles.foodPrefRow}>
              {['Veg', 'No Food', 'Diabetic Veg'].map((food) => (
                <TouchableOpacity
                  key={food}
                  style={[styles.foodPrefBtn, pFood === food && styles.foodPrefBtnActive]}
                  onPress={() => setPFood(food)}
                >
                  <Text style={[styles.foodPrefText, pFood === food && styles.foodPrefTextActive]}>
                    {food}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSavePassenger}>
              <Text style={styles.confirmBtnText}>Save Passenger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: Recharge R-Wallet ─────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentBox}>
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
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.quickPillsRow}>
              {['100', '250', '500', '1000'].map((p) => (
                <TouchableOpacity
                  key={`quick-pill-${p}`}
                  style={[styles.quickPill, amount === p && styles.quickPillActive]}
                  onPress={() => setAmount(p)}
                >
                  <Text style={[styles.quickPillText, amount === p && styles.quickPillTextActive]}>
                    +₹{p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, recharging && styles.opacity7]}
              onPress={handleAddMoney}
              disabled={recharging}
            >
              {recharging ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Proceed to Pay ₹{amount || '0'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: Edit Profile ───────────────────────────────────── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentBox}>
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
              placeholderTextColor="#94a3b8"
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
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, savingProfile && styles.opacity7]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: View Details ───────────────────────────────────── */}
      <Modal
        visible={viewDetailsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewDetailsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Passenger Details</Text>
              <TouchableOpacity onPress={() => setViewDetailsVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailsKey}>Name:</Text>
              <Text style={styles.detailsVal}>{userName}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsKey}>Mobile:</Text>
              <Text style={styles.detailsVal}>+91 {user?.mobile || '9876543210'}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsKey}>R-Wallet:</Text>
              <Text style={styles.detailsVal}>₹ {walletAmount}</Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailsKey}>Profile Status:</Text>
              <Text style={[styles.detailsVal, { color: '#16a34a' }]}>100% Completed</Text>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => setViewDetailsVisible(false)}
            >
              <Text style={styles.confirmBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e4f7fc',
  },
  scrollContent: {
    backgroundColor: '#f8fafc',
    paddingBottom: 28,
  },

  /* 1. Header Banner */
  headerBanner: {
    backgroundColor: '#e4f7fc',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 48,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#5caee6',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#3ca8eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    shadowColor: '#3ca8eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  userNameText: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  detailsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionBtnText: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#0066ff',
    marginLeft: 4,
  },
  actionDivider: {
    color: '#94a3b8',
    marginHorizontal: 6,
    fontSize: 13,
  },

  /* R-Wallet Floating Card */
  walletCard: {
    position: 'absolute',
    bottom: -24,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletTextCol: {
    marginLeft: 12,
  },
  walletLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  walletAmount: {
    fontSize: 17.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f3a4e',
    marginTop: 1,
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletRefreshBtn: {
    padding: 6,
    marginRight: 8,
  },
  walletAddBtn: {
    backgroundColor: '#0066ff',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  walletAddBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: 'Montserrat_600SemiBold',
  },

  /* 2. Progress Card */
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
  },
  progressTitle: {
    fontSize: 14.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#334155',
    marginBottom: 8,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#1e293b',
  },

  /* 3. Saved Passengers Card */
  passengersCard: {
    backgroundColor: '#fffdfa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginHorizontal: 16,
    marginTop: 14,
    overflow: 'hidden',
  },
  passHeader: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passHeaderTextCol: {
    marginLeft: 10,
  },
  passHeaderTitle: {
    fontSize: 14.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#1e293b',
  },
  passHeaderSub: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
    marginTop: 1,
  },
  passHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passRefreshBtn: {
    padding: 6,
    marginRight: 8,
  },
  passAddBtn: {
    backgroundColor: '#f5a623',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 7,
  },
  passAddBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: 'Montserrat_600SemiBold',
  },
  passengersList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
  },
  noBorderBottom: {
    borderBottomWidth: 0,
  },
  pLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pAvatarBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pInfoCol: {
    flex: 1,
  },
  pNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pNameText: {
    fontSize: 14.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#1e293b',
    marginRight: 6,
  },
  pSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pSubText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
  },
  verifiedCheck: {
    marginLeft: 4,
  },
  pActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pActionBtn: {
    padding: 6,
    marginLeft: 6,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#94a3b8',
    textAlign: 'center',
  },

  /* Food Badge */
  foodBadgeContainer: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  foodBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* 4. 6-Feature Grid Cards */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 14,
  },
  gridCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 96,
  },
  gridCardCyan: {
    backgroundColor: '#e6f7fc',
  },
  gridCardGreen: {
    backgroundColor: '#eafbe9',
  },
  gridCardPink: {
    backgroundColor: '#fdf2f8',
  },
  gridCardBlue: {
    backgroundColor: '#eaf6fd',
  },
  gridCardPeach: {
    backgroundColor: '#fef3e7',
  },
  gridCardGrey: {
    backgroundColor: '#f0f5f0',
  },
  gridIconWrap: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridCardTitle: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#0e2468',
    textAlign: 'center',
    lineHeight: 16,
  },

  /* Biometric Toggle */
  bioToggleContainer: {
    width: 46,
    height: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  bioToggleOn: {
    backgroundColor: '#0066ff',
    justifyContent: 'space-between',
  },
  bioToggleOff: {
    backgroundColor: '#cbd5e1',
    justifyContent: 'flex-start',
  },
  bioToggleText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontFamily: 'Montserrat_700Bold',
    marginLeft: 5,
  },
  bioToggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
  },

  /* Modal Common */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
  },
  formRowGap10: {
    flexDirection: 'row',
    gap: 10,
  },
  flexOne: {
    flex: 1,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  genderBtnActive: {
    backgroundColor: '#0066ff',
    borderColor: '#0066ff',
  },
  genderText: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
  },
  genderTextActive: {
    color: '#ffffff',
  },
  foodPrefRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  foodPrefBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  foodPrefBtnActive: {
    backgroundColor: '#f5a623',
    borderColor: '#f5a623',
  },
  foodPrefText: {
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
  },
  foodPrefTextActive: {
    color: '#ffffff',
  },
  confirmBtn: {
    backgroundColor: '#0066ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
  },
  modalSub: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#64748b',
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0066ff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  rupeePrefix: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    padding: 0,
  },
  quickPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  quickPillActive: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#0066ff',
  },
  quickPillText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
  },
  quickPillTextActive: {
    color: '#0066ff',
  },
  mobileInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  countryCode: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#64748b',
    marginRight: 8,
  },
  mobileInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailsKey: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  detailsVal: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#0f172a',
  },
  opacity7: {
    opacity: 0.7,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { AppAlert } from '@/context/AlertContext';
import { useNavigation } from '@react-navigation/native';
import { StorageService, SavedPassenger } from '@/services/storage/storage.service';
import { FocusAwareStatusBar } from '@/components/common';

// Food Preference Badge (Indian Railways Veg square icon with green dot)
const FoodTypeBadge = ({ type = 'Veg' }: { type?: string }) => {
  const isVeg = type.toLowerCase().includes('veg') && !type.toLowerCase().includes('non');
  const color = isVeg ? '#16a34a' : '#ef4444';

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
    <Path d="M0 6C0 2.68629 2.68629 0 6 0H30C33.3137 0 36 2.68629 36 6V7H0V6Z" fill="#16a34a" fillOpacity="0.35" />
  </Svg>
);

// Custom Biometric Toggle Icon
const BiometricToggle = ({ enabled = true }: { enabled?: boolean }) => (
  <View style={[styles.bioToggleContainer, enabled ? styles.bioToggleOn : styles.bioToggleOff]}>
    {enabled && <Text style={styles.bioToggleText}>On</Text>}
    <View style={styles.bioToggleKnob} />
  </View>
);

// Custom Tile SVG Icons
const ChangePasswordSvg = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="10" width="18" height="12" rx="3" fill="#00bcd4" fillOpacity="0.2" stroke="#00acc1" strokeWidth="1.8" />
    <Path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="#00acc1" strokeWidth="1.8" strokeLinecap="round" />
    <Circle cx="12" cy="15" r="1.5" fill="#00acc1" />
    <Path d="M12 16.5V19" stroke="#00acc1" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const MyAccountSvg = () => (
  <Svg width={30} height={28} viewBox="0 0 28 24" fill="none">
    <Rect x="2" y="3" width="24" height="16" rx="3" fill="#4caf50" fillOpacity="0.2" stroke="#2e7d32" strokeWidth="1.8" />
    <Path d="M2 8H26" stroke="#2e7d32" strokeWidth="1.8" />
    <Circle cx="20" cy="17" r="4.5" fill="#2e7d32" />
    <Path d="M18 17L19.5 18.5L22.5 15.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TransferTicketSvg = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V9.5C19.6193 9.5 18.5 10.6193 18.5 12C18.5 13.3807 19.6193 14.5 21 14.5V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V14.5C4.38071 14.5 5.5 13.3807 5.5 12C5.5 10.6193 4.38071 9.5 3 9.5V6Z"
      fill="#0288d1"
      fillOpacity="0.2"
      stroke="#0288d1"
      strokeWidth="1.8"
    />
    <Path d="M9 8H15M9 12H15M9 16H15" stroke="#0288d1" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1 2" />
  </Svg>
);

const MyTransactionSvg = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 4C5 2.89543 5.89543 2 7 2H17C18.1046 2 19 2.89543 19 4V21L12 17.5L5 21V4Z"
      fill="#fb8c00"
      fillOpacity="0.2"
      stroke="#fb8c00"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="8.5" r="2.5" fill="#fb8c00" />
    <Path d="M9 13H15" stroke="#fb8c00" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const DeLinkAadharSvg = () => (
  <Svg width={30} height={28} viewBox="0 0 28 24" fill="none">
    <Rect x="2" y="4" width="22" height="15" rx="3" fill="#8bc34a" fillOpacity="0.2" stroke="#689f38" strokeWidth="1.8" />
    <Path d="M6 8H12M6 11H10M6 14H8" stroke="#689f38" strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="18" y="2" width="8" height="8" rx="2" fill="#689f38" />
    <Path d="M22 8V4M20 5.5L22 3.5L24 5.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ProfileScreen = () => {
  const { width } = useWindowDimensions();
  const gridBoxWidth = (width - 48) / 3;
  const { user, updateUserProfile, addWalletBalance, requestWalletRecharge, refreshProfile, isAdmin } = useAuth();
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
    if (list && list.length > 0) {
      setPassengers(list);
    } else {
      // Default initial passenger matching reference design
      const initial: SavedPassenger[] = [
        {
          id: '1',
          name: user?.name || 'Hariom singh',
          age: 23,
          gender: 'M',
          berthPreference: 'NC',
          foodPreference: 'Veg',
          verified: true,
        },
      ];
      setPassengers(initial);
    }
  };

  const handleWalletAddPress = () => {
    setModalVisible(true);
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
      AppAlert.show('Required', 'Please enter passenger name.', undefined, 'warning');
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
    AppAlert.show('Remove Passenger', 'Are you sure you want to remove this passenger?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = await StorageService.deletePassenger(id);
          setPassengers(updated);
        },
      },
    ], 'confirm');
  };

  const handleSaveProfile = async () => {
    if (!editMobile.trim() || editMobile.trim().length < 10) {
      AppAlert.show('Invalid Mobile', 'Please enter a valid 10-digit mobile number.', undefined, 'warning');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUserProfile(editName.trim() || 'User', editMobile.trim());
      setEditModalVisible(false);
      AppAlert.show('Success', 'Profile updated successfully!', undefined, 'success');
    } catch {
      AppAlert.show('Error', 'Could not update profile. Please try again.', undefined, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddMoney = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      AppAlert.show('Invalid Amount', 'Please enter a valid amount to recharge.', undefined, 'warning');
      return;
    }
    setRecharging(true);
    try {
      if (user?.role === 'admin') {
        await addWalletBalance(val, 'Admin Direct Top-Up');
        setModalVisible(false);
        setAmount('100');
        AppAlert.show('Success', `₹${val.toFixed(2)} added directly to R-Wallet!`, undefined, 'success');
      } else {
        await requestWalletRecharge(val, 'User App Recharge Request');
        setModalVisible(false);
        setAmount('100');
        AppAlert.show(
          'Request Submitted ⏳',
          `Your recharge request for ₹${val.toFixed(2)} has been sent to the Administrator for approval.\n\nYour balance will update automatically once approved.`,
          undefined,
          'success'
        );
      }
    } catch (err: any) {
      AppAlert.show('Error', err?.message || 'Could not submit recharge request. Please try again.', undefined, 'error');
    } finally {
      setRecharging(false);
    }
  };

  const userName = user?.name || 'hariom singh';
  const walletAmount = user?.wallet !== undefined ? user.wallet.toFixed(2) : '2.90';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FocusAwareStatusBar backgroundColor="#e1f5fe" barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── 1. Curved Sky-Blue Header ───────────────────────────── */}
        <View style={styles.headerBanner}>
          {/* Circular Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0066ff" />
          </TouchableOpacity>

          {/* User Avatar Circle */}
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={42} color="#0284c7" />
              </View>
            )}
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
              <Ionicons name="eye-outline" size={17} color="#0066ff" />
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
                onPress={async () => {
                  try {
                    await refreshProfile();
                  } catch {}
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={22} color="#0066ff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.walletAddBtn}
                onPress={handleWalletAddPress}
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
          {/* Peach Header */}
          <View style={styles.passHeader}>
            <View style={styles.passHeaderLeft}>
              <Ionicons name="people" size={24} color="#f97316" />
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
                <Ionicons name="refresh" size={20} color="#f97316" />
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
            {passengers.map((p, idx) => (
              <View
                key={p.id || idx}
                style={[
                  styles.passengerRow,
                  idx === passengers.length - 1 && styles.noBorderBottom,
                ]}
              >
                <View style={styles.pLeftCol}>
                  <View style={styles.pAvatarBadge}>
                    <Ionicons name="person" size={17} color="#f97316" />
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
                        {p.age} Y, {p.gender}, {p.berthPreference || 'NC'} | {p.foodPreference || 'Veg'}
                      </Text>
                      {p.verified && (
                        <MaterialCommunityIcons
                          name="check-decagram"
                          size={15}
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
                    <Feather name="edit-3" size={18} color="#f59e0b" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pActionBtn}
                    onPress={() => handleDeletePassenger(p.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#f59e0b" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
              <ChangePasswordSvg />
            </View>
            <Text style={styles.gridCardTitle}>Change{"\n"}Password</Text>
          </TouchableOpacity>

          {/* 2. My Account */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardGreen, { width: gridBoxWidth }]}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconWrap}>
              <MyAccountSvg />
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
              <TransferTicketSvg />
            </View>
            <Text style={styles.gridCardTitle}>Transfer{"\n"}Ticket</Text>
          </TouchableOpacity>

          {/* 5. My Transaction */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardPeach, { width: gridBoxWidth }]}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconWrap}>
              <MyTransactionSvg />
            </View>
            <Text style={styles.gridCardTitle}>My{"\n"}Transaction</Text>
          </TouchableOpacity>

          {/* 6. DeLink Aadhar */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardLime, { width: gridBoxWidth }]}
            activeOpacity={0.8}
          >
            <View style={styles.gridIconWrap}>
              <DeLinkAadharSvg />
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                placeholder="e.g. Hariom singh"
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
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── MODAL: Recharge R-Wallet ─────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContentBox}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeaderTitle}>
                  {user?.role === 'admin' ? 'Recharge R-Wallet (Admin)' : 'Request R-Wallet Recharge'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSub}>
                {user?.role === 'admin'
                  ? 'Enter amount to credit directly:'
                  : 'Enter amount to add. Balance will be updated after Administrator approval:'}
              </Text>
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
                  <Text style={styles.confirmBtnText}>
                    {user?.role === 'admin'
                      ? `Credit ₹${amount || '0'} Directly`
                      : `Submit Request for ₹${amount || '0'}`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── MODAL: Edit Profile ───────────────────────────────────── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
              <Text style={styles.detailsVal}>{user?.mobile ? `+91 ${user.mobile}` : 'Not Provided'}</Text>
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
    backgroundColor: '#e1f5fe',
  },
  scrollContent: {
    backgroundColor: '#ffffff',
    paddingBottom: 16,
  },

  /* 1. Header Banner (Compact) */
  headerBanner: {
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 48,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    position: 'relative',
    marginBottom: 34,
  },
  backBtn: {
    position: 'absolute',
    left: 10,
    top: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#7fc3f5',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#b3e5fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#bae6fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: 15,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#0f172a',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  detailsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#0066ff',
    marginLeft: 4,
  },
  actionDivider: {
    color: '#94a3b8',
    marginHorizontal: 6,
    fontSize: 12,
  },

  /* R-Wallet Floating Card (Compact) */
  walletCard: {
    position: 'absolute',
    bottom: -24,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 24,
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
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
  },
  walletAmount: {
    fontSize: 16.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    marginTop: 1,
  },
  walletRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletRefreshBtn: {
    padding: 5,
    marginRight: 8,
  },
  walletAddBtn: {
    backgroundColor: '#0066ff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  walletAddBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Montserrat_600SemiBold',
  },

  /* 2. Progress Card (Compact) */
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 0,
  },
  progressTitle: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#1f2937',
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
    backgroundColor: '#e5e7eb',
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#111827',
  },

  /* 3. Saved Passengers Card (Compact) */
  passengersCard: {
    backgroundColor: '#fffaf5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginHorizontal: 16,
    marginTop: 14,
    overflow: 'hidden',
  },
  passHeader: {
    backgroundColor: '#fff2e5',
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
    fontSize: 13,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#1e293b',
  },
  passHeaderSub: {
    fontSize: 11,
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
    backgroundColor: '#fbbf24',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  passAddBtnText: {
    color: '#78350f',
    fontSize: 12.5,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fed7aa',
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
    fontSize: 13.5,
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
    fontSize: 11,
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

  /* Food Badge */
  foodBadgeContainer: {
    width: 14,
    height: 14,
    borderWidth: 1.2,
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

  /* 4. 6-Feature Grid Cards (Compact) */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 14,
  },
  gridCard: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 90,
  },
  gridCardCyan: {
    backgroundColor: '#e1f5fe',
  },
  gridCardGreen: {
    backgroundColor: '#e8f5e9',
  },
  gridCardPink: {
    backgroundColor: '#fce4ec',
  },
  gridCardBlue: {
    backgroundColor: '#e1f5fe',
  },
  gridCardPeach: {
    backgroundColor: '#fff3e0',
  },
  gridCardLime: {
    backgroundColor: '#f1f8e9',
  },
  gridIconWrap: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  gridCardTitle: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 14.5,
  },

  /* Biometric Toggle */
  bioToggleContainer: {
    width: 44,
    height: 22,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2.5,
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
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    marginLeft: 4,
  },
  bioToggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
    fontSize: 15.5,
    fontFamily: 'Montserrat_600SemiBold',
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
    height: 40,
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
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 14,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
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

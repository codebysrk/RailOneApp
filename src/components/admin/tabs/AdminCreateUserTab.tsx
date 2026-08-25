import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

interface AdminCreateUserTabProps {
  createdUser: {
    name: string;
    email: string;
    mobile: string;
    password: string;
    wallet: number;
    role: string;
  } | null;
  setCreatedUser: (user: any) => void;
  role: 'user' | 'admin';
  setRole: (val: 'user' | 'admin') => void;
  name: string;
  setName: (val: string) => void;
  mobile: string;
  setMobile: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean | ((prev: boolean) => boolean)) => void;
  walletAmount: string;
  setWalletAmount: (val: string) => void;
  submitting: boolean;
  onCreateUser: () => void;
  onGeneratePassword: () => void;
  onShareCredentials: (user: any) => void;
  triggerHaptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => void;
}

export const AdminCreateUserTab: React.FC<AdminCreateUserTabProps> = ({
  createdUser,
  setCreatedUser,
  role,
  setRole,
  name,
  setName,
  mobile,
  setMobile,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  walletAmount,
  setWalletAmount,
  submitting,
  onCreateUser,
  onGeneratePassword,
  onShareCredentials,
  triggerHaptic,
}) => {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {createdUser && (
        <View style={styles.successBox}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.successTitle}>Account Provisioned Successfully!</Text>
            <TouchableOpacity
              style={{ marginLeft: 'auto' }}
              onPress={() => setCreatedUser(null)}
            >
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.credRow}>
            <Text style={styles.credLabel}>Email:</Text>
            <Text style={styles.credVal}>{createdUser.email}</Text>
          </View>
          <View style={styles.credRow}>
            <Text style={styles.credLabel}>Password:</Text>
            <Text style={styles.credVal}>{createdUser.password}</Text>
          </View>
          <View style={styles.credRow}>
            <Text style={styles.credLabel}>Role / Wallet:</Text>
            <Text style={styles.credVal}>
              {createdUser.role.toUpperCase()} • ₹{createdUser.wallet.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => onShareCredentials(createdUser)}
            activeOpacity={0.85}
          >
            <Feather name="share-2" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.shareBtnText}>Share Login Credentials</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.formCard}>
        <View style={styles.formHeaderRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.formHeader}>Create New Account</Text>
            <Text style={styles.formSub}>Provision credentials with instant wallet</Text>
          </View>
          <View style={styles.formBadge}>
            <Text style={styles.formBadgeText}>ADMIN</Text>
          </View>
        </View>

        {/* Role Toggle */}
        <Text style={styles.label}>ACCOUNT TYPE</Text>
        <View style={styles.roleToggleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]}
            onPress={() => {
              triggerHaptic('light');
              setRole('user');
            }}
            activeOpacity={0.8}
          >
            <Feather
              name="user"
              size={14}
              color={role === 'user' ? '#0066ff' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.roleBtnText, role === 'user' && styles.roleBtnTextActive]}>
              Passenger / User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, role === 'admin' && styles.roleBtnActiveAdmin]}
            onPress={() => {
              triggerHaptic('light');
              setRole('admin');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={role === 'admin' ? '#b45309' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActiveAdmin]}>
              Administrator
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <Text style={styles.label}>FULL NAME *</Text>
        <View style={styles.inputWrap}>
          <Feather name="user" size={15} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.formInput}
            placeholder="Enter passenger name"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            multiline={false}
          />
        </View>

        {/* Mobile */}
        <Text style={styles.label}>MOBILE NUMBER (OPTIONAL)</Text>
        <View style={styles.inputWrap}>
          <Feather name="phone" size={15} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.formInput}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94a3b8"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            maxLength={10}
            multiline={false}
          />
        </View>

        {/* Email */}
        <Text style={styles.label}>EMAIL ADDRESS *</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={15} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.formInput}
            placeholder="Enter email address"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            multiline={false}
          />
        </View>

        {/* Password */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>PASSWORD *</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={onGeneratePassword}
          >
            <Feather name="refresh-cw" size={11} color="#0066ff" style={{ marginRight: 4 }} />
            <Text style={styles.autoGenText}>Auto-Generate</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={15} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.formInput}
            placeholder="Enter password (min. 6 characters)"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            multiline={false}
          />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Initial Balance */}
        <Text style={styles.label}>INITIAL WALLET CREDIT (₹)</Text>
        <View style={styles.balancePillRow}>
          {['100', '250', '500', '1000'].map((amt) => {
            const isSelected = walletAmount === amt;
            return (
              <TouchableOpacity
                key={amt}
                style={[styles.balancePill, isSelected && styles.balancePillActive]}
                onPress={() => {
                  triggerHaptic('light');
                  setWalletAmount(amt);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.balancePillText, isSelected && styles.balancePillTextActive]}>
                  ₹{amt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.75 }]}
          onPress={onCreateUser}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Feather name="user-plus" size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Create & Provision Account</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 24,
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#15803d',
    marginLeft: 6,
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  credLabel: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
  },
  credVal: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 7,
    paddingVertical: 8,
    marginTop: 8,
  },
  shareBtnText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  formHeader: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  formSub: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 1,
  },
  formBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  formBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0066ff',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 9,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#64748b',
    marginTop: 7,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
    marginBottom: 3,
  },
  autoGenText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  roleToggleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  roleBtnActiveAdmin: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  roleBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#64748b',
  },
  roleBtnTextActive: {
    color: '#0066ff',
    fontFamily: 'Montserrat_700Bold',
  },
  roleBtnTextActiveAdmin: {
    color: '#b45309',
    fontFamily: 'Montserrat_700Bold',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 40,
  },
  formInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    height: '100%',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  balancePillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  balancePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  balancePillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  balancePillText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
  },
  balancePillTextActive: {
    color: '#0066ff',
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#0066ff',
    borderRadius: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  submitBtnText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
});

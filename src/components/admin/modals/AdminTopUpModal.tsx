import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

interface AdminTopUpModalProps {
  visible: boolean;
  onClose: () => void;
  user: any | null;
  customTopUpAmount: string;
  setCustomTopUpAmount: (val: string) => void;
  toppingUpId: string | null;
  onConfirmTopUp: () => void;
}

export const AdminTopUpModal: React.FC<AdminTopUpModalProps> = ({
  visible,
  onClose,
  user,
  customTopUpAmount,
  setCustomTopUpAmount,
  toppingUpId,
  onConfirmTopUp,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.compactModalBox}>
          <View style={styles.userTicketsModalHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="credit-card" size={16} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.userTicketsModalTitle}>Top-Up R-Wallet</Text>
              </View>
              <Text style={styles.userTicketsModalSub}>
                Recharge wallet for {user?.name || user?.displayName || 'User'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Quick Preset Pills */}
          <Text style={styles.label}>Select or Enter Amount</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
            {['100', '250', '500', '1000'].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.quickAmtPill,
                  customTopUpAmount === amt && styles.quickAmtPillActive,
                ]}
                onPress={() => setCustomTopUpAmount(amt)}
              >
                <Text
                  style={[
                    styles.quickAmtPillText,
                    customTopUpAmount === amt && styles.quickAmtPillTextActive,
                  ]}
                >
                  +₹{amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputWrap}>
            <Text style={{ fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#0f172a', marginRight: 4 }}>
              ₹
            </Text>
            <TextInput
              style={styles.formInput}
              placeholder="Amount (e.g. 500)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={customTopUpAmount}
              onChangeText={(t) => setCustomTopUpAmount(t.replace(/[^0-9]/g, ''))}
              multiline={false}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={onClose}
              disabled={!!toppingUpId}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, !!toppingUpId && { opacity: 0.75 }]}
              onPress={onConfirmTopUp}
              disabled={!!toppingUpId}
              activeOpacity={0.85}
            >
              {toppingUpId ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Credit R-Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  compactModalBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  userTicketsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 8,
  },
  userTicketsModalTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  userTicketsModalSub: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
    marginTop: 6,
    marginBottom: 3,
  },
  quickAmtPill: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickAmtPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  quickAmtPillText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#64748b',
  },
  quickAmtPillTextActive: {
    color: '#0066ff',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 38,
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
  modalCancel: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#475569',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#059669',
    borderRadius: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
});


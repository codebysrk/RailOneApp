import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

interface AdminEditDistanceModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: any | null;
  editDistanceValue: string;
  setEditDistanceValue: (val: string) => void;
  savingDistance: boolean;
  onSaveDistance: () => void;
}

export const AdminEditDistanceModal: React.FC<AdminEditDistanceModalProps> = ({
  visible,
  onClose,
  ticket,
  editDistanceValue,
  setEditDistanceValue,
  savingDistance,
  onSaveDistance,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalCard}
            >
              <View style={styles.modalHeader}>
                <View style={styles.iconCircle}>
                  <Feather name="map-pin" size={18} color="#0066ff" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.modalTitle}>Edit Ticket Distance</Text>
                  <Text style={styles.modalSub}>
                    UTS: {ticket?.ticketId || ticket?.pnr || 'XMSQEB'}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {ticket && (
                <View style={styles.routeSummaryBox}>
                  <Text style={styles.routeSummaryText}>
                    {ticket.sourceName || ticket.sourceCode || 'Source'} ➔ {ticket.destName || ticket.destCode || 'Destination'}
                  </Text>
                </View>
              )}

              <Text style={styles.inputLabel}>ROUTE DISTANCE</Text>
              <View style={styles.distanceInputRow}>
                <TextInput
                  style={styles.numericInput}
                  placeholder="345"
                  placeholderTextColor="#94a3b8"
                  value={editDistanceValue}
                  onChangeText={(val) => setEditDistanceValue(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  multiline={false}
                  autoFocus
                />
                <View style={styles.kmBadge}>
                  <Text style={styles.kmBadgeText}>KM</Text>
                </View>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={savingDistance}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, savingDistance && { opacity: 0.7 }]}
                  onPress={onSaveDistance}
                  disabled={savingDistance}
                  activeOpacity={0.85}
                >
                  {savingDistance ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Feather name="check" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.saveBtnText}>Save Distance</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 14.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 1,
  },
  routeSummaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  routeSummaryText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#334155',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#64748b',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  distanceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  numericInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    height: '100%',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  kmBadge: {
    backgroundColor: '#0066ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kmBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#ffffff',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: 'Montserrat_700Bold',
    color: '#475569',
  },
  saveBtn: {
    flex: 1.4,
    height: 40,
    backgroundColor: '#0066ff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  saveBtnText: {
    fontSize: 12.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
});

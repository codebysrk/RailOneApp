import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

interface AdminAddStationModalProps {
  visible: boolean;
  onClose: () => void;
  stnCode: string;
  setStnCode: (val: string) => void;
  stnName: string;
  setStnName: (val: string) => void;
  stnCity: string;
  setStnCity: (val: string) => void;
  stnState: string;
  setStnState: (val: string) => void;
  stnZone: string;
  setStnZone: (val: string) => void;
  stnIsPopular: boolean;
  setStnIsPopular: (val: boolean | ((prev: boolean) => boolean)) => void;
  addingStation: boolean;
  onAddStation: () => void;
}

export const AdminAddStationModal: React.FC<AdminAddStationModalProps> = ({
  visible,
  onClose,
  stnCode,
  setStnCode,
  stnName,
  setStnName,
  stnCity,
  setStnCity,
  stnState,
  setStnState,
  stnZone,
  setStnZone,
  stnIsPopular,
  setStnIsPopular,
  addingStation,
  onAddStation,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.compactModalBox}>
          <View style={styles.userTicketsModalHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="add-location-alt" size={16} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.userTicketsModalTitle}>Add Railway Station</Text>
              </View>
              <Text style={styles.userTicketsModalSub}>
                Register a new Indian Railway station to Firestore.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {/* Station Code */}
            <Text style={styles.label}>Station Code *</Text>
            <View style={styles.inputWrap}>
              <Feather name="hash" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.formInput}
                placeholder="e.g. NDLS, GWL, HWH"
                placeholderTextColor="#94a3b8"
                value={stnCode}
                onChangeText={(t) => setStnCode(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                multiline={false}
              />
            </View>

            {/* Station Name */}
            <Text style={styles.label}>Station Name *</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="train" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.formInput}
                placeholder="Full name (e.g. New Delhi)"
                placeholderTextColor="#94a3b8"
                value={stnName}
                onChangeText={setStnName}
                autoCapitalize="words"
                multiline={false}
              />
            </View>

            {/* City */}
            <Text style={styles.label}>City / District</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="location-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.formInput}
                placeholder="City name"
                placeholderTextColor="#94a3b8"
                value={stnCity}
                onChangeText={setStnCity}
                autoCapitalize="words"
                multiline={false}
              />
            </View>

            {/* State */}
            <Text style={styles.label}>State</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="map-outline" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.formInput}
                placeholder="State (e.g. Uttar Pradesh, Delhi)"
                placeholderTextColor="#94a3b8"
                value={stnState}
                onChangeText={setStnState}
                autoCapitalize="words"
                multiline={false}
              />
            </View>

            {/* Zone */}
            <Text style={styles.label}>Railway Zone</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="flag" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.formInput}
                placeholder="e.g. NR, NCR, WR, CR"
                placeholderTextColor="#94a3b8"
                value={stnZone}
                onChangeText={(t) => setStnZone(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
                multiline={false}
              />
            </View>

            {/* Popular toggle */}
            <TouchableOpacity
              style={[styles.popularToggleRow, { marginTop: 4, marginBottom: 8 }]}
              onPress={() => setStnIsPopular((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={stnIsPopular ? 'checkbox' : 'square-outline'}
                size={20}
                color={stnIsPopular ? '#0066ff' : '#94a3b8'}
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontSize: 12.5, fontFamily: 'Montserrat_600SemiBold', color: '#1e293b' }}>
                Mark as Popular / Major Junction
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, addingStation && { opacity: 0.75 }, { marginTop: 8 }]}
              onPress={onAddStation}
              disabled={addingStation}
              activeOpacity={0.85}
            >
              {addingStation ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Save & Publish Station</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  popularToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtn: {
    backgroundColor: '#0066ff',
    borderRadius: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066ff',
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


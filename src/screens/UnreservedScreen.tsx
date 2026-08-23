import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, FlatList, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing, elevation } from '@/theme/spacing';
import { AppHeader, SegmentedControl } from '@/components/common';
import { FirebaseService, StationModel } from '@/services';

const mainTabs = [
  { id: 'normal', label: 'Normal' },
  { id: 'season', label: 'Season' },
];

export const UnreservedScreen = () => {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'normal' | 'season'>('normal');
  const [location, setLocation] = useState<'outside' | 'at'>('outside');
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');

  // Station Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickingTarget, setPickingTarget] = useState<'source' | 'dest'>('source');
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<StationModel[]>([]);

  useEffect(() => {
    loadStations('');
  }, []);

  const loadStations = async (q: string) => {
    const list = await FirebaseService.searchStations(q);
    setStations(list);
  };

  const handleSelectStation = (stn: StationModel) => {
    const label = `${stn.code} - ${stn.name}`;
    const opposing = pickingTarget === 'source' ? dest : source;
    const opposingCode = opposing ? opposing.split(' - ')[0]?.trim() : '';

    if (opposing && (stn.code === opposingCode || label.toUpperCase() === opposing.toUpperCase())) {
      Alert.alert(
        'Same Station Selected',
        `Source and Destination cannot be the same station (${stn.code} - ${stn.name}). Please select a different station.`
      );
      return;
    }

    if (pickingTarget === 'source') {
      setSource(label);
    } else {
      setDest(label);
    }
    setPickerVisible(false);
    setSearchQuery('');
  };

  const handleProceedToBook = () => {
    if (!source.trim() || !dest.trim()) {
      Alert.alert('Selection Required', 'Please select both Source and Destination stations to proceed.');
      return;
    }
    const srcCode = source.split(' - ')[0]?.trim();
    const dstCode = dest.split(' - ')[0]?.trim();
    if (srcCode === dstCode || source.trim().toUpperCase() === dest.trim().toUpperCase()) {
      Alert.alert(
        'Invalid Route',
        'Source and Destination stations cannot be the same. Please select different stations to proceed.'
      );
      return;
    }
    navigation.navigate('BookingConfig', { source, dest });
  };

  const openPicker = (target: 'source' | 'dest') => {
    setPickingTarget(target);
    setPickerVisible(true);
    loadStations('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Unreserved E-Ticket"
        variant="light"
        onClose={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <SegmentedControl
            items={mainTabs}
            selectedId={tab}
            onSelect={(id) => setTab(id as any)}
          />

          {tab === 'normal' && (
            <View>
              <View style={styles.subTabsRow}>
                <TouchableOpacity 
                  style={[styles.subTabBtn, location === 'outside' ? styles.subTabActive : styles.subTabInactive]}
                  onPress={() => setLocation('outside')}
                >
                  <Text style={[styles.subTabText, location === 'outside' ? styles.subTabTextActive : styles.subTabTextInactive]}>
                    Outside Station
                  </Text>
                  <Ionicons 
                    name="information-circle-outline" 
                    size={16} 
                    color={location === 'outside' ? colors.white : '#94a3b8'} 
                    style={{ marginLeft: 6 }} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.subTabBtn, location === 'at' ? styles.subTabActive : styles.subTabInactive]}
                  onPress={() => setLocation('at')}
                >
                  <Text style={[styles.subTabText, location === 'at' ? styles.subTabTextActive : styles.subTabTextInactive]}>
                    At Station
                  </Text>
                  <Ionicons 
                    name="information-circle-outline" 
                    size={16} 
                    color={location === 'at' ? colors.white : '#94a3b8'} 
                    style={{ marginLeft: 6 }} 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputSection}>
                <TouchableOpacity style={styles.inputRow} onPress={() => openPicker('source')} activeOpacity={0.7}>
                  <Text style={styles.inputLabel}>From</Text>
                  <View style={styles.inputField}>
                    <Ionicons name="train-outline" size={20} color={source ? "#0066ff" : "#94a3b8"} />
                    <Text style={[styles.inputText, !source && styles.inputPlaceholder]}>
                      {source || 'Select Source Station'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.dividerWrapper}>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.swapBtn}
                    onPress={() => {
                      if (source || dest) {
                        const temp = source;
                        setSource(dest);
                        setDest(temp);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="swap-vertical" size={16} color="#0066ff" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.inputRow} onPress={() => openPicker('dest')} activeOpacity={0.7}>
                  <Text style={styles.inputLabel}>To</Text>
                  <View style={styles.inputField}>
                    <Ionicons name="train-outline" size={20} color={dest ? "#0066ff" : "#94a3b8"} />
                    <Text style={[styles.inputText, !dest && styles.inputPlaceholder]}>
                      {dest || 'Select Destination Station'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={handleProceedToBook}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Proceed To Book</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Check Upcoming Trains</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.recentTitle}>Recent Searches</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
          <TouchableOpacity 
            style={styles.recentCard}
            onPress={() => { setSource('MRA - MORENA'); setDest('DBA - DABRA'); }}
          >
            <Text style={styles.recentText}>MORENA, MRA</Text>
            <Ionicons name="git-compare-outline" size={16} color={colors.brandBlue} style={{ marginVertical: 4 }} />
            <Text style={styles.recentText}>DABRA, DBA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.recentCard}
            onPress={() => { setSource('NDLS - NEW DELHI'); setDest('MRA - MORENA'); }}
          >
            <Text style={styles.recentText}>NEW DELHI, NDLS</Text>
            <Ionicons name="git-compare-outline" size={16} color={colors.brandBlue} style={{ marginVertical: 4 }} />
            <Text style={styles.recentText}>MORENA, MRA</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>

      {/* Station Selector Modal */}
      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {pickingTarget === 'source' ? 'Source' : 'Destination'} Station
            </Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchBox}>
            <Ionicons name="search" size={20} color="#94a3b8" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search by Station Name or Code (e.g. NDLS)..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                loadStations(text);
              }}
              autoFocus
            />
          </View>

          <FlatList
            data={stations}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.stationItem}
                onPress={() => handleSelectStation(item)}
              >
                <View style={styles.stationBadge}>
                  <Text style={styles.stationBadgeText}>{item.code}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.stationItemName}>{item.name}</Text>
                  <Text style={styles.stationItemSub}>{item.city}, {item.state} ({item.zone})</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.stationDivider} />}
            contentContainerStyle={{ paddingHorizontal: spacing.md }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 28, padding: 20, ...elevation.sm, marginBottom: spacing.xl },
  
  subTabsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  subTabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 24, marginHorizontal: 4 },
  subTabActive: { backgroundColor: '#0066ff' },
  subTabInactive: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#e5e7eb' },
  subTabText: { fontSize: 13.5, fontWeight: '600' },
  subTabTextActive: { color: colors.white },
  subTabTextInactive: { color: '#9ca3af' },
  
  inputSection: { marginBottom: 32 },
  inputRow: { marginVertical: 4 },
  inputLabel: { fontSize: 15, color: '#0ea5e9', fontWeight: '500', marginBottom: 6 },
  inputField: { flexDirection: 'row', alignItems: 'center', height: 32 },
  inputText: { marginLeft: 10, fontSize: 15, color: '#111827', fontWeight: '600', letterSpacing: 0.2 },
  inputPlaceholder: { color: '#9ca3af', fontWeight: '400' },
  
  dividerWrapper: { height: 28, justifyContent: 'center', position: 'relative' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginRight: 40 },
  swapBtn: { position: 'absolute', right: 0, backgroundColor: '#bfdbfe', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  
  primaryBtn: { backgroundColor: '#0066ff', paddingVertical: 15, borderRadius: 28, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  secondaryBtn: { backgroundColor: colors.white, paddingVertical: 15, borderRadius: 28, alignItems: 'center', borderWidth: 1, borderColor: '#0066ff' },
  secondaryBtnText: { color: '#0066ff', fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },

  recentTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 16, marginLeft: 4 },
  recentScroll: { marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  recentCard: { backgroundColor: '#e0f2fe', width: 160, paddingVertical: 20, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', marginRight: 12 },
  recentText: { fontSize: 11, color: '#475569', fontWeight: '500', letterSpacing: 0.2 },

  // Modal Styles
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: colors.white },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  modalCloseBtn: { padding: 4 },
  modalSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, margin: spacing.md, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  modalSearchInput: { flex: 1, fontSize: 15, color: '#1e293b' },
  stationItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, backgroundColor: colors.white, paddingHorizontal: 14, borderRadius: 12 },
  stationBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  stationBadgeText: { color: '#0066ff', fontWeight: '800', fontSize: 13 },
  stationItemName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  stationItemSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  stationDivider: { height: 8 },
});

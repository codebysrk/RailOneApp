import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, FlatList, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing, elevation } from '../../../theme/spacing';
import { AppHeader, SegmentedControl } from '../../../components/common';
import { FirebaseService, StationModel } from '../../../services';

const mainTabs = [
  { id: 'normal', label: 'Normal' },
  { id: 'season', label: 'Season' },
];

export const UnreservedScreen = () => {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'normal' | 'season'>('normal');
  const [location, setLocation] = useState<'outside' | 'at'>('outside');
  const [source, setSource] = useState('MRA - MORENA');
  const [dest, setDest] = useState('NDLS - NEW DELHI');

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
    const opposingCode = opposing.split(' - ')[0]?.trim();

    if (stn.code === opposingCode || label.toUpperCase() === opposing.toUpperCase()) {
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
                  <Text style={styles.inputLabel}>From (Tap to change)</Text>
                  <View style={styles.inputField}>
                    <Ionicons name="train-outline" size={20} color="#0066ff" />
                    <Text style={styles.inputText}>{source}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
                  </View>
                </TouchableOpacity>

                <View style={styles.dividerWrapper}>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.swapBtn}
                    onPress={() => {
                      const temp = source;
                      setSource(dest);
                      setDest(temp);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="swap-vertical" size={18} color={colors.brandBlue} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.inputRow} onPress={() => openPicker('dest')} activeOpacity={0.7}>
                  <Text style={styles.inputLabel}>To (Tap to change)</Text>
                  <View style={styles.inputField}>
                    <Ionicons name="train-outline" size={20} color="#0066ff" />
                    <Text style={styles.inputText}>{dest}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 'auto' }} />
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.md, ...elevation.sm, marginBottom: spacing.lg },
  
  subTabsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  subTabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 24, marginHorizontal: 4 },
  subTabActive: { backgroundColor: '#0066ff' },
  subTabInactive: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#e2e8f0' },
  subTabText: { fontSize: 13, fontWeight: '600' },
  subTabTextActive: { color: colors.white },
  subTabTextInactive: { color: '#94a3b8' },
  
  inputSection: { marginBottom: spacing.lg },
  inputRow: { marginVertical: spacing.xs },
  inputLabel: { fontSize: 13, color: '#0ea5e9', fontWeight: '600', marginBottom: 4 },
  inputField: { flexDirection: 'row', alignItems: 'center', height: 44, backgroundColor: '#f8fafc', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  inputText: { marginLeft: 10, fontSize: 15, color: colors.textHeading, fontWeight: '600' },
  
  dividerWrapper: { height: 20, justifyContent: 'center', position: 'relative' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  swapBtn: { position: 'absolute', right: 10, backgroundColor: '#bfdbfe', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  primaryBtn: { backgroundColor: '#0066ff', paddingVertical: 14, borderRadius: 24, alignItems: 'center', marginBottom: spacing.md },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { backgroundColor: colors.white, paddingVertical: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#0066ff' },
  secondaryBtnText: { color: '#0066ff', fontSize: 16, fontWeight: 'bold' },

  recentTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textHeading, marginBottom: spacing.md, marginLeft: spacing.xs },
  recentScroll: { marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  recentCard: { backgroundColor: '#e0f2fe', width: 160, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: 12, alignItems: 'center', marginRight: spacing.md },
  recentText: { fontSize: 12, color: colors.textMain, fontWeight: '500' },

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

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

interface AdminStationsTabProps {
  stationsList: any[];
  filteredStations: any[];
  stationSearchQuery: string;
  setStationSearchQuery: (val: string) => void;
  loadingStations: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  syncingStations: boolean;
  deletingStationCode: string | null;
  onSyncStations: () => void;
  onOpenAddModal: () => void;
  onDeleteStation: (stn: any) => void;
}

export const AdminStationsTab: React.FC<AdminStationsTabProps> = ({
  filteredStations,
  stationSearchQuery,
  setStationSearchQuery,
  loadingStations,
  refreshing,
  onRefresh,
  syncingStations,
  deletingStationCode,
  onSyncStations,
  onOpenAddModal,
  onDeleteStation,
}) => {
  const keyExtractor = React.useCallback((item: any) => item.code, []);

  const renderItem = React.useCallback(
    ({ item }: { item: any }) => {
      return (
        <View style={styles.card}>
          <View style={styles.cardInner}>
            {/* Station Code Badge */}
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{item.code}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.stnName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.isPopular && (
                  <View style={styles.popularTag}>
                    <Ionicons name="star" size={9} color="#b45309" style={{ marginRight: 2 }} />
                    <Text style={styles.popularTagText}>Popular</Text>
                  </View>
                )}
              </View>
              <Text style={styles.stnSub} numberOfLines={1}>
                {item.city || item.name} • {item.state || 'India'}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 6 }}>
              <View style={styles.zonePill}>
                <Text style={styles.zonePillText}>{item.zone || 'NR'}</Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => onDeleteStation(item)}
                disabled={deletingStationCode === item.code}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {deletingStationCode === item.code ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Feather name="trash-2" size={13} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [deletingStationCode, onDeleteStation]
  );

  return (
    <View style={styles.container}>
      {/* Top Search & Actions Bar */}
      <View style={styles.topActionsRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search code, name, city, state..."
            placeholderTextColor="#94a3b8"
            value={stationSearchQuery}
            onChangeText={setStationSearchQuery}
            autoCapitalize="none"
            multiline={false}
          />
          {stationSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setStationSearchQuery('')}>
              <Ionicons name="close-circle" size={15} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.syncBtn}
          onPress={onSyncStations}
          disabled={syncingStations}
          activeOpacity={0.8}
        >
          {syncingStations ? (
            <ActivityIndicator size="small" color="#0066ff" />
          ) : (
            <>
              <MaterialCommunityIcons name="cloud-sync-outline" size={15} color="#0066ff" style={{ marginRight: 4 }} />
              <Text style={styles.syncBtnText}>Sync All</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={onOpenAddModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 2 }} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loadingStations ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0066ff" />
          <Text style={styles.centerText}>Loading railway stations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStations}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 36 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={12}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <MaterialIcons name="train" size={36} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No stations found</Text>
              <Text style={styles.emptySubtitle}>
                Tap "+ Add" to register a new railway station in Firestore.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 38,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#0f172a',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    height: '100%',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginLeft: 6,
  },
  syncBtnText: {
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
    color: '#0066ff',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 9,
    marginLeft: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 11,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    width: 48,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  codeBadgeText: {
    fontSize: 11,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#0066ff',
  },
  stnName: {
    fontSize: 13,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
    marginRight: 6,
  },
  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  popularTagText: {
    fontSize: 8,
    fontFamily: 'Montserrat_800ExtraBold',
    color: '#b45309',
  },
  stnSub: {
    fontSize: 10.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 1,
  },
  zonePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  zonePillText: {
    fontSize: 9.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#475569',
  },
  deleteBtn: {
    padding: 5,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  centerText: {
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#64748b',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontFamily: 'Montserrat_700Bold',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 11.5,
    fontFamily: 'Montserrat_500Medium',
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 280,
  },
});

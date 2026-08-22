import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export const MenuScreen = () => {
  const handleShare = async () => {
    try {
      await Share.share({ message: 'Check out RailOne – book Indian Railways tickets! ??' });
    } catch {}
  };

  const menuItems: MenuItem[] = [
    { id: '1', label: 'Show/Hide Services', icon: 'grid-outline' },
    { id: '2', label: 'FAQs', icon: 'chatbox-outline' },
    { id: '3', label: 'Help & Support', icon: 'headset-outline' },
    { id: '4', label: 'About', icon: 'information-circle-outline' },
    { id: '5', label: 'Rate Us', icon: 'thumbs-up-outline' },
    { id: '6', label: 'Share', icon: 'share-social-outline', onPress: handleShare },
    { id: '7', label: 'Log Out', icon: 'log-out-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={52} color={colors.white} />
          </View>
          <Text style={styles.userName}>Shahrukh</Text>
        </View>

        {/* R-Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletLeft}>
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet-outline" size={22} color="#6366f1" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.walletLabel}>R-Wallet</Text>
              <Text style={styles.walletBalance}>? 0.00</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addMoneyBtn} activeOpacity={0.85}>
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Menu List */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuRow,
                idx < menuItems.length - 1 && styles.menuRowBorder,
              ]}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={24} color="#6366f1" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>V-2.1.62-231</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  /* Profile */
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 28,
    marginTop: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#38bdf8',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#38bdf8', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  userName: { fontSize: 20, fontWeight: '700', color: '#1e293b' },

  /* Wallet */
  walletCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ede9fe',
    borderRadius: 16, padding: 16,
    marginBottom: 14,
  },
  walletLeft: { flexDirection: 'row', alignItems: 'center' },
  walletIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#c4b5fd',
    justifyContent: 'center', alignItems: 'center',
  },
  walletLabel: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 2 },
  walletBalance: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  addMoneyBtn: {
    backgroundColor: '#0066ff', borderRadius: 24,
    paddingHorizontal: 22, paddingVertical: 12,
  },
  addMoneyText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  /* Menu */
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuIcon: { marginRight: 16 },
  menuLabel: { fontSize: 15, fontWeight: '500', color: '#1e293b' },

  version: {
    textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8,
  },
});

import React, { useEffect, useRef } from "react";
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TouchableWithoutFeedback, Animated, Dimensions, Share, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.86;

type Props = { visible: boolean; onClose: () => void; };
type MenuItem = { id: string; label: string; icon: keyof typeof Ionicons.glyphMap; onPress?: () => void; };

export const MenuDrawer = ({ visible, onClose }: Props) => {
  const { user, logout } = useAuth();
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }).start();
    } else {
      Animated.timing(translateX, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handleShare = async () => {
    try { await Share.share({ message: "Check out RailOne – book Indian Railways tickets! 🚂" }); } catch {}
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => { onClose(); await logout(); } },
    ]);
  };

  const menuItems: MenuItem[] = [
    { id: "1", label: "Show/Hide Services", icon: "grid-outline" },
    { id: "2", label: "FAQs", icon: "chatbox-outline" },
    { id: "3", label: "Help & Support", icon: "headset-outline" },
    { id: "4", label: "About", icon: "information-circle-outline" },
    { id: "5", label: "Rate Us", icon: "thumbs-up-outline" },
    { id: "6", label: "Share", icon: "share-social-outline", onPress: handleShare },
    { id: "7", label: "Log Out", icon: "log-out-outline", onPress: handleLogout },
  ];

  const firstName = user?.name?.split(" ")[0] || "User";
  const walletBalance = user?.wallet?.toFixed(2) || "0.00";

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={48} color="#ffffff" />
              </View>
              <Text style={styles.userName}>{firstName}</Text>
            </View>

            <View style={styles.walletCard}>
              <View style={styles.walletLeft}>
                <View style={styles.walletIconCircle}>
                  <Ionicons name="wallet-outline" size={20} color="#6366f1" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.walletLabel}>R-Wallet</Text>
                  <Text style={styles.walletBalance}>₹ {walletBalance}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.addMoneyBtn} activeOpacity={0.85}>
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuCard}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuRow, idx < menuItems.length - 1 && styles.menuRowBorder]}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon} size={24} color="#6366f1" style={styles.menuIcon} />
                  <Text style={[styles.menuLabel, item.id === "7" && { color: "#ef4444" }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.version}>V-2.1.62-231</Text>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" },
  drawer: {
    position: "absolute", top: 0, right: 0, bottom: 0, width: DRAWER_WIDTH,
    backgroundColor: "#ffffff", borderTopLeftRadius: 24, borderBottomLeftRadius: 24,
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 16, elevation: 16,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  profileCard: {
    alignItems: "center", backgroundColor: "#ffffff", borderRadius: 20,
    paddingVertical: 28, marginTop: 16, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: "#38bdf8",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  userName: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  walletCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#ede9fe", borderRadius: 16, padding: 16, marginBottom: 14,
  },
  walletLeft: { flexDirection: "row", alignItems: "center" },
  walletIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#c4b5fd", justifyContent: "center", alignItems: "center" },
  walletLabel: { fontSize: 12, color: "#64748b", fontWeight: "500", marginBottom: 2 },
  walletBalance: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  addMoneyBtn: { backgroundColor: "#0066ff", borderRadius: 24, paddingHorizontal: 20, paddingVertical: 11 },
  addMoneyText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  menuCard: {
    backgroundColor: "#ffffff", borderRadius: 16, marginBottom: 14,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: "hidden",
  },
  menuRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 18 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  menuIcon: { marginRight: 16 },
  menuLabel: { fontSize: 15, fontWeight: "500", color: "#1e293b" },
  version: { textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 8 },
});

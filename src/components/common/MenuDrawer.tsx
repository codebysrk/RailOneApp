import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Share,
  ScrollView,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "@/context/AuthContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export const MenuDrawer = ({ visible, onClose }: Props) => {
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.84, 360);
  const { user, logout } = useAuth();
  const translateX = useRef(new Animated.Value(drawerWidth)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 140,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: drawerWidth,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, drawerWidth]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out RailOne – Indian Railways Unreserved Ticket Booking! 🚂",
      });
    } catch {}
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          onClose();
          await logout();
        },
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    { id: "1", label: "Show/Hide Services", icon: "bookmark" },
    { id: "2", label: "FAQs", icon: "chatbubble-ellipses" },
    { id: "3", label: "Help & Support", icon: "headset" },
    { id: "4", label: "About", icon: "information-circle" },
    { id: "5", label: "Rate Us", icon: "thumbs-up" },
    { id: "6", label: "Share", icon: "share-social", onPress: handleShare },
    { id: "7", label: "Log Out", icon: "log-out", onPress: handleLogout },
  ];

  const userName = user?.name || "Passenger";
  const walletBalance = user?.wallet !== undefined ? user.wallet.toFixed(2) : "0.00";

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }] }]}>
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── 1. Top Profile Header Card ─────────────────────────── */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={50} color="#b8e6fe" />
              </View>
              <Text style={styles.userName}>{userName}</Text>
            </View>

            {/* ─── 2. R-Wallet Card ───────────────────────────────────── */}
            <View style={styles.walletCard}>
              <View style={styles.walletLeft}>
                <View style={styles.walletIconBox}>
                  <Ionicons name="wallet" size={24} color="#818cf8" />
                </View>
                <View style={styles.walletTextContainer}>
                  <Text style={styles.walletLabel}>R-Wallet</Text>
                  <Text style={styles.walletBalance}>₹ {walletBalance}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.addMoneyBtn} activeOpacity={0.85}>
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
            </View>

            {/* ─── 3. Menu Items List ─────────────────────────────────── */}
            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={`menu-drawer-${item.id}`}
                  style={styles.menuRow}
                  activeOpacity={0.65}
                  onPress={item.onPress}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color="#818cf8"
                    style={styles.menuIcon}
                  />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ─── 4. Footer Version ──────────────────────────────────── */}
            <Text style={styles.version}>V-2.1.62-231</Text>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },

  /* Profile Header */
  profileHeaderCard: {
    backgroundColor: "#eef2ff",
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 26,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#38bdf8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.2,
  },

  /* R-Wallet Card */
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eef2ff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  walletIconBox: {
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  walletTextContainer: {
    justifyContent: "center",
    flexShrink: 1,
  },
  walletLabel: {
    fontSize: 12.5,
    color: "#334155",
    fontWeight: "500",
    marginBottom: 1,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  addMoneyBtn: {
    backgroundColor: "#0066ff",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  addMoneyText: {
    color: "#ffffff",
    fontSize: 13.5,
    fontWeight: "700",
  },

  /* Menu List */
  menuList: {
    paddingHorizontal: 6,
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },
  menuIcon: {
    width: 32,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15.5,
    fontWeight: "600",
    color: "#1e293b",
    letterSpacing: -0.1,
  },

  /* Version */
  version: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    color: "#94a3b8",
    marginTop: 10,
  },
});

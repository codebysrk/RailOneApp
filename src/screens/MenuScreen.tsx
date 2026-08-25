import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { AppAlert } from "@/context/AlertContext";
import { UpdateService, ReleaseInfo } from "@/services";
import { UpdateModal, FocusAwareStatusBar } from "@/components/common";

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

export const MenuScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<ReleaseInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out RailOne – Indian Railways Unreserved Ticket Booking! 🚂",
      });
    } catch {}
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    const info = await UpdateService.checkForUpdate();
    setCheckingUpdate(false);

    if (info && info.updateAvailable) {
      setUpdateInfo(info);
      setShowUpdateModal(true);
    } else {
      AppAlert.show(
        "You're Up to Date! ✨",
        `You are running the latest version of RailOne (v${UpdateService.getCurrentVersion()}).`,
        undefined,
        "success"
      );
    }
  };

  const handleLogout = () => {
    AppAlert.show("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => logout() },
    ], "confirm");
  };

  const menuItems: MenuItem[] = [
    { id: "1", label: "Show/Hide Services", icon: "bookmark" },
    { id: "lang", label: "Select Language", icon: "language", onPress: () => navigation.navigate("Language") },
    { id: "2", label: "Check for Updates", icon: "cloud-download", onPress: handleCheckForUpdates },
    { id: "3", label: "FAQs", icon: "chatbubble-ellipses" },
    { id: "4", label: "Help & Support", icon: "headset" },
    { id: "5", label: "About", icon: "information-circle" },
    { id: "6", label: "Rate Us", icon: "thumbs-up" },
    { id: "7", label: "Share", icon: "share-social", onPress: handleShare },
    { id: "8", label: "Log Out", icon: "log-out", onPress: handleLogout },
  ];

  const userName = user?.name || "Passenger";
  const walletBalance = user?.wallet !== undefined ? user.wallet.toFixed(2) : "0.00";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <FocusAwareStatusBar backgroundColor="#ffffff" barStyle="dark-content" />
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
              key={`menu-screen-${item.id}`}
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
        <Text style={styles.version}>V-{UpdateService.getCurrentVersion()}</Text>
      </ScrollView>

      {/* OTA In-App Update Modal */}
      <UpdateModal
        visible={showUpdateModal}
        releaseInfo={updateInfo}
        onClose={() => setShowUpdateModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scroll: {
    paddingHorizontal: 10,
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
  },
  walletIconBox: {
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  walletTextContainer: {
    justifyContent: "center",
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

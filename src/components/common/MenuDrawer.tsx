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
import { useNavigation } from "@react-navigation/native";
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
      translateX.setValue(drawerWidth);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 140,
      }).start();
    }
  }, [visible, drawerWidth]);

  const handleClose = () => {
    Animated.timing(translateX, {
      toValue: drawerWidth,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

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
          handleClose();
          await logout();
        },
      },
    ]);
  };

  const navigation = useNavigation<any>();

  const menuItems: MenuItem[] = [
    { id: "1", label: "Show/Hide Services", icon: "bookmark" },
    {
      id: "lang",
      label: "Select Language",
      icon: "language",
      onPress: () => {
        handleClose();
        navigation.navigate("Language");
      },
    },
    { id: "2", label: "FAQs", icon: "chatbubble-ellipses" },
    { id: "3", label: "Help & Support", icon: "headset" },
    { id: "4", label: "About", icon: "information-circle" },
    { id: "5", label: "Rate Us", icon: "thumbs-up" },
    { id: "6", label: "Share", icon: "share-social", onPress: handleShare },
    { id: "7", label: "Log Out", icon: "log-out", onPress: handleLogout },
  ];

  const userName = user?.name || "Shahrukh";
  const walletBalance = user?.wallet !== undefined ? user.wallet.toFixed(2) : "0.00";

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }] }]}>
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          {/* Close Header Bar */}
          <View style={styles.drawerTopBar}>
            <TouchableOpacity
              style={styles.closeCircleBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#0066ff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── 1. Top Profile Header Card ─────────────────────────── */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={48} color="#b8e6fe" />
              </View>
              <Text style={styles.userName}>{userName}</Text>
            </View>

            {/* ─── 2. R-Wallet Card ───────────────────────────────────── */}
            <View style={styles.walletCard}>
              <View style={styles.walletLeft}>
                <View style={styles.walletIconBox}>
                  <Ionicons name="wallet" size={24} color="#22c55e" />
                </View>
                <View style={styles.walletTextContainer}>
                  <Text style={styles.walletLabel}>R-Wallet</Text>
                  <Text style={styles.walletBalance}>₹ {walletBalance}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.addMoneyBtn} activeOpacity={0.85} onPress={handleClose}>
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
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon} size={22} color="#0066ff" />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ─── 4. App Version ─────────────────────────────────────── */}
            <Text style={styles.version}>Version 1.0.0</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
  },
  drawerTopBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: 'flex-start',
  },
  closeCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 28,
  },

  /* Profile Header */
  profileHeaderCard: {
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#38bdf8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Montserrat_700Bold",
    color: "#0f172a",
  },

  /* R-Wallet Card */
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
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
    fontSize: 12,
    fontFamily: "Montserrat_500Medium",
    color: "#334155",
    marginBottom: 1,
  },
  walletBalance: {
    fontSize: 17,
    fontFamily: "Montserrat_700Bold",
    color: "#0f172a",
  },
  addMoneyBtn: {
    backgroundColor: "#0066ff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addMoneyText: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Montserrat_600SemiBold",
  },

  /* Menu List */
  menuList: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuIcon: {
    width: 32,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: "Montserrat_600SemiBold",
    color: "#1e293b",
  },

  /* Version */
  version: {
    textAlign: "center",
    fontSize: 12.5,
    fontFamily: "Montserrat_500Medium",
    color: "#94a3b8",
    marginTop: 10,
  },
});

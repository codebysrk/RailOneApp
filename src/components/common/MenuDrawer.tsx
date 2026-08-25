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
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { UpdateService } from "@/services";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const MenuDrawer = ({ visible, onClose }: Props) => {
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.84, 360);
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();

  // Start off-screen to the right
  const translateX = useRef(new Animated.Value(drawerWidth)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset to off-screen first, then animate in
      translateX.setValue(drawerWidth);
      opacity.setValue(0);
      const anim = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 25,
          stiffness: 180,
          mass: 0.8,
        }),
      ]);
      anim.start();
      return () => anim.stop();
    }
  }, [visible, drawerWidth, opacity, translateX]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: drawerWidth,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
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

  const userName = user?.name || "Passenger";
  const walletBalance =
    user?.wallet !== undefined ? user.wallet.toFixed(2) : "0.00";

  const showInfoAlert = (title: string, msg: string) => {
    handleClose();
    Alert.alert(title, msg);
  };

  const menuItems = [
    {
      id: "show-hide",
      label: "Show/Hide Services",
      icon: "bookmark" as const,
      onPress: () => showInfoAlert("Services", "All services are currently active."),
    },
    {
      id: "lang",
      label: "Select Language",
      icon: "language" as const,
      onPress: () => {
        handleClose();
        navigation.navigate("Language");
      },
    },
    {
      id: "faqs",
      label: "FAQs",
      icon: "chatbubble-ellipses" as const,
      onPress: () => showInfoAlert("FAQs", "Frequently asked questions and guides will be available in the next release."),
    },
    {
      id: "support",
      label: "Help & Support",
      icon: "headset" as const,
      onPress: () => showInfoAlert("Help & Support", "RailMadad helpline: Dial 139 for 24x7 Indian Railways passenger assistance."),
    },
    {
      id: "about",
      label: "About",
      icon: "information-circle" as const,
      onPress: () => showInfoAlert("About RailOne", `RailOne v${UpdateService.getCurrentVersion()}\nIndian Railways official mobile ticketing companion.`),
    },
    {
      id: "rate",
      label: "Rate Us",
      icon: "thumbs-up" as const,
      onPress: () => showInfoAlert("Rate Us", "Thank you for using RailOne! Rating options will open in Play Store."),
    },
    {
      id: "share",
      label: "Share",
      icon: "share-social" as const,
      onPress: handleShare,
    },
    {
      id: "logout",
      label: "Log Out",
      icon: "log-out" as const,
      onPress: handleLogout,
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
      statusBarTranslucent
    >
      {/* Dimmed backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity }]} />
      </TouchableWithoutFeedback>

      {/* Sliding drawer */}
      <Animated.View
        style={[
          styles.drawer,
          { width: drawerWidth, transform: [{ translateX }] },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ── Profile Card ────────────────────────────── */}
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={46} color="#ffffff" />
              </View>
              <Text style={styles.userName}>{userName}</Text>
            </View>

            {/* ── R-Wallet Card ───────────────────────────── */}
            <View style={styles.walletCard}>
              <View style={styles.walletLeft}>
                <View style={styles.walletIconWrap}>
                  <Ionicons name="wallet" size={22} color="#818cf8" />
                </View>
                <View>
                  <Text style={styles.walletLabel}>R-Wallet</Text>
                  <Text style={styles.walletBalance}>₹ {walletBalance}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addMoneyBtn}
                activeOpacity={0.82}
                onPress={() => {
                  handleClose();
                  navigation.navigate("ProfileTab");
                }}
              >
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
            </View>

            {/* ── Menu Items ──────────────────────────────── */}
            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuRow}
                  activeOpacity={0.6}
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

            {/* ── Version ─────────────────────────────────── */}
            <Text style={styles.version}>
              V-{UpdateService.getCurrentVersion()}
            </Text>
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
    backgroundColor: "rgba(0,0,0,0.4)",
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
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: -4, height: 0 },
    elevation: 24,
    overflow: "hidden",
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 32,
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 28,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#38bdf8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontFamily: "Montserrat_700Bold",
    color: "#0f172a",
  },

  /* Wallet Card */
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eef2ff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  walletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  walletLabel: {
    fontSize: 12,
    fontFamily: "Montserrat_500Medium",
    color: "#64748b",
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: 18,
    fontFamily: "Montserrat_700Bold",
    color: "#0f172a",
  },
  addMoneyBtn: {
    backgroundColor: "#0066ff",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  addMoneyText: {
    color: "#ffffff",
    fontSize: 13.5,
    fontFamily: "Montserrat_600SemiBold",
  },

  /* Menu List */
  menuList: {
    marginBottom: 10,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },
  menuIcon: {
    width: 36,
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 15.5,
    fontFamily: "Montserrat_600SemiBold",
    color: "#1e293b",
  },

  /* Version */
  version: {
    textAlign: "center",
    fontSize: 12.5,
    fontFamily: "Montserrat_500Medium",
    color: "#94a3b8",
    marginTop: 8,
  },
});

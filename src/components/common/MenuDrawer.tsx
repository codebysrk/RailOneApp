import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Share,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { AppAlert } from "@/context/AlertContext";
import { UpdateService } from "@/services";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PRESET_AMOUNTS = [500, 1000, 1500, 2000];

export const MenuDrawer = ({ visible, onClose }: Props) => {
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(width * 0.84, 360);
  const { user, logout, addWalletBalance } = useAuth();
  const navigation = useNavigation<any>();

  // Drawer Animation (slide from right)
  const translateX = useRef(new Animated.Value(drawerWidth)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Add Money Bottom Sheet State & Animations
  const [addMoneyVisible, setAddMoneyVisible] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const sheetTranslateY = useRef(new Animated.Value(350)).current;
  const sheetBackdropOpacity = useRef(new Animated.Value(0)).current;

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
    } else {
      setAddMoneyVisible(false);
    }
  }, [visible, drawerWidth, opacity, translateX]);

  const handleClose = () => {
    if (addMoneyVisible) {
      handleCloseAddMoney();
    }
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

  // Open Add Money Bottom Sheet
  const handleOpenAddMoney = () => {
    setAddAmount("");
    setAddMoneyVisible(true);
    sheetTranslateY.setValue(350);
    sheetBackdropOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(sheetBackdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 200,
        mass: 0.8,
      }),
    ]).start();
  };

  // Close Add Money Bottom Sheet
  const handleCloseAddMoney = () => {
    Animated.parallel([
      Animated.timing(sheetBackdropOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 350,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAddMoneyVisible(false);
    });
  };

  // Handle Add Funds submission
  const handleAddFunds = async () => {
    const num = parseFloat(addAmount);
    if (isNaN(num) || num <= 0) {
      AppAlert.show("Invalid Amount", "Please enter a valid amount to add.", undefined, "warning");
      return;
    }
    if (num > 10000) {
      AppAlert.show("Limit Exceeded", "Maximum top-up amount per transaction is ₹10,000.", undefined, "warning");
      return;
    }

    setIsAddingMoney(true);
    try {
      if (user?.uid) {
        await addWalletBalance(num, "Added via UPI / Card");
      }
      handleCloseAddMoney();
      AppAlert.show("Success", `₹${num.toFixed(2)} added to R-Wallet successfully!`, undefined, "success");
    } catch (err: any) {
      AppAlert.show("Failed", err?.message || "Could not add funds. Please try again.", undefined, "error");
    } finally {
      setIsAddingMoney(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out RailOne – Indian Railways Unreserved Ticket Booking! 🚂",
      });
    } catch {}
  };

  const handleLogout = () => {
    AppAlert.show("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          handleClose();
          await logout();
        },
      },
    ], "confirm");
  };

  const userName = user?.name || "Passenger";
  const walletBalance =
    user?.wallet !== undefined ? user.wallet.toFixed(2) : "0.00";

  const showInfoAlert = (title: string, msg: string) => {
    handleClose();
    AppAlert.show(title, msg, undefined, "info");
  };

  const menuItems = [
    {
      id: "show-hide",
      label: "Show/Hide Services",
      icon: "bookmark" as const,
      onPress: () => showInfoAlert("Services", "All services are currently active."),
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
          <View style={styles.content}>
            {/* Top section: Profile & Wallet */}
            <View>
              {/* ── Profile Card ────────────────────────────── */}
              <View style={styles.profileCard}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={42} color="#ffffff" />
                </View>
                <Text style={styles.userName}>{userName}</Text>
              </View>

              {/* ── R-Wallet Card ───────────────────────────── */}
              <View style={styles.walletCard}>
                <View style={styles.walletLeft}>
                  <View style={styles.walletIconWrap}>
                    <Ionicons name="wallet" size={20} color="#818cf8" />
                  </View>
                  <View>
                    <Text style={styles.walletLabel}>R-Wallet</Text>
                    <Text style={styles.walletBalance}>₹ {walletBalance}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addMoneyBtn}
                  activeOpacity={0.82}
                  onPress={handleOpenAddMoney}
                  accessibilityLabel="Add Money to R-Wallet"
                  accessibilityRole="button"
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
                      size={21}
                      color="#818cf8"
                      style={styles.menuIcon}
                    />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Version ─────────────────────────────────── */}
            <Text style={styles.version}>
              V-{UpdateService.getCurrentVersion()}
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ── Add Money Bottom Sheet Overlay ─────────────────── */}
      {addMoneyVisible && (
        <View style={styles.sheetModalContainer} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={handleCloseAddMoney}>
            <Animated.View
              style={[
                styles.sheetBackdrop,
                { opacity: sheetBackdropOpacity },
              ]}
            />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheetKeyboardAvoid}
          >
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: sheetTranslateY }],
                },
              ]}
            >
              {/* Bottom Sheet Title */}
              <Text style={styles.sheetTitle}>Add Money</Text>

              {/* Amount Input */}
              <TextInput
                style={styles.amountInput}
                placeholder="Enter Amount (₹)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={addAmount}
                onChangeText={setAddAmount}
                autoFocus
              />

              {/* Preset Amount Pills */}
              <View style={styles.pillsRow}>
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = addAmount === amt.toString();
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[
                        styles.presetPill,
                        isSelected && styles.presetPillActive,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => setAddAmount(amt.toString())}
                    >
                      <Text
                        style={[
                          styles.presetPillText,
                          isSelected && styles.presetPillTextActive,
                        ]}
                      >
                        +₹{amt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Notice / Disclaimer */}
              <View style={styles.noticeRow}>
                <Ionicons
                  name="information-circle"
                  size={18}
                  color="#859ab5"
                />
                <Text style={styles.noticeText}>
                  R-Wallet balance cannot be transferred or withdrawn
                </Text>
              </View>

              {/* Add Button */}
              <TouchableOpacity
                style={[
                  styles.sheetAddBtn,
                  isAddingMoney && { opacity: 0.75 },
                ]}
                activeOpacity={0.85}
                disabled={isAddingMoney}
                onPress={handleAddFunds}
              >
                {isAddingMoney ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.sheetAddBtnText}>Add</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      )}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    justifyContent: "space-between",
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: "#eef2ff",
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 18,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#1378b8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Montserrat_700Bold",
    color: "#0f2942",
  },

  /* Wallet Card */
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eef2ff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  walletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  walletLabel: {
    fontSize: 11,
    fontFamily: "Montserrat_500Medium",
    color: "#64748b",
  },
  walletBalance: {
    fontSize: 16,
    fontFamily: "Montserrat_700Bold",
    color: "#0f2942",
  },
  addMoneyBtn: {
    backgroundColor: "#0066ff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addMoneyText: {
    color: "#ffffff",
    fontSize: 12.5,
    fontFamily: "Montserrat_600SemiBold",
  },

  /* Menu List */
  menuList: {
    paddingHorizontal: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuIcon: {
    width: 32,
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 14.5,
    fontFamily: "Montserrat_600SemiBold",
    color: "#1e293b",
  },

  /* Version */
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Montserrat_500Medium",
    color: "#94a3b8",
    paddingVertical: 4,
  },

  /* ── Add Money Bottom Sheet Modal ────────────────────────────── */
  sheetModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 999,
  },
  sheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheetKeyboardAvoid: {
    width: "100%",
  },
  bottomSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: Platform.OS === "ios" ? 34 : 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Montserrat_700Bold",
    color: "#112b4e",
    marginBottom: 16,
  },
  amountInput: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#38bdf8",
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Montserrat_500Medium",
    color: "#0f2942",
    backgroundColor: "#ffffff",
    marginBottom: 14,
  },
  pillsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  presetPill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3,
  },
  presetPillActive: {
    borderColor: "#0066ff",
    backgroundColor: "#eff6ff",
  },
  presetPillText: {
    fontSize: 12.5,
    fontFamily: "Montserrat_600SemiBold",
    color: "#64748b",
  },
  presetPillTextActive: {
    color: "#0066ff",
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  noticeText: {
    fontSize: 11.5,
    fontFamily: "Montserrat_500Medium",
    color: "#5b708b",
    marginLeft: 8,
    flex: 1,
  },
  sheetAddBtn: {
    backgroundColor: "#0066ff",
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0066ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  sheetAddBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Montserrat_700Bold",
    letterSpacing: 0.3,
  },
});

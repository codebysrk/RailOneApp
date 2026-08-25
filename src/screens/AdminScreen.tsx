import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Share,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AppHeader, FocusAwareStatusBar } from "@/components/common";
import { FirebaseService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { AppAlert } from "@/context/AlertContext";
import { triggerHaptic } from "@/utils/haptics";

export const AdminScreen = () => {
  const navigation = useNavigation<any>();
  const { user: currentAdmin } = useAuth();

  const [tab, setTab] = useState<"create" | "users">("create");

  // Form State
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletAmount, setWalletAmount] = useState("250");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Success Created User Modal State
  const [createdUser, setCreatedUser] = useState<{
    name: string;
    email: string;
    mobile: string;
    password: string;
    wallet: number;
    role: string;
  } | null>(null);

  // User Directory State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toppingUpId, setToppingUpId] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "users") {
      fetchUsers();
    }
  }, [tab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const list = await FirebaseService.getAllUsers();
      setUsersList(list);
    } catch (err: any) {
      console.warn("Could not load users list:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const generateRandomPassword = () => {
    triggerHaptic("light");
    const prefixes = ["Rail", "Fast", "Express", "Track", "Super", "Ticket"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generated = `${randomPrefix}@${randomNum}`;
    setPassword(generated);
  };

  const handleCreateUser = async () => {
    triggerHaptic("medium");

    if (!name.trim() || !mobile.trim() || !email.trim() || !password.trim()) {
      AppAlert.show(
        "Missing Fields",
        "Please fill in all required user fields (Name, Mobile, Email, Password).",
        undefined,
        "warning"
      );
      return;
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      AppAlert.show(
        "Invalid Mobile",
        "Please enter a valid 10-digit mobile number.",
        undefined,
        "warning"
      );
      return;
    }

    if (password.length < 6) {
      AppAlert.show(
        "Weak Password",
        "Password must be at least 6 characters.",
        undefined,
        "warning"
      );
      return;
    }

    const initWallet = parseFloat(walletAmount) || 0;
    setSubmitting(true);

    try {
      await FirebaseService.createManagedUser(
        name.trim(),
        mobile.trim(),
        email.trim(),
        password,
        initWallet,
        role
      );

      triggerHaptic("success");
      setCreatedUser({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        wallet: initWallet,
        role,
      });

      // Clear Form
      setName("");
      setMobile("");
      setEmail("");
      setPassword("");
      setWalletAmount("250");
      setRole("user");
    } catch (err: any) {
      AppAlert.show("Creation Failed", err?.message || "Could not create user.", undefined, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareCredentials = async (cred: any) => {
    triggerHaptic("light");
    const shareMessage = `?? Welcome to RailOne!\n\nYour account credentials have been created:\n\n?? Name: ${cred.name}\n?? Mobile: ${cred.mobile}\n?? Email: ${cred.email}\n?? Password: ${cred.password}\n?? Initial Wallet: ?${cred.wallet.toFixed(2)}\n\nDownload and login into RailOne App to start booking unreserved train tickets instantly!`;

    try {
      await Share.share({
        message: shareMessage,
        title: "RailOne Account Credentials",
      });
    } catch {}
  };

  const handleTopUp = async (targetUser: any, amount: number) => {
    triggerHaptic("medium");
    setToppingUpId(targetUser.id);
    try {
      const newBal = await FirebaseService.topUpUserWallet(
        targetUser.id,
        amount,
        currentAdmin?.email || "Admin"
      );
      triggerHaptic("success");
      AppAlert.show(
        "Wallet Top-Up Successful! ??",
        `?${amount} has been added to ${targetUser.name}'s wallet. New balance: ?${newBal.toFixed(2)}`,
        undefined,
        "success"
      );
      // Update local list
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, wallet: newBal } : u))
      );
    } catch (err: any) {
      AppAlert.show("Top-Up Failed", err?.message || "Could not top-up wallet.", undefined, "error");
    } finally {
      setToppingUpId(null);
    }
  };

  const handleToggleUserStatus = (targetUser: any) => {
    triggerHaptic("medium");
    const newStatus = targetUser.status === "disabled" ? "active" : "disabled";
    const actionLabel = newStatus === "disabled" ? "Deactivate / Block" : "Activate";

    AppAlert.show(
      `${actionLabel} Account`,
      `Are you sure you want to change ${targetUser.name || targetUser.email}'s status to ${newStatus.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionLabel,
          style: newStatus === "disabled" ? "destructive" : "default",
          onPress: async () => {
            try {
              await FirebaseService.updateUserStatus(targetUser.id, newStatus);
              triggerHaptic("success");
              setUsersList((prev) =>
                prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
              );
              AppAlert.show("Status Updated", `User is now ${newStatus.toUpperCase()}.`, undefined, "success");
            } catch (err: any) {
              AppAlert.show("Update Failed", err?.message || "Could not update status.", undefined, "error");
            }
          },
        },
      ],
      "confirm"
    );
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.mobile?.includes(searchQuery)
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FocusAwareStatusBar backgroundColor="#0066ff" barStyle="light-content" />
      <AppHeader
        title="Admin Management"
        subtitle="Provision & Manage Accounts"
        variant="blue"
        onBack={() => navigation.goBack()}
      />

      {/* Mode Switcher Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "create" && styles.tabBtnActive]}
          onPress={() => {
            triggerHaptic("light");
            setTab("create");
          }}
          activeOpacity={0.8}
        >
          <Feather
            name="user-plus"
            size={18}
            color={tab === "create" ? "#0066ff" : "#64748b"}
          />
          <Text
            style={[
              styles.tabBtnText,
              tab === "create" && styles.tabBtnTextActive,
            ]}
          >
            Create User
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === "users" && styles.tabBtnActive]}
          onPress={() => {
            triggerHaptic("light");
            setTab("users");
          }}
          activeOpacity={0.8}
        >
          <Feather
            name="users"
            size={18}
            color={tab === "users" ? "#0066ff" : "#64748b"}
          />
          <Text
            style={[
              styles.tabBtnText,
              tab === "users" && styles.tabBtnTextActive,
            ]}
          >
            User Directory
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {tab === "create" ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Success Created User Card */}
            {createdUser && (
              <View style={styles.successBanner}>
                <View style={styles.successHeaderRow}>
                  <View style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.successTitle}>Account Created Successfully!</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setCreatedUser(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.credDetailsBox}>
                  <Text style={styles.credLine}>
                    <Text style={styles.credLabel}>Name: </Text>
                    {createdUser.name}
                  </Text>
                  <Text style={styles.credLine}>
                    <Text style={styles.credLabel}>Email: </Text>
                    {createdUser.email}
                  </Text>
                  <Text style={styles.credLine}>
                    <Text style={styles.credLabel}>Password: </Text>
                    <Text style={styles.credPassword}>{createdUser.password}</Text>
                  </Text>
                  <Text style={styles.credLine}>
                    <Text style={styles.credLabel}>Initial Wallet: </Text>
                    ?{createdUser.wallet.toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => handleShareCredentials(createdUser)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social-outline" size={18} color="#ffffff" />
                  <Text style={styles.shareBtnText}>Share Credentials on WhatsApp / SMS</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>New Account Details</Text>
              <Text style={styles.sectionSubtitle}>
                Generate user login credentials and provision their digital wallet
              </Text>

              {/* Full Name */}
              <Text style={styles.inputTitle}>Full Name *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              {/* Mobile Number */}
              <Text style={styles.inputTitle}>Mobile Number *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* Email Address */}
              <Text style={styles.inputTitle}>Email Address *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. user@railone.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password with Generator */}
              <View style={styles.labelRow}>
                <Text style={styles.inputTitle}>Password *</Text>
                <TouchableOpacity onPress={generateRandomPassword} activeOpacity={0.7}>
                  <Text style={styles.autoGenText}>?? Auto-Generate</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={19} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={19}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              {/* Initial Wallet Balance */}
              <Text style={styles.inputTitle}>Initial Welcome Bonus (?)</Text>
              <View style={styles.walletPillRow}>
                {["100", "250", "500", "1000"].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.walletPill,
                      walletAmount === amt && styles.walletPillActive,
                    ]}
                    onPress={() => {
                      triggerHaptic("light");
                      setWalletAmount(amt);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.walletPillText,
                        walletAmount === amt && styles.walletPillTextActive,
                      ]}
                    >
                      ?{amt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Account Role */}
              <Text style={styles.inputTitle}>Account Role</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === "user" && styles.roleBtnActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setRole("user");
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="person"
                    size={16}
                    color={role === "user" ? "#0066ff" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.roleBtnText,
                      role === "user" && styles.roleBtnTextActive,
                    ]}
                  >
                    Passenger / User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleBtn, role === "admin" && styles.roleBtnActive]}
                  onPress={() => {
                    triggerHaptic("light");
                    setRole("admin");
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="shield-crown"
                    size={18}
                    color={role === "admin" ? "#0066ff" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.roleBtnText,
                      role === "admin" && styles.roleBtnTextActive,
                    ]}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.75 }]}
                onPress={handleCreateUser}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={19} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Create & Provision Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.usersContainer}>
            {/* Search Box */}
            <View style={styles.searchCard}>
              <Ionicons name="search-outline" size={20} color="#94a3b8" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by name, email, or mobile..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {loadingUsers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066ff" />
                <Text style={styles.loadingText}>Fetching registered users...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.usersList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="users" size={48} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No users found</Text>
                    <Text style={styles.emptySubtitle}>
                      {searchQuery ? "Try searching with a different term." : "Create your first user above."}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <View style={styles.userCardHeader}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                          {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={styles.userName} numberOfLines={1}>
                            {item.name || "Unnamed User"}
                          </Text>
                          {item.role === "admin" && (
                            <View style={styles.adminBadge}>
                              <Text style={styles.adminBadgeText}>ADMIN</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.userEmail} numberOfLines={1}>
                          {item.email || "No email"}
                        </Text>
                        {item.mobile ? (
                          <Text style={styles.userMobile}>?? {item.mobile}</Text>
                        ) : null}
                      </View>

                      {/* Wallet Balance Display */}
                      <View style={styles.walletBox}>
                        <Text style={styles.walletLabel}>WALLET</Text>
                        <Text style={styles.walletValue}>
                          ?{(item.wallet || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* Actions Row */}
                    <View style={styles.topUpRow}>
                      <TouchableOpacity
                        style={[
                          styles.statusToggleBtn,
                          item.status === "disabled" ? styles.statusActivateBtn : styles.statusDeactivateBtn,
                        ]}
                        onPress={() => handleToggleUserStatus(item)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.statusToggleText,
                            item.status === "disabled" ? styles.statusActivateText : styles.statusDeactivateText,
                          ]}
                        >
                          {item.status === "disabled" ? "🟢 Activate" : "🔴 Deactivate"}
                        </Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={styles.topUpLabel}>Top-Up:</Text>
                        <TouchableOpacity
                          style={styles.topUpChip}
                          onPress={() => handleTopUp(item, 100)}
                          disabled={toppingUpId === item.id}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.topUpChipText}>+ ₹100</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.topUpChip}
                          onPress={() => handleTopUp(item, 500)}
                          disabled={toppingUpId === item.id}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.topUpChipText}>+ ₹500</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f9fd",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    marginHorizontal: 4,
  },
  tabBtnActive: {
    backgroundColor: "#eff6ff",
    borderWidth: 1.2,
    borderColor: "#bfdbfe",
  },
  tabBtnText: {
    fontSize: 13.5,
    fontFamily: "Montserrat_600SemiBold",
    color: "#64748b",
    marginLeft: 8,
  },
  tabBtnTextActive: {
    color: "#0066ff",
    fontFamily: "Montserrat_700Bold",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  successBanner: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#86efac",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  successHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 14.5,
    fontFamily: "Montserrat_700Bold",
    color: "#15803d",
    marginLeft: 8,
  },
  credDetailsBox: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  credLine: {
    fontSize: 13.5,
    fontFamily: "Montserrat_500Medium",
    color: "#1e293b",
    marginBottom: 4,
  },
  credLabel: {
    fontFamily: "Montserrat_700Bold",
    color: "#64748b",
  },
  credPassword: {
    fontFamily: "Montserrat_700Bold",
    color: "#0066ff",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareBtnText: {
    fontSize: 13.5,
    fontFamily: "Montserrat_700Bold",
    color: "#ffffff",
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Montserrat_700Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    fontFamily: "Montserrat_400Regular",
    color: "#64748b",
    marginBottom: 20,
  },
  inputTitle: {
    fontSize: 13,
    fontFamily: "Montserrat_600SemiBold",
    color: "#334155",
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  autoGenText: {
    fontSize: 12.5,
    fontFamily: "Montserrat_700Bold",
    color: "#0066ff",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.2,
    borderColor: "#cbd5e1",
    borderRadius: 11,
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Montserrat_500Medium",
    color: "#0f172a",
  },
  eyeBtn: {
    padding: 6,
  },
  walletPillRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  walletPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    paddingVertical: 9,
    borderRadius: 9,
    marginRight: 8,
    borderWidth: 1.2,
    borderColor: "#e2e8f0",
  },
  walletPillActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#0066ff",
  },
  walletPillText: {
    fontSize: 13,
    fontFamily: "Montserrat_600SemiBold",
    color: "#475569",
  },
  walletPillTextActive: {
    color: "#0066ff",
    fontFamily: "Montserrat_700Bold",
  },
  roleRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: "#cbd5e1",
    marginRight: 8,
  },
  roleBtnActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#0066ff",
  },
  roleBtnText: {
    fontSize: 12.5,
    fontFamily: "Montserrat_600SemiBold",
    color: "#64748b",
    marginLeft: 6,
  },
  roleBtnTextActive: {
    color: "#0066ff",
    fontFamily: "Montserrat_700Bold",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0066ff",
    borderRadius: 12,
    height: 50,
    shadowColor: "#0066ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: "Montserrat_700Bold",
    color: "#ffffff",
  },
  usersContainer: {
    flex: 1,
    padding: 16,
  },
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1.2,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: "Montserrat_500Medium",
    color: "#0f172a",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 13.5,
    fontFamily: "Montserrat_500Medium",
    color: "#64748b",
    marginTop: 12,
  },
  usersList: {
    paddingBottom: 30,
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Montserrat_700Bold",
    color: "#4338ca",
  },
  userName: {
    fontSize: 14.5,
    fontFamily: "Montserrat_700Bold",
    color: "#0f172a",
    maxWidth: 160,
  },
  adminBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 6,
  },
  adminBadgeText: {
    fontSize: 9.5,
    fontFamily: "Montserrat_700Bold",
    color: "#b45309",
  },
  userEmail: {
    fontSize: 12.5,
    fontFamily: "Montserrat_400Regular",
    color: "#64748b",
    marginTop: 1,
  },
  userMobile: {
    fontSize: 12,
    fontFamily: "Montserrat_500Medium",
    color: "#475569",
    marginTop: 2,
  },
  walletBox: {
    alignItems: "flex-end",
  },
  walletLabel: {
    fontSize: 10,
    fontFamily: "Montserrat_700Bold",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  walletValue: {
    fontSize: 15,
    fontFamily: "Montserrat_700Bold",
    color: "#16a34a",
    marginTop: 2,
  },
  topUpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusActivateBtn: {
    backgroundColor: "#dcfce7",
  },
  statusDeactivateBtn: {
    backgroundColor: "#fee2e2",
  },
  statusToggleText: {
    fontSize: 11.5,
    fontFamily: "Montserrat_700Bold",
  },
  statusActivateText: {
    color: "#15803d",
  },
  statusDeactivateText: {
    color: "#b91c1c",
  },
  topUpLabel: {
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
    color: "#64748b",
    marginRight: 6,
  },
  topUpChip: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  topUpChipText: {
    fontSize: 12,
    fontFamily: "Montserrat_700Bold",
    color: "#0066ff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Montserrat_700Bold",
    color: "#64748b",
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Montserrat_400Regular",
    color: "#94a3b8",
    marginTop: 4,
  },
});

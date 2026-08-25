import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { AppAlert } from "@/context/AlertContext";
import { StorageService } from "@/services";
import { FocusAwareStatusBar } from "@/components/common";

export const LoginScreen = () => {
  const { login } = useAuth();

  const [lastUserName, setLastUserName] = useState<string>("");

  // Form Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    // Attempt to load last logged in user name if available
    const loadLastUser = async () => {
      try {
        const saved = await StorageService.getLastUserEmail();
        if (saved?.name) {
          setLastUserName(saved.name);
        }
        if (saved?.email) {
          setEmail(saved.email);
        }
      } catch {}
    };
    loadLastUser();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      AppAlert.show(
        "Required Fields",
        "Please enter your email and password.",
        undefined,
        "warning"
      );
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      // Save last email
      await StorageService.setLastUserEmail({ email: email.trim(), name: lastUserName });
    } catch (e: any) {
      let msg = e?.message || "Something went wrong.";
      const code = e?.code || "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        msg = "Invalid email or password.";
      } else if (code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (code === "auth/network-request-failed") {
        msg = "Network error. Please check your internet connection.";
      } else {
        msg = msg
          .replace(/Firebase:\s*/i, "")
          .replace(/\[.*?\]\s*/, "")
          .replace(/\(auth\/.*?\)\.?/, "")
          .trim();
      }
      AppAlert.show("Login Failed", msg, undefined, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDifferentUser = () => {
    setEmail("");
    setPassword("");
    setLastUserName("");
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      AppAlert.show(
        "Reset Password",
        "Please enter your email address in the field above to receive a reset link.",
        undefined,
        "info"
      );
      return;
    }
    AppAlert.show(
      "Password Reset",
      `A password reset link will be sent to ${email.trim()}.`,
      undefined,
      "info"
    );
  };

  const handleResetPassword = () => {
    if (!email.trim()) {
      AppAlert.show(
        "Reset Password",
        "Please enter your registered email address first.",
        undefined,
        "warning"
      );
      return;
    }
    AppAlert.show(
      "Verification Sent",
      `Password reset instructions have been forwarded to ${email.trim()}.`,
      undefined,
      "success"
    );
  };

  const handleBiometricLogin = async () => {
    AppAlert.show(
      "Biometric Authentication",
      "Scan fingerprint or Face ID to instantly sign in.",
      undefined,
      "info"
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FocusAwareStatusBar backgroundColor="#f4f9fd" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── 1. Top Brand Logo ────────────────────────────────────── */}
          <View style={styles.topLogoContainer}>
            <Image
              source={require("../../assets/images/railone-logo.webp")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>

          {/* ─── 2. Main Headings ─────────────────────────────────────── */}
          <View style={styles.headerSection}>
            <Text style={styles.titleText}>
              Login using Email & Password
            </Text>

            <Text style={styles.welcomeText}>
              {lastUserName ? `Welcome ${lastUserName}!` : "Welcome to RailOne!"}
            </Text>

            <Text style={styles.subSubtitleText}>
              Enter your email and password below
            </Text>
          </View>

          {/* ─── 3. Form Input Fields ─────────────────────────────────── */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputCard}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputLeadingIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputCard}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#94a3b8"
                style={styles.inputLeadingIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.trailingIconBtn}
                onPress={() => setShowPass(!showPass)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {/* ─── 4. Forgot / Reset Password Row ────────────────────── */}
            <View style={styles.linksRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleForgotPassword}
              >
                <Text style={styles.linkTextLeft}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResetPassword}
              >
                <Text style={styles.linkTextRight}>Reset Password?</Text>
              </TouchableOpacity>
            </View>

            {/* ─── 5. Or Login using Biometric Divider ────────────────── */}
            <View style={styles.dividerRow}>
              <View style={styles.dashedLine} />
              <Text style={styles.dividerText}>Or login using biometric</Text>
              <View style={styles.dashedLine} />
            </View>

            {/* ─── 6. Action Row (Biometrics on Left, Login Button on Right) ── */}
            <View style={styles.actionRow}>
              <View style={styles.biometricsGroup}>
                {/* Face ID / Scan Icon */}
                <TouchableOpacity
                  style={styles.biometricIconBtn}
                  activeOpacity={0.75}
                  onPress={handleBiometricLogin}
                >
                  <MaterialCommunityIcons
                    name="face-recognition"
                    size={28}
                    color="#64748b"
                  />
                </TouchableOpacity>

                {/* Fingerprint Icon */}
                <TouchableOpacity
                  style={styles.biometricIconBtn}
                  activeOpacity={0.75}
                  onPress={handleBiometricLogin}
                >
                  <Ionicons
                    name="finger-print-outline"
                    size={32}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginBtn,
                  loading && { opacity: 0.75 },
                ]}
                activeOpacity={0.85}
                disabled={loading}
                onPress={handleLogin}
              >
                {loading ? (
                  <ActivityIndicator color="#0066ff" size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ─── 7. Bottom Section ──────────────────────────────────── */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleDifferentUser}
                style={styles.differentUserBtn}
              >
                <Text style={styles.differentUserText}>Different User?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f9fd",
  },
  keyboardContainer: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 36,
    justifyContent: "space-between",
  },

  /* 1. Top Logo */
  topLogoContainer: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 10,
  },
  brandLogo: {
    width: 140,
    height: 38,
  },

  /* 2. Header Section */
  headerSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  titleText: {
    fontSize: 20,
    fontFamily: "Montserrat_700Bold",
    color: "#1e3a5f",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  welcomeText: {
    fontSize: 14.5,
    fontFamily: "Montserrat_500Medium",
    color: "#5b6b80",
    textAlign: "center",
    marginBottom: 14,
  },
  subSubtitleText: {
    fontSize: 13.5,
    fontFamily: "Montserrat_400Regular",
    color: "#6b7a90",
    textAlign: "center",
  },

  /* 3. Form Container */
  formContainer: {
    width: "100%",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#b6e0fe",
    height: 52,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: "#0066ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 14.5,
    fontFamily: "Montserrat_500Medium",
    color: "#1e293b",
  },
  trailingIconBtn: {
    padding: 6,
    marginLeft: 4,
  },

  /* 4. Links Row */
  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 36,
    paddingHorizontal: 2,
  },
  linkTextLeft: {
    fontSize: 13,
    fontFamily: "Montserrat_700Bold",
    color: "#0a3672",
  },
  linkTextRight: {
    fontSize: 13,
    fontFamily: "Montserrat_700Bold",
    color: "#0a3672",
  },

  /* 5. Biometric Divider */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
  },
  dividerText: {
    fontSize: 12.5,
    fontFamily: "Montserrat_600SemiBold",
    color: "#64748b",
    marginHorizontal: 12,
  },

  /* 6. Action Row */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 44,
  },
  biometricsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  biometricIconBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtn: {
    minWidth: 110,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e3effb",
    borderWidth: 1.2,
    borderColor: "#60a5fa",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  loginBtnText: {
    fontSize: 15,
    fontFamily: "Montserrat_600SemiBold",
    color: "#0066ff",
  },

  /* 7. Bottom Section */
  bottomSection: {
    alignItems: "center",
    marginTop: 10,
  },
  differentUserBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  differentUserText: {
    fontSize: 15,
    fontFamily: "Montserrat_700Bold",
    color: "#0a3672",
    letterSpacing: -0.1,
  },
  switchModeBtn: {
    marginTop: 12,
    paddingVertical: 6,
  },
  switchModeText: {
    fontSize: 12.5,
    fontFamily: "Montserrat_500Medium",
    color: "#64748b",
  },
  switchModeBold: {
    fontFamily: "Montserrat_700Bold",
    color: "#0066ff",
  },
});

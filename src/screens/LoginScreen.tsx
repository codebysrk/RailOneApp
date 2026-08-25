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
  const { login, register } = useAuth();

  // Mode: "login" | "register" | "forgot" | "reset"
  const [mode, setMode] = useState<"login" | "register">("login");
  const [lastUserName, setLastUserName] = useState<string>("Shahrukh");

  // Form Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

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

  const handleRegister = async () => {
    if (!name.trim() || !mobile.trim() || !email.trim() || !password.trim()) {
      AppAlert.show(
        "Required Fields",
        "Please fill in all registration fields.",
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

    setLoading(true);
    try {
      await register(name.trim(), mobile.trim(), email.trim(), password);
      await StorageService.setLastUserEmail({ email: email.trim(), name: name.trim() });
    } catch (e: any) {
      let msg = e?.message || "Registration failed.";
      const code = e?.code || "";
      if (code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please login instead.";
      }
      AppAlert.show("Registration Failed", msg, undefined, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    AppAlert.show(
      "Biometric Login",
      "Touch your fingerprint sensor or look at the camera to login with biometrics.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Authenticate",
          style: "default",
          onPress: () => {
            if (email && password) {
              handleLogin();
            } else {
              AppAlert.show(
                "Biometrics Configured",
                "Please perform email/password login first to bind biometrics to your session.",
                undefined,
                "info"
              );
            }
          },
        },
      ],
      "info"
    );
  };

  const handleForgotPassword = () => {
    AppAlert.show(
      "Forgot Password?",
      "A password recovery link can be sent to your registered email address.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Link",
          onPress: () => {
            AppAlert.show(
              "Reset Link Sent",
              "If the account exists, password recovery instructions have been sent to your email.",
              undefined,
              "success"
            );
          },
        },
      ],
      "info"
    );
  };

  const handleResetPassword = () => {
    AppAlert.show(
      "Reset Password?",
      "Would you like to reset your credentials using OTP or registered email?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          onPress: () => {
            AppAlert.show(
              "OTP Sent",
              "A 6-digit verification code has been sent to your registered contact.",
              undefined,
              "info"
            );
          },
        },
      ],
      "info"
    );
  };

  const handleDifferentUser = () => {
    setEmail("");
    setPassword("");
    setLastUserName("User");
    AppAlert.show(
      "Switch Account",
      "Credentials cleared. Please enter email and password for the other account.",
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
              source={require("../../assets/images/brand-logo.webp")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>

          {/* ─── 2. Main Headings ─────────────────────────────────────── */}
          <View style={styles.headerSection}>
            <Text style={styles.titleText}>
              {mode === "login"
                ? "Login using Email & Password"
                : "Create your RailOne Account"}
            </Text>

            <Text style={styles.welcomeText}>
              {mode === "login"
                ? `Welcome ${lastUserName}!`
                : "Join Indian Railways UTS"}
            </Text>

            <Text style={styles.subSubtitleText}>
              {mode === "login"
                ? "Enter your email and password below"
                : "Fill in your personal details to get started"}
            </Text>
          </View>

          {/* ─── 3. Form Input Fields ─────────────────────────────────── */}
          <View style={styles.formContainer}>
            {mode === "register" && (
              <>
                {/* Full Name Input */}
                <View style={styles.inputCard}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#94a3b8"
                    style={styles.inputLeadingIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                {/* Mobile Number Input */}
                <View style={styles.inputCard}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#94a3b8"
                    style={styles.inputLeadingIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mobile Number"
                    placeholderTextColor="#94a3b8"
                    value={mobile}
                    onChangeText={setMobile}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </>
            )}

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
            {mode === "login" ? (
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
            ) : null}

            {/* ─── 5. Or Login using Biometric Divider ────────────────── */}
            {mode === "login" && (
              <View style={styles.dividerRow}>
                <View style={styles.dashedLine} />
                <Text style={styles.dividerText}>Or login using biometric</Text>
                <View style={styles.dashedLine} />
              </View>
            )}

            {/* ─── 6. Action Row (Biometrics on Left, Login Button on Right) ── */}
            <View style={styles.actionRow}>
              {mode === "login" ? (
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
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {/* Login / Register Button */}
              <TouchableOpacity
                style={[
                  styles.loginBtn,
                  loading && { opacity: 0.75 },
                  mode === "register" && { flex: 1 },
                ]}
                activeOpacity={0.85}
                disabled={loading}
                onPress={mode === "login" ? handleLogin : handleRegister}
              >
                {loading ? (
                  <ActivityIndicator color="#0066ff" size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>
                    {mode === "login" ? "Login" : "Register"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ─── 7. Bottom Switch / Different User Link ─────────────── */}
            <View style={styles.bottomSection}>
              {mode === "login" ? (
                <>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={handleDifferentUser}
                    style={styles.differentUserBtn}
                  >
                    <Text style={styles.differentUserText}>
                      Different User?
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setMode("register")}
                    style={styles.switchModeBtn}
                  >
                    <Text style={styles.switchModeText}>
                      Don't have an account?{" "}
                      <Text style={styles.switchModeBold}>Create Account</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setMode("login")}
                  style={styles.switchModeBtn}
                >
                  <Text style={styles.switchModeText}>
                    Already have an account?{" "}
                    <Text style={styles.switchModeBold}>Login</Text>
                  </Text>
                </TouchableOpacity>
              )}
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

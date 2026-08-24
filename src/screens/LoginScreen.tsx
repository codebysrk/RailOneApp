import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { FocusAwareStatusBar } from '@/components/common';

type Tab = "login" | "register";

export const LoginScreen = () => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }
    if (tab === "register" && (!name.trim() || !mobile.trim())) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), mobile.trim(), email.trim(), password);
      }
    } catch (e: any) {
      let msg = e?.message || "Something went wrong.";
      const code = e?.code || "";
      if (code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please login instead.";
      } else if (code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        msg = "Invalid email or password.";
      } else if (code === "auth/network-request-failed") {
        msg = "Network error. Please check your internet connection.";
      } else {
        msg = msg.replace(/Firebase:\s*/i, "").replace(/\[.*?\]\s*/, "").replace(/\(auth\/.*?\)\.?/, "").trim();
      }
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FocusAwareStatusBar backgroundColor="#f8faff" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo area */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Ionicons name="train" size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>RailOne</Text>
            <Text style={styles.tagline}>Book Indian Railways Tickets</Text>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "login" && styles.tabActive]}
              onPress={() => setTab("login")}
            >
              <Text style={[styles.tabText, tab === "login" && styles.tabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "register" && styles.tabActive]}
              onPress={() => setTab("register")}
            >
              <Text style={[styles.tabText, tab === "register" && styles.tabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {tab === "register" && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile"
                  placeholderTextColor="#94a3b8"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </>
            )}

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Min 6 characters"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {tab === "login" ? "Login" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setTab(tab === "login" ? "register" : "login")}>
              <Text style={styles.switchText}>
                {tab === "login"
                  ? "New user? Create an account"
                  : "Already have an account? Login"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8faff" },
  keyboardContainer: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 10, paddingBottom: 40 },

  logoArea: { alignItems: "center", paddingTop: 48, marginBottom: 32 },
  logoCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: "#0066ff",
    justifyContent: "center", alignItems: "center",
    marginBottom: 14,
    shadowColor: "#0066ff", shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  appName: { fontSize: 28, fontWeight: "800", color: "#1e293b", letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: "#64748b", marginTop: 4 },

  tabRow: {
    flexDirection: "row", backgroundColor: "#e2e8f0",
    borderRadius: 12, padding: 4, marginBottom: 28,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#0066ff" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#fff" },

  form: {},
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1,
    borderColor: "#e2e8f0", paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: "#1e293b", marginBottom: 4,
  },
  passRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  eyeBtn: { padding: 12, marginLeft: 4 },

  submitBtn: {
    backgroundColor: "#0066ff", borderRadius: 14,
    paddingVertical: 16, alignItems: "center",
    marginTop: 24, marginBottom: 16,
    shadowColor: "#0066ff", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  switchText: { textAlign: "center", fontSize: 13, color: "#0066ff", fontWeight: "600" },
});

// app/(auth)/login.tsx

import {
  BorderRadius,
  Colors,
  FontFamily,
  Shadow,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.message || "Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>ENGITRIAD</Text>
            <Text style={styles.brandSubtitle}>
              Multi-Domain Engineering Hub
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.pillInput}
                placeholder="engineer@domain.com"
                placeholderTextColor={Colors.textPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.pillInput}
                placeholder="••••••••"
                placeholderTextColor={Colors.textPlaceholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Forgot password link */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              style={styles.forgotWrapper}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textOnPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>SIGN IN</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>New to the platform? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.footerLink}>Create an Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  brandContainer: { alignItems: "center", marginBottom: Spacing.xxl },
  brandTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 38,
    color: Colors.primary,
    textAlign: "center",
    letterSpacing: 3,
  },
  brandSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.tagline,
    textAlign: "center",
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
    letterSpacing: 1,
  },
  pillInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.textInput,
  },
  forgotWrapper: { alignSelf: "flex-end", marginTop: 4, marginBottom: 8 },
  forgotText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.primary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: Spacing.md,
    ...Shadow.button,
  },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    color: Colors.textOnPrimary,
    fontSize: 16,
    letterSpacing: 1,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  footerText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textMuted,
  },
  footerLink: {
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    fontSize: 14,
  },
});

// app/(auth)/login.tsx

import { BorderRadius, Colors, FontFamily, Shadow, Spacing } from '@/constants/theme';
import { auth } from '@/services/firebase';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type AuthTab = 'login' | 'signup';

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // The AuthContext listener in _layout.tsx will also catch this, 
      // but explicitly routing provides immediate feedback.
      router.replace('/(tabs)/departments');
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'signup') {
      router.push('/(auth)/signup');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>ENGITRIAD</Text>
            <Text style={styles.tagline}>THE POWER OF THREE. APPLIED</Text>
          </View>

          {/* ── Spacer ── */}
          <View style={styles.spacer} />

          {/* ── Tab Toggle ── */}
          <View style={styles.togglePill}>
            <TouchableOpacity
              style={[styles.toggleTab, activeTab === 'login' && styles.toggleTabActive]}
              onPress={() => handleTabSwitch('login')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.toggleTabText,
                  activeTab === 'login'
                    ? styles.toggleTabTextActive
                    : styles.toggleTabTextInactive,
                ]}
              >
                log in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleTab, activeTab === 'signup' && styles.toggleTabActive]}
              onPress={() => handleTabSwitch('signup')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.toggleTabText,
                  activeTab === 'signup'
                    ? styles.toggleTabTextActive
                    : styles.toggleTabTextInactive,
                ]}
              >
                sign up
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder=""
                placeholderTextColor={Colors.textPlaceholder}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder=""
                placeholderTextColor={Colors.textPlaceholder}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotWrapper}
            >
              <Text style={styles.forgotText}>Forgot password</Text>
            </TouchableOpacity>

            {/* Error message */}
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* ── Login Button ── */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textOnPrimary} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  appTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 36,
    letterSpacing: 4,
    color: Colors.text,
  },
  tagline: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.tagline,
    marginTop: Spacing.xs,
  },

  spacer: {
    height: 60,
  },

  // ── Toggle ──
  togglePill: {
    flexDirection: 'row',
    backgroundColor: Colors.toggleBackground,
    borderRadius: BorderRadius.pill,
    padding: 4,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
  },
  toggleTabActive: {
    backgroundColor: Colors.toggleActive,
    ...Shadow.button,
  },
  toggleTabText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
  },
  toggleTabTextActive: {
    color: Colors.toggleActiveText,
  },
  toggleTabTextInactive: {
    color: Colors.toggleInactiveText,
  },

  // ── Form ──
  form: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
    marginLeft: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.pill,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: Colors.textInput,
  },

  // ── Forgot Password ──
  forgotWrapper: {
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  forgotText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.primary,
  },

  // ── Error ──
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.error,
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
  },

  // ── Login Button ──
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    minWidth: 150,
    ...Shadow.button,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },
});
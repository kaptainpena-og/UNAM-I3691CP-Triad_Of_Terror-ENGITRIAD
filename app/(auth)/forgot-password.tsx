// app/(auth)/forgot-password.tsx

import { BorderRadius, Colors, FontFamily, Shadow, Spacing } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // TODO: call Firebase sendPasswordResetEmail(auth, email) here
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>ENGITRIAD</Text>
          <Text style={styles.tagline}>THE POWER OF THREE. APPLIED</Text>
        </View>

        <View style={styles.spacer} />

        {/* ── Card content ── */}
        <View style={styles.content}>
          <Text style={styles.screenTitle}>Reset Password</Text>
          <Text style={styles.description}>
            Enter the email address linked to your account and we'll send you a reset link.
          </Text>

          {sent ? (
            /* ── Success state ── */
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Reset link sent! Check your inbox and follow the instructions.
              </Text>
            </View>
          ) : (
            /* ── Form state ── */
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder=""
                  placeholderTextColor={Colors.textPlaceholder}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="done"
                  onSubmitEditing={handleSendReset}
                />
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.resetButton, loading && styles.buttonDisabled]}
                onPress={handleSendReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textOnPrimary} />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── Back to login ── */}
          <TouchableOpacity
            style={styles.backWrapper}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>Return to login</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

  // ── Content ──
  content: {
    width: '100%',
  },
  screenTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  // ── Input ──
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

  // ── Error ──
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.error,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },

  // ── Reset button ──
  resetButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.button,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },

  // ── Success box ──
  successBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: Spacing.xl,
  },
  successText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },

  // ── Back link ──
  backWrapper: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  backText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.primary,
  },
});
// app/(auth)/signup.tsx

import { BorderRadius, Colors, FontFamily, Shadow, Spacing } from '@/constants/theme';
import { auth, db } from '@/services/firebase';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type AuthTab = 'login' | 'signup';

export default function SignupScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabSwitch = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'login') {
      router.push('/(auth)/login');
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Create the user profile in Firestore according to the SRS schema
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: name.trim(),
        email: email.trim(),
        role: 'student', // Defaulting role as per schema, can be updated in-app later
        domain: 'general', // Defaulting domain
        createdAt: serverTimestamp()
      });

      router.replace('/(tabs)/departments');
    } catch (e: any) {
      setError(e.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder=""
                placeholderTextColor={Colors.textPlaceholder}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder=""
                placeholderTextColor={Colors.textPlaceholder}
                secureTextEntry
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder=""
                placeholderTextColor={Colors.textPlaceholder}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
            </View>

            {/* Error message */}
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* ── Sign Up Button ── */}
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textOnPrimary} />
            ) : (
              <Text style={styles.signupButtonText}>Sign up</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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

  // ── Error ──
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.error,
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
  },

  // ── Sign Up Button ──
  signupButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    minWidth: 150,
    ...Shadow.button,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },
});
// app/(auth)/signup.tsx

import { BorderRadius, Colors, FontFamily, Shadow, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
} from 'react-native';

type UserRole = 'engineer' | 'supervisor' | 'student';

export default function SignUpScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('engineer');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !domain.trim()) {
      Alert.alert('Validation Error', 'All registration fields are mandatory.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, name.trim(), role, domain.trim());
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during account signup.');
    } finally {
      setLoading(false);
    }
  };

  const roles: UserRole[] = ['engineer', 'supervisor', 'student'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>REGISTRATION</Text>
          <Text style={styles.subtitle}>Create your EngiTriad secure profile</Text>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.pillInput}
                placeholder="e.g., Jane Doe"
                placeholderTextColor={Colors.textPlaceholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.pillInput}
                placeholder="jane.doe@firm.com"
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
                placeholder="Minimum 6 characters"
                placeholderTextColor={Colors.textPlaceholder}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SYSTEM ROLE</Text>
              <View style={styles.pillRoleSelector}>
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleTab,
                      role === r && styles.roleTabActive
                    ]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[
                      styles.roleTabText,
                      role === r && styles.roleTabTextActive
                    ]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ENGINEERING DOMAIN</Text>
              <TextInput
                style={styles.pillInput}
                placeholder="e.g., Civil, Mining, Metallurgy"
                placeholderTextColor={Colors.textPlaceholder}
                value={domain}
                onChangeText={setDomain}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textOnPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>REGISTER</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already registered? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.tagline,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.xs,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
    letterSpacing: 0.5,
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
  pillRoleSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.toggleBackground,
    borderRadius: BorderRadius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.pill,
  },
  roleTabActive: {
    backgroundColor: Colors.toggleActive,
  },
  roleTabText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: Colors.toggleInactiveText,
    letterSpacing: 0.5,
  },
  roleTabTextActive: {
    fontFamily: FontFamily.bold,
    color: Colors.toggleActiveText,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.button,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    color: Colors.textOnPrimary,
    fontSize: 16,
    letterSpacing: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
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
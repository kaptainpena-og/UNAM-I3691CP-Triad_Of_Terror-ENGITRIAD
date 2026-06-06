// app/(auth)/signup.tsx

import { Colors, FontFamily } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !role.trim() || !domain.trim()) {
      Alert.alert('Validation Error', 'All registration fields are mandatory.');
      return;
    }

    const cleanedRole = role.trim().toLowerCase();
    if (cleanedRole !== 'engineer' && cleanedRole !== 'supervisor' && cleanedRole !== 'student') {
      Alert.alert('Validation Error', "Role must be exactly 'engineer', 'supervisor', or 'student'.");
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, name.trim(), cleanedRole, domain.trim());
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during account signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>REGISTRATION</Text>
        <Text style={styles.subtitle}>Create your EngiTriad secure profile</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>FULL NAME</Text>
          <TextInput
            style={styles.inputField}
            placeholder="e.g., Jane Doe"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.inputField}
            placeholder="jane.doe@firm.com"
            placeholderTextColor={Colors.textMuted}
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
            style={styles.inputField}
            placeholder="Minimum 6 characters"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>ROLE (engineer | supervisor | student)</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Must match system parameters exactly"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            value={role}
            onChangeText={setRole}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>ENGINEERING DOMAIN</Text>
          <TextInput
            style={styles.inputField}
            placeholder="e.g., Civil, Mining, Metallurgy"
            placeholderTextColor={Colors.textMuted}
            value={domain}
            onChangeText={setDomain}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>REGISTER</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already registered? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
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
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputField: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: "#000",
    backgroundColor: '#FAFAFA',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    color: Colors.textOnPrimary,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
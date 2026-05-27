// app/(tabs)/index.tsx

import { BorderRadius, Colors, FontFamily, Shadow, Spacing } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DashboardScreen() {
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDepartments = () => {
    router.push('/(tabs)/departments');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              // TODO: call Firebase deleteUser(auth.currentUser) here
              router.replace('/(auth)/login');
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete account.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const handleReturnToLogin = () => {
    // TODO: call Firebase signOut(auth) here before navigating
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* ── Centre content ── */}
        <View style={styles.centreContent}>

          {/* Departments button — amber filled pill */}
          <TouchableOpacity
            style={styles.departmentsButton}
            onPress={handleDepartments}
            activeOpacity={0.85}
          >
            <Text style={styles.departmentsButtonText}>DEPARTMENTS</Text>
          </TouchableOpacity>

          {/* Spacer between buttons */}
          <View style={styles.buttonSpacer} />

          {/* Delete My Account button — white outlined pill */}
          <TouchableOpacity
            style={[styles.deleteButton, deletingAccount && styles.buttonDisabled]}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
            activeOpacity={0.85}
          >
            {deletingAccount ? (
              <ActivityIndicator color={Colors.tagline} />
            ) : (
              <Text style={styles.deleteButtonText}>DELETE MY ACC</Text>
            )}
          </TouchableOpacity>

          {/* Return to login link */}
          <TouchableOpacity
            style={styles.returnWrapper}
            onPress={handleReturnToLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.returnText}>Return to login</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // ── Centre block ──
  centreContent: {
    width: '100%',
    alignItems: 'center',
  },

  // ── Departments button ──
  departmentsButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    ...Shadow.button,
  },
  departmentsButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    letterSpacing: 2,
    color: Colors.tagline,        // teal text on amber — matches Figma
  },

  buttonSpacer: {
    height: Spacing.xl,
  },

  // ── Delete account button ──
  deleteButton: {
    backgroundColor: Colors.text,  // white pill
    borderRadius: BorderRadius.pill,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    ...Shadow.card,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    letterSpacing: 2,
    color: Colors.tagline,          // teal text on white — matches Figma
  },

  // ── Return to login ──
  returnWrapper: {
    marginTop: Spacing.lg,
  },
  returnText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.primary,          // amber text link
  },
});
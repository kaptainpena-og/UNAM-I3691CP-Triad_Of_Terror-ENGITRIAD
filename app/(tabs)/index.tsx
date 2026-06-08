// app/(tabs)/index.tsx

import {
  BorderRadius,
  Colors,
  FontFamily,
  Shadow,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/services/firebase";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDepartments = () => {
    router.push("/(tabs)/departments");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            try {
              if (auth.currentUser) {
                await auth.currentUser.delete();
              }
              router.replace("/(auth)/login");
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Failed to delete account.");
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  const handleReturnToLogin = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.centreContent}>
          <TouchableOpacity
            style={styles.departmentsButton}
            onPress={handleDepartments}
            activeOpacity={0.85}
          >
            <Text style={styles.departmentsButtonText}>DEPARTMENTS</Text>
          </TouchableOpacity>

          <View style={styles.buttonSpacer} />

          <TouchableOpacity
            style={[
              styles.deleteButton,
              deletingAccount && styles.buttonDisabled,
            ]}
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
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  centreContent: { width: "100%", alignItems: "center" },
  departmentsButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 18,
    width: "100%",
    alignItems: "center",
    ...Shadow.button,
  },
  departmentsButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    letterSpacing: 2,
    color: Colors.tagline,
  },
  buttonSpacer: { height: Spacing.xl },
  deleteButton: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.pill,
    paddingVertical: 18,
    width: "100%",
    alignItems: "center",
    ...Shadow.card,
  },
  buttonDisabled: { opacity: 0.6 },
  deleteButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    letterSpacing: 2,
    color: Colors.tagline,
  },
  returnWrapper: { marginTop: Spacing.lg },
  returnText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.primary,
  },
});

// app/(tabs)/departments.tsx

import { BorderRadius, Colors, FontFamily, Shadow, Spacing } from '@/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Department = {
  id: string;
  title: string;
  subtitle: string;
  route: '/(tabs)/corrosion' | '/(tabs)/concrete' | '/(tabs)/blast';
};

const DEPARTMENTS: Department[] = [
  {
    id: 'corrosion',
    title: 'Corrosion Rate\nEstimator',
    subtitle: 'Metallurgical & Civil Engineers',
    route: '/(tabs)/corrosion',
  },
  {
    id: 'concrete',
    title: 'Concrete Mixer\nCalculator',
    subtitle: 'Civil Site Engineers',
    route: '/(tabs)/concrete',
  },
  {
    id: 'blasting',
    title: 'Blasting\nPlanner',
    subtitle: 'Mine Supervisors & Blasting Officers',
    route: '/(tabs)/blast',
  },
];

export default function DepartmentsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>ENGITRIAD</Text>
          <Text style={styles.tagline}>THE POWER OF THREE. APPLIED</Text>
        </View>

        <Text style={styles.sectionHeading}>Departments</Text>

        {/* ── Department cards ── */}
        <View style={styles.cardList}>
          {DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept.id}
              style={styles.card}
              onPress={() => router.push(dept.route)}
              activeOpacity={0.85}
            >
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>{dept.title}</Text>
                <Text style={styles.cardSubtitle}>{dept.subtitle}</Text>
              </View>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Back link ── */}
        <TouchableOpacity
          style={styles.backWrapper}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>Return to dashboard</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
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

  sectionHeading: {
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },

  // ── Cards ──
  cardList: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadow.card,
  },
  cardInner: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  cardArrow: {
    marginLeft: Spacing.md,
  },
  cardArrowText: {
    fontSize: 28,
    color: Colors.primary,
    fontFamily: FontFamily.regular,
  },

  // ── Back link ──
  backWrapper: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  backText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: Colors.primary,
  },
});
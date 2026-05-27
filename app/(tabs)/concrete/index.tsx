// app/(tabs)/concrete/index.tsx

import { BorderRadius, Colors, FontFamily, Shadow, Spacing } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// ─── SANS 10100-1 Mix Design Logic ────────────────────────────────────────────
//
// Based on the SANS 10100-1 mix design procedure as taught in the lecture notes:
//  • Concrete density: 2400 kg/m³ (nominal unreinforced, SANS 10160-2 Table A.1)
//  • Water content: 180 kg/m³ baseline for 20mm aggregate, 50–80mm slump
//  • w/b ratio lookup by target mean strength (fck + k·s where k=1.64, s=5 MPa)
//  • Binder = water content / w/b ratio
//  • Aggregate (FA + CA) = total volume minus paste volume
//  • FA : CA split = 40 : 60 by mass (standard mid-range from lecture notes)
//
// ⚠️ DISCLAIMER: Results are INDICATIVE only and must not be used for
// structural design without review by a qualified professional engineer.
// ──────────────────────────────────────────────────────────────────────────────

type ConcreteGrade = 'C15' | 'C20' | 'C25' | 'C30' | 'C35' | 'C40';

interface MixResult {
  volume: number;          // m³
  cement: number;          // kg
  sand: number;            // kg  (FA)
  aggregate: number;       // kg  (CA 20mm)
  water: number;           // kg/L
  wbRatio: number;
  targetMeanStrength: number; // MPa
  concreteGrade: ConcreteGrade;
}

const GRADE_FCK: Record<ConcreteGrade, number> = {
  C15: 15, C20: 20, C25: 25, C30: 30, C35: 35, C40: 40,
};

// w/b ratio from SANS 10100-1 Table — target mean strength → w/b
// (approximated from the lecture example: fck=40MPa → w/b=0.37)
function wbRatioFromStrength(fmt: number): number {
  // Abrams-derived approximation calibrated to SANS lecture example
  // fmt = target mean strength (MPa)
  const wb = -0.0106 * fmt + 0.79;
  return Math.min(0.70, Math.max(0.35, parseFloat(wb.toFixed(2))));
}

function calculateMix(
  grade: ConcreteGrade,
  thickness: number,   // m
  length: number,      // m
  width: number,       // m
): MixResult {
  const volume = parseFloat((thickness * length * width).toFixed(4));

  // Target mean strength: fck + 1.64 × s (s=5 MPa per lecture, k=1.64 for 5% defects)
  const fck = GRADE_FCK[grade];
  const fmt = fck + 1.64 * 5; // MPa

  const wbRatio = wbRatioFromStrength(fmt);

  // Water content: 180 kg/m³ for 20mm aggregate, 50–80mm slump (SANS 10100-1 table)
  // Reduced by 5% for average degree of control (lecture notes adjustment)
  const waterPerM3 = 180 * 0.95; // ≈ 171 kg/m³

  const binderPerM3 = waterPerM3 / wbRatio;
  const cementPerM3 = binderPerM3; // pure CEM I (no extenders in basic calc)

  // Aggregate mass per m³ using absolute volume method
  // Concrete density ≈ 2400 kg/m³ (SANS 10160-2 Table A.1, unreinforced nominal)
  const concreteDensity = 2400; // kg/m³
  const aggregatePerM3 = concreteDensity - cementPerM3 - waterPerM3;

  // FA : CA = 40 : 60 split (lecture notes mid-range)
  const sandPerM3 = aggregatePerM3 * 0.40;
  const caPerM3   = aggregatePerM3 * 0.60;

  const round = (v: number) => Math.round(v * volume * 10) / 10;

  return {
    volume,
    cement:    round(cementPerM3),
    sand:      round(sandPerM3),
    aggregate: round(caPerM3),
    water:     round(waterPerM3),
    wbRatio,
    targetMeanStrength: parseFloat(fmt.toFixed(1)),
    concreteGrade: grade,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const GRADES: ConcreteGrade[] = ['C15', 'C20', 'C25', 'C30', 'C35', 'C40'];

export default function ConcreteCalculatorScreen() {
  const [selectedGrade, setSelectedGrade] = useState<ConcreteGrade>('C25');
  const [thickness, setThickness] = useState('');
  const [length, setLength]       = useState('');
  const [width, setWidth]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const validate = (): boolean => {
    const t = parseFloat(thickness);
    const l = parseFloat(length);
    const w = parseFloat(width);
    if (isNaN(t) || isNaN(l) || isNaN(w)) {
      setError('Please fill in all dimensions.');
      return false;
    }
    if (t <= 0 || l <= 0 || w <= 0) {
      setError('All dimensions must be greater than 0.');
      return false;
    }
    if (t > 5 || l > 500 || w > 500) {
      setError('Please check your dimensions — values seem unreasonably large.');
      return false;
    }
    return true;
  };

  const handleCalculate = () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const result = calculateMix(
        selectedGrade,
        parseFloat(thickness),
        parseFloat(length),
        parseFloat(width),
      );
      // Navigate to results screen, passing result as JSON param
      router.push({
        pathname: '/(tabs)/concrete/results',
        params: { result: JSON.stringify(result) },
      });
    } catch (e: any) {
      setError('Calculation failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Concrete Slab{'\n'}Calculator</Text>
        </View>

        {/* ── Grade selector ── */}
        <Text style={styles.sectionLabel}>Concrete Grade</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gradeRow}
        >
          {GRADES.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.gradeChip, selectedGrade === g && styles.gradeChipActive]}
              onPress={() => setSelectedGrade(g)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.gradeChipText,
                selectedGrade === g && styles.gradeChipTextActive,
              ]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Inputs ── */}
        <View style={styles.form}>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Slab thickness (m)</Text>
            <TextInput
              style={styles.input}
              value={thickness}
              onChangeText={setThickness}
              placeholder="e.g. 0.15"
              placeholderTextColor={Colors.textPlaceholder}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Slab length (m)</Text>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              placeholder="e.g. 6.0"
              placeholderTextColor={Colors.textPlaceholder}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Slab width (m)</Text>
            <TextInput
              style={styles.input}
              value={width}
              onChangeText={setWidth}
              placeholder="e.g. 4.0"
              placeholderTextColor={Colors.textPlaceholder}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleCalculate}
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* ── Actions ── */}
        <TouchableOpacity
          style={[styles.calcButton, loading && styles.buttonDisabled]}
          onPress={handleCalculate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={Colors.textOnPrimary} />
            : <Text style={styles.calcButtonText}>Calculate</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backWrapper}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>Return to departments</Text>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  // ── Header ──
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  screenTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.text,
    lineHeight: 36,
  },

  // ── Grade selector ──
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  gradeChip: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gradeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.button,
  },
  gradeChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.textMuted,
  },
  gradeChipTextActive: {
    color: Colors.textOnPrimary,
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
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.error,
    marginTop: Spacing.sm,
    marginLeft: Spacing.sm,
  },

  // ── Buttons ──
  calcButton: {
    backgroundColor: Colors.text, // white pill — matches Figma
    borderRadius: BorderRadius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  calcButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.secondary,  // navy text on white — Figma style
  },
  backWrapper: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  backText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.primary,
  },


});
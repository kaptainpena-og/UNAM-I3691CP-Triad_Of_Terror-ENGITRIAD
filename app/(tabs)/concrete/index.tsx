// app/(tabs)/concrete/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// IMPROVED: Concrete Slab Calculator
//   • Inputs  : Slab thickness (m), length (m), width (m), number of slabs
//   • Outputs : Total volume (m³), area per slab, total area, weight (kg),
//               estimated 50 kg cement bags (1:2:4 mix)
//   • Saves calculation to Firestore and navigates to results screen
// ─────────────────────────────────────────────────────────────────────────────

import { BorderRadius, Colors, FontFamily, Shadow, Spacing } from '@/constants/theme';
import { auth, db } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SlabResults {
  areaPerSlab: number;
  totalArea: number;
  totalVolume: number;
  weightKg: number;
  cementBags: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculate(
  thickness: number,
  length: number,
  width: number,
  count: number,
): SlabResults {
  const areaPerSlab = length * width;
  const totalArea = areaPerSlab * count;
  const totalVolume = thickness * totalArea;
  // Concrete density ≈ 2 400 kg/m³
  const weightKg = totalVolume * 2400;
  // 1:2:4 mix: cement ≈ 14 % of total weight; 50 kg bags
  const cementBags = Math.ceil((weightKg * 0.14) / 50);
  return { areaPerSlab, totalArea, totalVolume, weightKg, cementBags };
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConcreteSlabScreen() {
  const router = useRouter();

  // Inputs
  const [projectName, setProjectName] = useState('');
  const [thickness, setThickness] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [slabCount, setSlabCount] = useState('1');

  // UI state
  const [results, setResults] = useState<SlabResults | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Live preview (no save) ────────────────────────────────────────────────
  const handlePreview = () => {
    const t = parseFloat(thickness);
    const l = parseFloat(length);
    const w = parseFloat(width);
    const n = parseInt(slabCount, 10) || 1;

    if (!t || !l || !w || t <= 0 || l <= 0 || w <= 0) {
      Alert.alert('Validation', 'Please enter valid values for all dimensions.');
      return;
    }
    setResults(calculate(t, l, w, n));
  };

  // ── Calculate, save & navigate ────────────────────────────────────────────
  const handleSave = async () => {
    if (!projectName.trim()) {
      Alert.alert('Validation', 'Please enter a project name before saving.');
      return;
    }

    const t = parseFloat(thickness);
    const l = parseFloat(length);
    const w = parseFloat(width);
    const n = parseInt(slabCount, 10) || 1;

    if (!t || !l || !w || t <= 0 || l <= 0 || w <= 0) {
      Alert.alert('Validation', 'Please enter valid dimensions first.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Auth Error', 'You must be logged in to save calculations.');
      return;
    }

    setLoading(true);
    try {
      const r = calculate(t, l, w, n);
      setResults(r);

      const payload = {
        userId: user.uid,
        projectName: projectName.trim(),
        slabThickness: t,
        slabLength: l,
        slabWidth: w,
        slabCount: n,
        areaPerSlab: r.areaPerSlab,
        totalArea: r.totalArea,
        totalVolume: r.totalVolume,
        weightKg: r.weightKg,
        cementBags: r.cementBags,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'concreteMixes'), payload);

      Alert.alert('Saved', 'Slab calculation saved!', [
        { text: 'View History', onPress: () => router.push('/(tabs)/concrete/results') },
        { text: 'OK' },
      ]);

      // Reset form
      setProjectName('');
      setThickness('');
      setLength('');
      setWidth('');
      setSlabCount('1');
      setResults(null);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Text style={styles.headerTitle}>Concrete Slab{'\n'}Calculator</Text>
      <Text style={styles.subTitle}>
        Enter slab dimensions to estimate volume and material quantities.
      </Text>

      {/* Project Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Project Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Block B Foundation"
          placeholderTextColor={Colors.textPlaceholder}
          value={projectName}
          onChangeText={setProjectName}
        />
      </View>

      {/* Dimension Inputs */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
          <Text style={styles.label}>Thickness (m)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0.15"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad"
            value={thickness}
            onChangeText={setThickness}
          />
        </View>
        <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
          <Text style={styles.label}>No. of Slabs</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="number-pad"
            value={slabCount}
            onChangeText={setSlabCount}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1, { marginRight: 8 }]}>
          <Text style={styles.label}>Length (m)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5.0"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad"
            value={length}
            onChangeText={setLength}
          />
        </View>
        <View style={[styles.inputGroup, styles.flex1, { marginLeft: 8 }]}>
          <Text style={styles.label}>Width (m)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 4.0"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad"
            value={width}
            onChangeText={setWidth}
          />
        </View>
      </View>

      {/* Preview Button */}
      <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
        <Text style={styles.previewButtonText}>Calculate</Text>
      </TouchableOpacity>

      {/* Results Card */}
      {results && (
        <View style={styles.resultsCard}>
          {/* Hero value */}
          <View style={styles.heroBlock}>
            <Text style={styles.heroValue}>{fmt(results.totalVolume, 3)}</Text>
            <Text style={styles.heroLabel}>m³ total concrete</Text>
          </View>

          <View style={styles.divider} />

          {/* Detail rows */}
          <ResultRow label="Area per slab" value={`${fmt(results.areaPerSlab)} m²`} />
          <ResultRow label="Total area" value={`${fmt(results.totalArea)} m²`} />
          <ResultRow
            label="Estimated weight"
            value={`${Math.round(results.weightKg).toLocaleString()} kg`}
          />
          <ResultRow
            label="Cement bags (50 kg, 1:2:4)"
            value={`${results.cementBags} bags`}
            accent
          />
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.textOnPrimary} />
        ) : (
          <Text style={styles.primaryButtonText}>Save Calculation</Text>
        )}
      </TouchableOpacity>

      {/* Return link */}
      <TouchableOpacity
        style={styles.backWrapper}
        onPress={() => router.push('/(tabs)/departments')}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>Return to departments</Text>
      </TouchableOpacity>

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          * Indicative estimates only. Concrete density assumed at 2 400 kg/m³; cement
          proportion based on a 1:2:4 mix ratio. Always obtain certified quantities from a
          structural engineer before procurement.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function ResultRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, accent && styles.resultValueAccent]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Header
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 36,
  },
  subTitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },

  // Inputs
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },

  // Preview / Calculate button
  previewButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: 4,
  },
  previewButtonText: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    fontSize: 16,
  },

  // Results card
  resultsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadow.card,
  },
  heroBlock: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  heroValue: {
    fontFamily: FontFamily.bold,
    fontSize: 40,
    color: Colors.primary,
    letterSpacing: -1,
  },
  heroLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textMuted,
    flex: 1,
  },
  resultValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.text,
  },
  resultValueAccent: {
    color: Colors.primary,
    fontSize: 15,
  },

  // Primary (save) button
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.button,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    color: Colors.textOnPrimary,
    fontSize: 16,
  },

  // Back link
  backWrapper: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  backText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.primary,
  },

  // Disclaimer
  disclaimerContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#1A2E50',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  disclaimerText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 17,
  },
});

// app/(tabs)/concrete/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED Concrete Slab Calculator
//   Inputs  : Project name, slab type, concrete grade, dimensions,
//             waste factor, reinforcement steel density
//   Outputs : Net/ordered volume, full material breakdown (cement, sand,
//             aggregate, water), rebar weight, formwork area, mix ratios
//   Saves to Firestore and navigates to results screen
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

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADES = ['C20', 'C25', 'C30', 'C35'] as const;
type Grade = typeof GRADES[number];

const SLAB_TYPES = ['Ground Slab', 'Suspended Slab', 'Roof Slab'] as const;
type SlabType = typeof SLAB_TYPES[number];

// Mix design per grade: { cementKgM3, sandKgM3, aggKgM3, wcRatio, mixLabel }
const MIX_DESIGN: Record<Grade, {
  cement: number; sand: number; agg: number; water: number; ratio: string;
}> = {
  C20: { cement: 320, sand: 700,  agg: 1200, water: 192, ratio: '1 : 2 : 4'   },
  C25: { cement: 360, sand: 680,  agg: 1100, water: 198, ratio: '1 : 1.5 : 3' },
  C30: { cement: 400, sand: 620,  agg: 1100, water: 200, ratio: '1 : 1 : 2'   },
  C35: { cement: 450, sand: 600,  agg: 1000, water: 202, ratio: '1 : 0.8 : 1.6'},
};

// Reinforcement presets (kg/m³)
const REBAR_PRESETS = [
  { label: 'None',   value: 0   },
  { label: 'Light',  value: 70  },
  { label: 'Medium', value: 100 },
  { label: 'Heavy',  value: 140 },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Results {
  areaPerSlab:   number;
  totalArea:     number;
  netVolume:     number;
  wasteVolume:   number;
  orderedVolume: number;
  cement:        number;  // kg
  sand:          number;  // kg
  aggregate:     number;  // kg
  water:         number;  // litres
  cementBags:    number;  // 50 kg bags
  rebarKg:       number;
  rebarTonnes:   number;
  formworkArea:  number;  // m²
  grade:         Grade;
  mixRatio:      string;
}

// ─── Calculation Engine ───────────────────────────────────────────────────────

function runCalc(
  thicknessMm: number,
  length: number,
  width: number,
  count: number,
  wastePct: number,
  rebarKgM3: number,
  grade: Grade,
  slabType: SlabType,
): Results {
  const t = thicknessMm / 1000; // convert mm → m
  const mix = MIX_DESIGN[grade];

  const areaPerSlab   = length * width;
  const totalArea     = areaPerSlab * count;
  const netVolume     = t * totalArea;
  const wasteVolume   = netVolume * (wastePct / 100);
  const orderedVolume = netVolume + wasteVolume;

  const cement    = mix.cement    * orderedVolume;
  const sand      = mix.sand      * orderedVolume;
  const aggregate = mix.agg       * orderedVolume;
  const water     = mix.water     * orderedVolume;
  const cementBags = Math.ceil(cement / 50);

  const rebarKg     = rebarKgM3 * netVolume;
  const rebarTonnes = rebarKg / 1000;

  // Formwork: soffit area + edge shuttering (all four sides × thickness)
  const perimeterPerSlab = 2 * (length + width);
  const formworkArea =
    slabType === 'Ground Slab'
      ? 0                                              // ground slab: no soffit formwork
      : totalArea + perimeterPerSlab * t * count;      // suspended/roof: soffit + edges

  return {
    areaPerSlab, totalArea,
    netVolume, wasteVolume, orderedVolume,
    cement, sand, aggregate, water, cementBags,
    rebarKg, rebarTonnes, formworkArea,
    grade, mixRatio: mix.ratio,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConcreteSlabScreen() {
  const router = useRouter();

  // ── Inputs ──
  const [projectName, setProjectName] = useState('');
  const [slabType,    setSlabType]    = useState<SlabType>('Ground Slab');
  const [grade,       setGrade]       = useState<Grade>('C25');
  const [thickness,   setThickness]   = useState('');   // mm
  const [length,      setLength]      = useState('');
  const [width,       setWidth]       = useState('');
  const [slabCount,   setSlabCount]   = useState('1');
  const [wastePct,    setWastePct]    = useState('5');
  const [rebarKgM3,   setRebarKgM3]   = useState(0);    // from preset

  // ── UI state ──
  const [results,  setResults]  = useState<Results | null>(null);
  const [loading,  setLoading]  = useState(false);

  // ── Validation helper ──
  const parseInputs = () => {
    const t = parseFloat(thickness);
    const l = parseFloat(length);
    const w = parseFloat(width);
    const n = parseInt(slabCount, 10) || 1;
    const wp = parseFloat(wastePct) || 5;
    if (!t || !l || !w || t <= 0 || l <= 0 || w <= 0) return null;
    return { t, l, w, n, wp };
  };

  // ── Calculate (preview) ──
  const handleCalculate = () => {
    const v = parseInputs();
    if (!v) {
      Alert.alert('Validation', 'Please enter valid dimensions before calculating.');
      return;
    }
    setResults(runCalc(v.t, v.l, v.w, v.n, v.wp, rebarKgM3, grade, slabType));
  };

  // ── Save to Firestore ──
  const handleSave = async () => {
    if (!projectName.trim()) {
      Alert.alert('Validation', 'Please enter a project name before saving.');
      return;
    }
    const v = parseInputs();
    if (!v) {
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
      const r = runCalc(v.t, v.l, v.w, v.n, v.wp, rebarKgM3, grade, slabType);
      setResults(r);

      await addDoc(collection(db, 'concreteMixes'), {
        userId: user.uid,
        projectName: projectName.trim(),
        slabType,
        concreteGrade: grade,
        mixRatio: r.mixRatio,
        thicknessMm: v.t,
        slabLength: v.l,
        slabWidth: v.w,
        slabCount: v.n,
        wasteFactor: v.wp,
        rebarKgPerM3: rebarKgM3,
        areaPerSlab: r.areaPerSlab,
        totalArea: r.totalArea,
        netVolume: r.netVolume,
        orderedVolume: r.orderedVolume,
        cementKg: r.cement,
        cementBags: r.cementBags,
        sandKg: r.sand,
        aggregateKg: r.aggregate,
        waterLitres: r.water,
        rebarKg: r.rebarKg,
        formworkArea: r.formworkArea,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Saved ✓', 'Calculation saved successfully.', [
        { text: 'View History', onPress: () => router.push('/(tabs)/concrete/results') },
        { text: 'OK' },
      ]);

      // Reset
      setProjectName(''); setThickness(''); setLength('');
      setWidth(''); setSlabCount('1'); setWastePct('5');
      setRebarKgM3(0); setResults(null);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <Text style={styles.title}>Concrete Slab{'\n'}Calculator</Text>
      <Text style={styles.subtitle}>
        Full material take-off for site engineers.
      </Text>

      {/* ══ SECTION 1: Project Details ══════════════════════════════════════ */}
      <SectionHeader label="1. Project Details" />

      <FieldLabel text="Project Name" />
      <TextInput
        style={styles.input}
        placeholder="e.g. Block B – Ground Floor"
        placeholderTextColor={Colors.textPlaceholder}
        value={projectName}
        onChangeText={setProjectName}
      />

      <FieldLabel text="Slab Type" />
      <View style={styles.pillRow}>
        {SLAB_TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.pill, slabType === t && styles.pillActive]}
            onPress={() => setSlabType(t)}
          >
            <Text style={[styles.pillText, slabType === t && styles.pillTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FieldLabel text="Concrete Grade" />
      <View style={styles.pillRow}>
        {GRADES.map(g => (
          <TouchableOpacity
            key={g}
            style={[styles.pill, grade === g && styles.pillActive]}
            onPress={() => setGrade(g)}
          >
            <Text style={[styles.pillText, grade === g && styles.pillTextActive]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mix ratio info chip */}
      <View style={styles.infoChip}>
        <Text style={styles.infoChipText}>
          Mix  {MIX_DESIGN[grade].ratio}  ·  Cement {MIX_DESIGN[grade].cement} kg/m³  ·  W/C ≈ {(MIX_DESIGN[grade].water / MIX_DESIGN[grade].cement).toFixed(2)}
        </Text>
      </View>

      {/* ══ SECTION 2: Dimensions ═══════════════════════════════════════════ */}
      <SectionHeader label="2. Slab Dimensions" />

      <View style={styles.row}>
        <View style={styles.halfLeft}>
          <FieldLabel text="Thickness (mm)" />
          <TextInput style={styles.input} placeholder="e.g. 150"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad" value={thickness} onChangeText={setThickness} />
        </View>
        <View style={styles.halfRight}>
          <FieldLabel text="No. of Slabs" />
          <TextInput style={styles.input} placeholder="1"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="number-pad" value={slabCount} onChangeText={setSlabCount} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfLeft}>
          <FieldLabel text="Length (m)" />
          <TextInput style={styles.input} placeholder="e.g. 8.0"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad" value={length} onChangeText={setLength} />
        </View>
        <View style={styles.halfRight}>
          <FieldLabel text="Width (m)" />
          <TextInput style={styles.input} placeholder="e.g. 6.0"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad" value={width} onChangeText={setWidth} />
        </View>
      </View>

      {/* ══ SECTION 3: Mix Parameters ════════════════════════════════════════ */}
      <SectionHeader label="3. Mix Parameters" />

      <View style={styles.row}>
        <View style={styles.halfLeft}>
          <FieldLabel text="Waste Factor (%)" />
          <TextInput style={styles.input} placeholder="5"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad" value={wastePct} onChangeText={setWastePct} />
        </View>
        <View style={styles.halfRight}>
          <FieldLabel text="Ordered Vol = Net + Waste" />
          <View style={styles.inputReadOnly}>
            <Text style={styles.inputReadOnlyText}>auto-calculated</Text>
          </View>
        </View>
      </View>

      <FieldLabel text="Reinforcement Steel" />
      <View style={styles.pillRow}>
        {REBAR_PRESETS.map(p => (
          <TouchableOpacity
            key={p.label}
            style={[styles.pill, rebarKgM3 === p.value && styles.pillActive]}
            onPress={() => setRebarKgM3(p.value)}
          >
            <Text style={[styles.pillText, rebarKgM3 === p.value && styles.pillTextActive]}>
              {p.label}{p.value > 0 ? `\n${p.value} kg/m³` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══ CALCULATE BUTTON ════════════════════════════════════════════════ */}
      <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate}>
        <Text style={styles.calcBtnText}>⟳  Calculate</Text>
      </TouchableOpacity>

      {/* ══ RESULTS ════════════════════════════════════════════════════════ */}
      {results && (
        <View style={styles.resultsCard}>

          {/* Hero */}
          <View style={styles.heroRow}>
            <HeroStat label="Ordered Volume" value={`${results.orderedVolume.toFixed(3)} m³`} />
            <View style={styles.heroDivider} />
            <HeroStat label="Total Area" value={`${results.totalArea.toFixed(2)} m²`} />
          </View>

          <Divider />

          {/* Volume breakdown */}
          <SubHeader text="Volume Breakdown" />
          <ResultRow label="Net concrete volume"   value={`${results.netVolume.toFixed(3)} m³`} />
          <ResultRow label={`Waste (${wastePct}%)`} value={`${results.wasteVolume.toFixed(3)} m³`} />
          <ResultRow label="Volume to order"        value={`${results.orderedVolume.toFixed(3)} m³`} accent />

          <Divider />

          {/* Material quantities */}
          <SubHeader text="Material Quantities" />
          <ResultRow label="Cement"    value={`${Math.round(results.cement).toLocaleString()} kg`} />
          <ResultRow label="Cement bags (50 kg)" value={`${results.cementBags} bags`} accent />
          <ResultRow label="Sand"      value={`${Math.round(results.sand).toLocaleString()} kg`} />
          <ResultRow label="Aggregate" value={`${Math.round(results.aggregate).toLocaleString()} kg`} />
          <ResultRow label="Water"     value={`${Math.round(results.water).toLocaleString()} L`} />

          {/* Rebar */}
          {results.rebarKg > 0 && (
            <>
              <Divider />
              <SubHeader text="Reinforcement Steel" />
              <ResultRow label="Total rebar weight" value={`${Math.round(results.rebarKg).toLocaleString()} kg`} />
              <ResultRow label="Rebar (tonnes)"     value={`${results.rebarTonnes.toFixed(2)} t`} accent />
            </>
          )}

          {/* Formwork */}
          {results.formworkArea > 0 && (
            <>
              <Divider />
              <SubHeader text="Formwork" />
              <ResultRow label="Formwork area" value={`${results.formworkArea.toFixed(2)} m²`} accent />
            </>
          )}

          {/* Per-unit summary */}
          <Divider />
          <SubHeader text={`Per Slab  (${results.areaPerSlab.toFixed(2)} m²)`} />
          <ResultRow label="Volume / slab" value={`${(results.netVolume / (parseInt(slabCount,10)||1)).toFixed(3)} m³`} />
          <ResultRow label="Cement / slab" value={`${Math.round(results.cement / (parseInt(slabCount,10)||1))} kg`} />
        </View>
      )}

      {/* ══ SAVE BUTTON ════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.btnDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.textOnPrimary} />
          : <Text style={styles.saveBtnText}>Save Calculation</Text>
        }
      </TouchableOpacity>

      {/* Return link */}
      <TouchableOpacity style={styles.backWrapper} onPress={() => router.push('/(tabs)/departments')}>
        <Text style={styles.backText}>Return to departments</Text>
      </TouchableOpacity>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          * Indicative estimates only. Cement content and mix proportions follow standard
          practice (BS 8500 / ACI 211). Bulk densities assumed: cement 1 440 kg/m³,
          sand 1 600 kg/m³, aggregate 1 500 kg/m³. Always verify with a certified structural
          engineer before procurement or placement.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Small reusable components ────────────────────────────────────────────────

const SectionHeader = ({ label }: { label: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{label}</Text>
  </View>
);

const SubHeader = ({ text }: { text: string }) => (
  <Text style={styles.subHeader}>{text}</Text>
);

const FieldLabel = ({ text }: { text: string }) => (
  <Text style={styles.fieldLabel}>{text}</Text>
);

const Divider = () => <View style={styles.divider} />;

const HeroStat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.heroStat}>
    <Text style={styles.heroValue}>{value}</Text>
    <Text style={styles.heroLabel}>{label}</Text>
  </View>
);

const ResultRow = ({
  label, value, accent = false,
}: { label: string; value: string; accent?: boolean }) => (
  <View style={styles.resultRow}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={[styles.resultValue, accent && styles.resultAccent]}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  title: {
    fontFamily: FontFamily.bold, fontSize: 28,
    color: Colors.text, lineHeight: 36, marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.regular, fontSize: 14,
    color: Colors.textMuted, marginBottom: Spacing.lg,
  },

  // Section header
  sectionHeader: {
    marginTop: Spacing.lg, marginBottom: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    paddingLeft: 10,
  },
  sectionHeaderText: {
    fontFamily: FontFamily.bold, fontSize: 13,
    color: Colors.primary, letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Field label
  fieldLabel: {
    fontFamily: FontFamily.semiBold, fontSize: 12,
    color: Colors.textMuted, marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },

  // Inputs
  input: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    fontSize: 15, fontFamily: FontFamily.regular,
    color: Colors.text, backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  inputReadOnly: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
    justifyContent: 'center',
  },
  inputReadOnlyText: {
    fontFamily: FontFamily.regular, fontSize: 13,
    color: Colors.muted, fontStyle: 'italic',
  },

  row: { flexDirection: 'row' },
  halfLeft:  { flex: 1, marginRight: 8 },
  halfRight: { flex: 1, marginLeft: 8  },

  // Pills / selectors
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  pill: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8, paddingHorizontal: 12,
    alignItems: 'center', backgroundColor: Colors.surface,
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: {
    fontFamily: FontFamily.medium, fontSize: 13,
    color: Colors.textMuted, textAlign: 'center',
  },
  pillTextActive: { color: Colors.textOnPrimary },

  // Info chip
  infoChip: {
    backgroundColor: '#0A2150', borderRadius: BorderRadius.sm,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: Spacing.md,
    borderLeftWidth: 2, borderLeftColor: Colors.tagline,
  },
  infoChipText: {
    fontFamily: FontFamily.regular, fontSize: 12,
    color: Colors.tagline, letterSpacing: 0.3,
  },

  // Calculate button
  calcBtn: {
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: BorderRadius.sm, paddingVertical: 14,
    alignItems: 'center', marginVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  calcBtnText: {
    fontFamily: FontFamily.semiBold, fontSize: 16,
    color: Colors.primary,
  },

  // Results card
  resultsCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
    ...Shadow.card,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: Spacing.sm },
  heroStat: { alignItems: 'center', flex: 1 },
  heroValue: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.primary },
  heroLabel: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  heroDivider: { width: 1, backgroundColor: Colors.border },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  subHeader: {
    fontFamily: FontFamily.semiBold, fontSize: 12,
    color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 6, marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
  },
  resultLabel: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textMuted, flex: 1 },
  resultValue: { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.text },
  resultAccent: { color: Colors.primary, fontSize: 14 },

  // Save button
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.sm,
    paddingVertical: 16, alignItems: 'center',
    marginBottom: Spacing.md, ...Shadow.button,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: FontFamily.bold, color: Colors.textOnPrimary, fontSize: 16 },

  // Back link
  backWrapper: { alignItems: 'center', paddingVertical: Spacing.md },
  backText: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.primary },

  // Disclaimer
  disclaimer: {
    marginTop: Spacing.md, padding: Spacing.md,
    backgroundColor: '#1A2E50', borderRadius: BorderRadius.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  disclaimerText: {
    fontFamily: FontFamily.regular, fontSize: 11,
    color: Colors.textMuted, lineHeight: 17,
  },
});

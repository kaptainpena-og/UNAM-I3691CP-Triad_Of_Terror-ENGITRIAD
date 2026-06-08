// app/(tabs)/concrete/index.tsx
// Drop-in replacement — no merge artifacts, no missing token dependencies

import { Colors, FontFamily } from '@/constants/theme';
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

const MIX: Record<Grade, { cement: number; sand: number; agg: number; water: number; ratio: string }> = {
  C20: { cement: 320, sand: 700,  agg: 1200, water: 192, ratio: '1 : 2 : 4'    },
  C25: { cement: 360, sand: 680,  agg: 1100, water: 198, ratio: '1 : 1.5 : 3'  },
  C30: { cement: 400, sand: 620,  agg: 1100, water: 200, ratio: '1 : 1 : 2'    },
  C35: { cement: 450, sand: 600,  agg: 1000, water: 202, ratio: '1 : 0.8 : 1.6'},
};

const REBAR_PRESETS = [
  { label: 'None',   value: 0   },
  { label: 'Light',  value: 70  },
  { label: 'Medium', value: 100 },
  { label: 'Heavy',  value: 140 },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Results {
  areaPerSlab: number;
  totalArea: number;
  netVolume: number;
  wasteVolume: number;
  orderedVolume: number;
  cement: number;
  sand: number;
  aggregate: number;
  water: number;
  cementBags: number;
  rebarKg: number;
  rebarTonnes: number;
  formworkArea: number;
  mixRatio: string;
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
  const t = thicknessMm / 1000;
  const mix = MIX[grade];
  const areaPerSlab   = length * width;
  const totalArea     = areaPerSlab * count;
  const netVolume     = t * totalArea;
  const wasteVolume   = netVolume * (wastePct / 100);
  const orderedVolume = netVolume + wasteVolume;
  const cement        = mix.cement * orderedVolume;
  const sand          = mix.sand   * orderedVolume;
  const aggregate     = mix.agg    * orderedVolume;
  const water         = mix.water  * orderedVolume;
  const cementBags    = Math.ceil(cement / 50);
  const rebarKg       = rebarKgM3 * netVolume;
  const rebarTonnes   = rebarKg / 1000;
  const perimeter     = 2 * (length + width);
  const formworkArea  = slabType === 'Ground Slab'
    ? 0
    : totalArea + perimeter * t * count;
  return {
    areaPerSlab, totalArea, netVolume, wasteVolume, orderedVolume,
    cement, sand, aggregate, water, cementBags,
    rebarKg, rebarTonnes, formworkArea, mixRatio: mix.ratio,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConcreteSlabScreen() {
  const router = useRouter();

  const [projectName, setProjectName] = useState('');
  const [slabType,    setSlabType]    = useState<SlabType>('Ground Slab');
  const [grade,       setGrade]       = useState<Grade>('C25');
  const [thickness,   setThickness]   = useState('');
  const [length,      setLength]      = useState('');
  const [width,       setWidth]       = useState('');
  const [slabCount,   setSlabCount]   = useState('1');
  const [wastePct,    setWastePct]    = useState('5');
  const [rebarKgM3,   setRebarKgM3]   = useState(0);
  const [results,     setResults]     = useState<Results | null>(null);
  const [loading,     setLoading]     = useState(false);

  const parseInputs = () => {
    const t  = parseFloat(thickness);
    const l  = parseFloat(length);
    const w  = parseFloat(width);
    const n  = parseInt(slabCount, 10) || 1;
    const wp = parseFloat(wastePct)    || 5;
    if (!t || !l || !w || t <= 0 || l <= 0 || w <= 0) return null;
    return { t, l, w, n, wp };
  };

  const handleCalculate = () => {
    const v = parseInputs();
    if (!v) { Alert.alert('Validation', 'Enter valid dimensions first.'); return; }
    setResults(runCalc(v.t, v.l, v.w, v.n, v.wp, rebarKgM3, grade, slabType));
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      Alert.alert('Validation', 'Enter a project name before saving.'); return;
    }
    const v = parseInputs();
    if (!v) { Alert.alert('Validation', 'Enter valid dimensions first.'); return; }
    const user = auth.currentUser;
    if (!user) { Alert.alert('Auth Error', 'You must be logged in.'); return; }

    setLoading(true);
    try {
      const r = runCalc(v.t, v.l, v.w, v.n, v.wp, rebarKgM3, grade, slabType);
      setResults(r);
      await addDoc(collection(db, 'concreteMixes'), {
        userId: user.uid,
        projectName: projectName.trim(),
        slabType, concreteGrade: grade, mixRatio: r.mixRatio,
        thicknessMm: v.t, slabLength: v.l, slabWidth: v.w,
        slabCount: v.n, wasteFactor: v.wp, rebarKgPerM3: rebarKgM3,
        areaPerSlab: r.areaPerSlab, totalArea: r.totalArea,
        netVolume: r.netVolume, orderedVolume: r.orderedVolume,
        cementKg: r.cement, cementBags: r.cementBags,
        sandKg: r.sand, aggregateKg: r.aggregate, waterLitres: r.water,
        rebarKg: r.rebarKg, formworkArea: r.formworkArea,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Saved ✓', 'Calculation saved.', [
        { text: 'View History', onPress: () => router.push('/(tabs)/concrete/results') },
        { text: 'OK' },
      ]);
      setProjectName(''); setThickness(''); setLength('');
      setWidth(''); setSlabCount('1'); setWastePct('5');
      setRebarKgM3(0); setResults(null);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const n = parseInt(slabCount, 10) || 1;

  return (
    <ScrollView style={S.container} contentContainerStyle={S.content} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <Text style={S.title}>Concrete Slab{'\n'}Calculator</Text>
      <Text style={S.subtitle}>Full material take-off for site engineers.</Text>

      {/* ── Section 1 ── */}
      <SecHeader label="1. Project Details" />

      <Label text="Project Name" />
      <TextInput style={S.input} placeholder="e.g. Block B – Ground Floor"
        placeholderTextColor={Colors.textPlaceholder}
        value={projectName} onChangeText={setProjectName} />

      <Label text="Slab Type" />
      <View style={S.pillRow}>
        {SLAB_TYPES.map(t => (
          <TouchableOpacity key={t} style={[S.pill, slabType === t && S.pillOn]} onPress={() => setSlabType(t)}>
            <Text style={[S.pillTxt, slabType === t && S.pillTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Label text="Concrete Grade" />
      <View style={S.pillRow}>
        {GRADES.map(g => (
          <TouchableOpacity key={g} style={[S.pill, grade === g && S.pillOn]} onPress={() => setGrade(g)}>
            <Text style={[S.pillTxt, grade === g && S.pillTxtOn]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={S.infoChip}>
        <Text style={S.infoTxt}>
          Mix {MIX[grade].ratio}  ·  {MIX[grade].cement} kg/m³ cement  ·  W/C ≈ {(MIX[grade].water / MIX[grade].cement).toFixed(2)}
        </Text>
      </View>

      {/* ── Section 2 ── */}
      <SecHeader label="2. Slab Dimensions" />

      <View style={S.row}>
        <View style={S.half}>
          <Label text="Thickness (mm)" />
          <TextInput style={S.input} placeholder="e.g. 150"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad" value={thickness} onChangeText={setThickness} />
        </View>
        <View style={S.halfR}>
          <Label text="No. of Slabs" />
          <TextInput style={S.input} placeholder="1"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="number-pad" value={slabCount} onChangeText={setSlabCount} />
        </View>
      </View>

      <View style={S.row}>
        <View style={S.half}>
          <Label text="Length (m)" />
          <TextInput style={S.input} placeholder="e.g. 8.0"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad" value={length} onChangeText={setLength} />
        </View>
        <View style={S.halfR}>
          <Label text="Width (m)" />
          <TextInput style={S.input} placeholder="e.g. 6.0"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad" value={width} onChangeText={setWidth} />
        </View>
      </View>

      {/* ── Section 3 ── */}
      <SecHeader label="3. Mix Parameters" />

      <View style={S.row}>
        <View style={S.half}>
          <Label text="Waste Factor (%)" />
          <TextInput style={S.input} placeholder="5"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="decimal-pad" value={wastePct} onChangeText={setWastePct} />
        </View>
        <View style={S.halfR}>
          <Label text="Ordered Vol" />
          <View style={[S.input, S.inputGhost]}>
            <Text style={S.ghostTxt}>auto-calculated</Text>
          </View>
        </View>
      </View>

      <Label text="Reinforcement Steel" />
      <View style={S.pillRow}>
        {REBAR_PRESETS.map(p => (
          <TouchableOpacity key={p.label} style={[S.pill, rebarKgM3 === p.value && S.pillOn]}
            onPress={() => setRebarKgM3(p.value)}>
            <Text style={[S.pillTxt, rebarKgM3 === p.value && S.pillTxtOn]}>
              {p.label}{p.value > 0 ? `\n${p.value} kg/m³` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Calculate ── */}
      <TouchableOpacity style={S.calcBtn} onPress={handleCalculate}>
        <Text style={S.calcBtnTxt}>⟳  Calculate</Text>
      </TouchableOpacity>

      {/* ── Results ── */}
      {results && (
        <View style={S.card}>

          <View style={S.heroRow}>
            <View style={S.heroStat}>
              <Text style={S.heroVal}>{results.orderedVolume.toFixed(3)} m³</Text>
              <Text style={S.heroLbl}>Ordered volume</Text>
            </View>
            <View style={S.heroDivider} />
            <View style={S.heroStat}>
              <Text style={S.heroVal}>{results.totalArea.toFixed(2)} m²</Text>
              <Text style={S.heroLbl}>Total area</Text>
            </View>
          </View>

          <View style={S.divider} />

          <Text style={S.subHdr}>Volume Breakdown</Text>
          <RRow label="Net concrete volume"    value={`${results.netVolume.toFixed(3)} m³`} />
          <RRow label={`Waste (${wastePct}%)`} value={`${results.wasteVolume.toFixed(3)} m³`} />
          <RRow label="Volume to order"        value={`${results.orderedVolume.toFixed(3)} m³`} accent />

          <View style={S.divider} />

          <Text style={S.subHdr}>Material Quantities</Text>
          <RRow label="Cement"               value={`${Math.round(results.cement).toLocaleString()} kg`} />
          <RRow label="Cement bags (50 kg)"  value={`${results.cementBags} bags`} accent />
          <RRow label="Sand"                 value={`${Math.round(results.sand).toLocaleString()} kg`} />
          <RRow label="Aggregate"            value={`${Math.round(results.aggregate).toLocaleString()} kg`} />
          <RRow label="Water"                value={`${Math.round(results.water).toLocaleString()} L`} />

          {results.rebarKg > 0 && (
            <>
              <View style={S.divider} />
              <Text style={S.subHdr}>Reinforcement Steel</Text>
              <RRow label="Total rebar"   value={`${Math.round(results.rebarKg).toLocaleString()} kg`} />
              <RRow label="Rebar weight"  value={`${results.rebarTonnes.toFixed(2)} t`} accent />
            </>
          )}

          {results.formworkArea > 0 && (
            <>
              <View style={S.divider} />
              <Text style={S.subHdr}>Formwork</Text>
              <RRow label="Formwork area" value={`${results.formworkArea.toFixed(2)} m²`} accent />
            </>
          )}

          <View style={S.divider} />
          <Text style={S.subHdr}>Per Slab ({results.areaPerSlab.toFixed(2)} m²)</Text>
          <RRow label="Volume / slab" value={`${(results.netVolume / n).toFixed(3)} m³`} />
          <RRow label="Cement / slab" value={`${Math.round(results.cement / n)} kg`} />
        </View>
      )}

      {/* ── Save ── */}
      <TouchableOpacity style={[S.saveBtn, loading && S.btnOff]} onPress={handleSave} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#02153A" />
          : <Text style={S.saveTxt}>Save Calculation</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={S.backWrap} onPress={() => router.push('/(tabs)/departments')}>
        <Text style={S.backTxt}>Return to departments</Text>
      </TouchableOpacity>

      <View style={S.disclaimer}>
        <Text style={S.disclaimerTxt}>
          * Indicative estimates only. Cement content based on standard mix proportions
          (BS 8500 / ACI 211). Concrete density assumed 2 400 kg/m³. Always verify with a
          certified structural engineer before procurement or placement.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SecHeader({ label }: { label: string }) {
  return (
    <View style={S.secHeader}>
      <Text style={S.secLabel}>{label}</Text>
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={S.label}>{text}</Text>;
}

function RRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={S.rrow}>
      <Text style={S.rlabel}>{label}</Text>
      <Text style={[S.rval, accent && S.rAccent]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: 20, paddingBottom: 48 },

  title:    { fontFamily: FontFamily.bold, fontSize: 28, color: Colors.text, lineHeight: 36, marginBottom: 6 },
  subtitle: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.textMuted, marginBottom: 20 },

  secHeader: { marginTop: 20, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.primary, paddingLeft: 10 },
  secLabel:  { fontFamily: FontFamily.bold, fontSize: 11, color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase' },

  label: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 },

  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, fontFamily: FontFamily.regular,
    color: Colors.text, backgroundColor: Colors.surface, marginBottom: 12,
  },
  inputGhost: { backgroundColor: Colors.background, borderStyle: 'dashed', justifyContent: 'center' },
  ghostTxt:   { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },

  row:   { flexDirection: 'row' },
  half:  { flex: 1, marginRight: 6 },
  halfR: { flex: 1, marginLeft: 6  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  pill:    { borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 13, backgroundColor: Colors.surface, alignItems: 'center' },
  pillOn:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillTxt:   { fontFamily: FontFamily.medium, fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  pillTxtOn: { color: Colors.background, fontFamily: FontFamily.semiBold },

  infoChip: { backgroundColor: Colors.background, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: Colors.primary },
  infoTxt:  { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.primary },

  calcBtn:    { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginVertical: 12, backgroundColor: Colors.surface },
  calcBtnTxt: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.primary },

  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: Colors.primary },

  heroRow:     { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 8 },
  heroStat:    { alignItems: 'center', flex: 1 },
  heroVal:     { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.primary },
  heroLbl:     { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  heroDivider: { width: 1, backgroundColor: Colors.border },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  subHdr:  { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, marginTop: 2 },

  rrow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rlabel: { fontFamily: FontFamily.regular, fontSize: 13, color: Colors.textMuted, flex: 1 },
  rval:   { fontFamily: FontFamily.semiBold, fontSize: 13, color: Colors.text },
  rAccent:{ color: Colors.primary, fontSize: 14 },

  saveBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnOff:  { opacity: 0.6 },
  saveTxt: { fontFamily: FontFamily.bold, color: Colors.background, fontSize: 16 },

  backWrap: { alignItems: 'center', paddingVertical: 12 },
  backTxt:  { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.primary },

  disclaimer:    { marginTop: 12, padding: 14, backgroundColor: Colors.surface, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  disclaimerTxt: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted, lineHeight: 17 },
});
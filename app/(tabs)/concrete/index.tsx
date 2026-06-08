// app/(tabs)/concrete/index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED Concrete Slab Calculator
//   Inputs  : Project name, slab type, concrete grade, dimensions,
//             waste factor, reinforcement steel density
//   Outputs : Net/ordered volume, full material breakdown (cement, sand,
//             aggregate, water), rebar weight, formwork area, mix ratios
//   Saves to Firestore and navigates to results screen
// ─────────────────────────────────────────────────────────────────────────────

import { Colors, FontFamily } from "@/constants/theme";
import { auth, db } from "@/services/firebase";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const GRADES = ["C20", "C25", "C30"];

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
  const [projectName, setProjectName] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("C25");
  const [volume, setVolume] = useState("");
  const [loading, setLoading] = useState(false);

  const calculateAndSave = async () => {
    if (!projectName.trim() || !volume.trim()) {
      Alert.alert(
        "Validation Error",
        "Please enter a project name and required volume.",
      );
      return;
    }
    setResults(runCalc(v.t, v.l, v.w, v.n, v.wp, rebarKgM3, grade, slabType));
  };

    const volNumber = parseFloat(volume);
    if (isNaN(volNumber) || volNumber <= 0) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid number for volume greater than 0.",
      );
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(
        "Authentication Error",
        "You must be logged in to save calculations.",
      );
      return;
    }

    setLoading(true);
    try {
      const dryVolume = volNumber * 1.54;

      let c = 1,
        s = 1.5,
        a = 3,
        wcRatio = 0.55;
      if (selectedGrade === "C25") {
        c = 1;
        s = 1;
        a = 2;
        wcRatio = 0.5;
      } else if (selectedGrade === "C30") {
        c = 1;
        s = 0.75;
        a = 1.5;
        wcRatio = 0.45;
      }

      const totalParts = c + s + a;

      const cementVol = (c / totalParts) * dryVolume;
      const sandVol = (s / totalParts) * dryVolume;
      const aggVol = (a / totalParts) * dryVolume;

      const cementQty = Math.round(cementVol * 1440);
      const sandQty = Math.round(sandVol * 1600);
      const aggregateQty = Math.round(aggVol * 1500);
      const waterQty = Math.round(cementQty * wcRatio);

      const mixData = {
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
      };

      const mixesCollection = collection(db, "concreteMixes");
      await addDoc(mixesCollection, mixData);

      // Build the result object to pass to the results screen
      const result = {
        volume: volNumber,
        cement: cementQty,
        sand: sandQty,
        aggregate: aggregateQty,
        water: waterQty,
        wbRatio: wcRatio,
        targetMeanStrength:
          selectedGrade === "C30" ? 38 : selectedGrade === "C25" ? 33 : 28,
        concreteGrade: selectedGrade as "C20" | "C25" | "C30",
      };

      Alert.alert("Success", "Mix calculation saved successfully!", [
        {
          text: "View Results",
          onPress: () =>
            router.push({
              pathname: "/(tabs)/concrete/results",
              params: { result: JSON.stringify(result) },
            }),
        },
      ]);

      setProjectName("");
      setVolume("");
      setSelectedGrade("C25");
    } catch (error: any) {
      Alert.alert(
        "Database Error",
        error.message ?? "Failed to save the record.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.headerTitle}>Concrete Mixer</Text>
      <Text style={styles.subTitle}>
        Calculate raw material requirements for your site.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Project Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Block B Foundation"
          placeholderTextColor={Colors.textMuted}
          value={projectName}
          onChangeText={setProjectName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Concrete Grade</Text>
        <View style={styles.gradeContainer}>
          {GRADES.map((grade) => (
            <TouchableOpacity
              key={grade}
              style={[
                styles.gradeButton,
                selectedGrade === grade && styles.gradeButtonActive,
              ]}
              onPress={() => setSelectedGrade(grade)}
            >
              <Text
                style={[
                  styles.gradeText,
                  selectedGrade === grade && styles.gradeTextActive,
                ]}
              >
                {grade}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Required Volume (m³)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 15.5"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={volume}
          onChangeText={setVolume}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={calculateAndSave}
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

      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          *Disclaimer: These calculations use standard dry-volume multipliers
          and assumed bulk densities. They are indicative only and should not be
          used for final structural safety sign-offs.
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
  contentContainer: { padding: 24 },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.secondary,
    marginBottom: 8,
  },

  // Section header
  sectionHeader: {
    marginTop: Spacing.lg, marginBottom: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    paddingLeft: 10,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
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
  gradeContainer: { flexDirection: "row", justifyContent: "space-between" },
  gradeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
    backgroundColor: Colors.background,
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
  gradeTextActive: { color: Colors.textOnPrimary },
  primaryButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    fontFamily: FontFamily.bold,
    color: Colors.background,
    fontSize: 16,
  },
  disclaimerContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  disclaimerText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});

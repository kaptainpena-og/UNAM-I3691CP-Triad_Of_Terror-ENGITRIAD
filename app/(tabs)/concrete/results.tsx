// app/(tabs)/concrete/results.tsx

import { BorderRadius, Colors, FontFamily, Spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ConcreteGrade = 'C15' | 'C20' | 'C25' | 'C30' | 'C35' | 'C40';

interface MixResult {
  volume: number;
  cement: number;
  sand: number;
  aggregate: number;
  water: number;
  wbRatio: number;
  targetMeanStrength: number;
  concreteGrade: ConcreteGrade;
}

// Grade → minimum characteristic strength (fck) — reserved for future advisory text expansion
const _GRADE_FCK: Record<ConcreteGrade, number> = {
  C15: 15, C20: 20, C25: 25, C30: 30, C35: 35, C40: 40,
};

// Advisory text per grade
function gradeAdvisory(grade: ConcreteGrade): string {
  const advisories: Record<ConcreteGrade, string> = {
    C15: 'Suitable for blinding, lightly loaded strip footings, and non-structural fill. Not recommended for reinforced elements.',
    C20: 'General-purpose grade for domestic slabs, paths, and lightly reinforced footings under normal exposure.',
    C25: 'Standard structural grade. Appropriate for suspended slabs, beams, and columns in mild to moderate exposure classes.',
    C30: 'Higher-strength structural grade for rafts, transfer slabs, and moderate chemical exposure (XC3/XD1 per SANS 10100).',
    C35: 'High-performance grade for heavily loaded elements, retaining walls, and marine splash zones.',
    C40: 'Demanding structural applications — prestressed elements, aggressive chemical or marine environments.',
  };
  return advisories[grade];
}

// Colour-code the w/b ratio quality
function wbColor(wb: number): string {
  if (wb <= 0.45) return '#22c55e';  // excellent
  if (wb <= 0.55) return '#eab308';  // acceptable
  return '#ef4444';                   // high — durability risk
}

export default function ConcreteResultsScreen() {
  const router = useRouter();
  const { result: resultParam } = useLocalSearchParams<{ result: string }>();

  // Guard against missing / malformed param
  if (!resultParam) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No results found</Text>
          <Text style={styles.errorBody}>Please go back and run the calculation first.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const result: MixResult = JSON.parse(resultParam);
  const { volume, cement, sand, aggregate, water, wbRatio, targetMeanStrength, concreteGrade } = result;

  const totalMass = cement + sand + aggregate + water;
  const wbCol = wbColor(wbRatio);

  // Proportions for the visual bar
  const cementPct   = totalMass > 0 ? (cement    / totalMass) * 100 : 0;
  const sandPct     = totalMass > 0 ? (sand      / totalMass) * 100 : 0;
  const aggregatePct= totalMass > 0 ? (aggregate / totalMass) * 100 : 0;
  const waterPct    = totalMass > 0 ? (water     / totalMass) * 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Mix Results</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeBadgeText}>{concreteGrade}</Text>
          </View>
        </View>

        {/* ── Volume summary ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{volume.toFixed(3)}</Text>
            <Text style={styles.summaryLabel}>m³ volume</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{targetMeanStrength}</Text>
            <Text style={styles.summaryLabel}>MPa target mean</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: wbCol }]}>{wbRatio.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>w/b ratio</Text>
          </View>
        </View>

        {/* ── Proportions bar ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Mix composition (by mass)</Text>
          <View style={styles.proportionBar}>
            <View style={[styles.barSegment, { flex: cementPct,   backgroundColor: '#DDA131' }]} />
            <View style={[styles.barSegment, { flex: sandPct,     backgroundColor: '#C4A882' }]} />
            <View style={[styles.barSegment, { flex: aggregatePct,backgroundColor: '#6B7280' }]} />
            <View style={[styles.barSegment, { flex: waterPct,    backgroundColor: '#38BDF8' }]} />
          </View>
          <View style={styles.legendRow}>
            <LegendDot color="#DDA131" label="Cement" />
            <LegendDot color="#C4A882" label="Sand" />
            <LegendDot color="#6B7280" label="Aggregate" />
            <LegendDot color="#38BDF8" label="Water" />
          </View>
        </View>

        {/* ── Quantities per pour ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Quantities for {volume.toFixed(3)} m³</Text>

          <QuantityRow icon="🪨" label="Cement (CEM I)"      value={cement}    unit="kg" color="#DDA131" />
          <QuantityRow icon="🟤" label="Fine aggregate (sand)"value={sand}      unit="kg" color="#C4A882" />
          <QuantityRow icon="⬛" label="Coarse agg. (20 mm)" value={aggregate} unit="kg" color="#6B7280" />
          <QuantityRow icon="💧" label="Water"                value={water}     unit="L"  color="#38BDF8" />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total batch mass</Text>
            <Text style={styles.totalValue}>{totalMass.toFixed(1)} kg</Text>
          </View>
        </View>

        {/* ── w/b ratio indicator ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Water-binder ratio</Text>
          <View style={styles.wbRow}>
            <Text style={[styles.wbValue, { color: wbCol }]}>{wbRatio.toFixed(2)}</Text>
            <Text style={styles.wbDesc}>
              {wbRatio <= 0.45
                ? 'Excellent durability'
                : wbRatio <= 0.55
                ? 'Acceptable — monitor curing'
                : 'High — increased permeability risk'}
            </Text>
          </View>
          {/* w/b track */}
          <View style={styles.wbTrack}>
            <View style={[styles.wbFill, {
              flex: Math.min(wbRatio, 0.70),
              backgroundColor: wbCol,
            }]} />
            <View style={{ flex: Math.max(0, 0.70 - wbRatio) }} />
          </View>
          <View style={styles.wbScaleRow}>
            <Text style={styles.wbScaleText}>0.35</Text>
            <Text style={styles.wbScaleText}>0.55</Text>
            <Text style={styles.wbScaleText}>0.70</Text>
          </View>
        </View>

        {/* ── Grade advisory ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Grade advisory — {concreteGrade}</Text>
          <Text style={styles.advisoryText}>{gradeAdvisory(concreteGrade)}</Text>
        </View>

        {/* ── Disclaimer ── */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ⚠️ Results are indicative only and are based on SANS 10100-1 mix design principles.
            They must not be used for structural design without review by a qualified professional engineer.
          </Text>
        </View>

        {/* ── Actions ── */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Recalculate</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Small helper components ────────────────────────────────────────────────────

function QuantityRow({
  icon, label, value, unit, color,
}: { icon: string; label: string; value: number; unit: string; color: string }) {
  return (
    <View style={styles.quantityRow}>
      <Text style={styles.quantityIcon}>{icon}</Text>
      <Text style={styles.quantityLabel}>{label}</Text>
      <Text style={[styles.quantityValue, { color }]}>
        {value.toFixed(1)} <Text style={styles.quantityUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  screenTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 26,
    color: Colors.text,
  },
  gradeBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  gradeBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.textOnPrimary,
  },

  // ── Summary row ──
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: Colors.text,
  },
  summaryLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },

  // ── Card ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },

  // ── Proportion bar ──
  proportionBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },

  // ── Quantity rows ──
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  quantityIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  quantityLabel: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.text,
  },
  quantityValue: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
  quantityUnit: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: Colors.text,
  },
  totalValue: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.primary,
  },

  // ── w/b ratio ──
  wbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  wbValue: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
  },
  wbDesc: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  wbTrack: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  wbFill: {
    height: '100%',
    borderRadius: 4,
  },
  wbScaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wbScaleText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },

  // ── Advisory ──
  advisoryText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },

  // ── Disclaimer ──
  disclaimerBox: {
    backgroundColor: '#1C1600',
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  disclaimerText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 18,
  },

  // ── Back button ──
  backButton: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.secondary,
  },

  // ── Error state ──
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  errorBody: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});
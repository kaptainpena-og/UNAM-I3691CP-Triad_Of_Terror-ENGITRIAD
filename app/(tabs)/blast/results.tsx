// app/(tabs)/blast/results.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BlastResults() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Safely capture incoming parameters passed via routing channels
  const q = parseFloat(params.chargePerHole as string) || 0;
  const N = parseFloat(params.holesDelay as string) || 0;
  const D = parseFloat(params.distance as string) || 1;
  const K = parseFloat(params.kConstant as string) || 682;
  const alpha = parseFloat(params.alphaConstant as string) || 1.6;

  // --- Analytical Structural Blasting Calculations ---
  const calculatedCPD = q * N;

  // Guard logic against division by zero errors during structural matrix loading
  const squareRootCPD = calculatedCPD > 0 ? Math.sqrt(calculatedCPD) : 1;
  const scaledDistance = D / squareRootCPD;

  // Formula 3 execution: PPV = K * (SD)^(-alpha)
  const predictedPPV = K * Math.pow(scaledDistance, -alpha);

  // Structural Danger Classification Limits (Based on ISEE standards for residential masonry)
  let diagnosticStatus = "SAFE";
  let designColorCode = "#22c55e";
  let technicalSummary =
    "Vibration levels remain safely within structural safety envelopes. High certainty of zero environmental damage risks.";

  if (predictedPPV >= 50.0) {
    diagnosticStatus = "IMMINENT FAILURE CRITICAL RISK";
    designColorCode = "#ef4444";
    technicalSummary =
      "Critical danger warning flag active! Severe structural cracks and masonry breakage probable. Immediately drop charge load arrays.";
  } else if (predictedPPV >= 19.0) {
    diagnosticStatus = "CAUTIONARY HAZARD ALERT";
    designColorCode = "#f97316";
    technicalSummary =
      "Threshold parameters border architectural tolerances. Prolonged exposure will result in cosmetic wall plaster fracturing.";
  } else if (predictedPPV >= 5.0) {
    diagnosticStatus = "MINIMAL WARNING TIERS";
    designColorCode = "#eab308";
    technicalSummary =
      "Vibrations will be strongly perceptible to nearby civilian occupants. Structural integrity remains secure.";
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>BLAST COMPLIANCE ANALYSIS</Text>
        <Text style={styles.appSubtitle}>
          PREDICTIVE WAVE VIBRATION OUTCOMES
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Core Calculated Velocity Results Panel */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            • CALCULATED PEAK PARTICLE VELOCITY
          </Text>
          <View style={styles.mainScoreWrapper}>
            <Text style={styles.velocityValueText}>
              {predictedPPV.toFixed(2)}
            </Text>
            <Text style={styles.velocityUnitText}>mm / s</Text>
          </View>
          <View
            style={[styles.statusBand, { backgroundColor: designColorCode }]}
          >
            <Text style={styles.statusBandText}>
              STRUCTURAL TIER: {diagnosticStatus}
            </Text>
          </View>
        </View>

        {/* Technical Intermediate Constants Display */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>• LOGISTIC GEOLOGY METRICS LOG</Text>

          <View style={styles.logItem}>
            <Text style={styles.logLabel}>Calculated Net Weight (CPD)</Text>
            <Text style={styles.logValue}>{calculatedCPD.toFixed(1)} kg</Text>
          </View>

          <View style={styles.logItem}>
            <Text style={styles.logLabel}>Computed Scaled Distance (SD)</Text>
            <Text style={styles.logValue}>
              {scaledDistance.toFixed(2)} m/kg^0.5
            </Text>
          </View>

          <View style={styles.logItem}>
            <Text style={styles.logLabel}>
              Geological Attenuation Ratio (K / α)
            </Text>
            <Text style={styles.logValue}>
              {K} / {alpha}
            </Text>
          </View>
        </View>

        {/* Dynamic Contextual Advisory Panel */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            • BLAST ENGINEERING ADVISORY RECOMMENDATIONS
          </Text>
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceContentText}>{technicalSummary}</Text>
          </View>
        </View>

        {/* Navigation Return Control Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            ◀ ADJUST PATTERN INITIAL DESIGN
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001122" },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#112944",
  },
  appTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#00bfff",
    letterSpacing: 1.2,
  },
  appSubtitle: { fontSize: 10, color: "#88aabb", marginTop: 2 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 40 },
  card: {
    backgroundColor: "#001a35",
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#112d4e",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#00bfff",
    marginBottom: 14,
  },
  mainScoreWrapper: { alignItems: "center", paddingVertical: 12 },
  velocityValueText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#ffffff",
    fontFamily: "monospace",
  },
  velocityUnitText: {
    fontSize: 12,
    color: "#88aabb",
    fontWeight: "bold",
    marginTop: 4,
  },
  statusBand: { padding: 8, borderRadius: 4, marginTop: 12 },
  statusBandText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  logItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#112544",
  },
  logLabel: { color: "#aabbcc", fontSize: 12 },
  logValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  guidanceBox: {
    backgroundColor: "#001122",
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#e67e22",
  },
  guidanceContentText: { color: "#ccddee", fontSize: 12, lineHeight: 18 },
  backButton: {
    borderColor: "#e67e22",
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  backButtonText: { color: "#e67e22", fontWeight: "bold", fontSize: 13 },
});

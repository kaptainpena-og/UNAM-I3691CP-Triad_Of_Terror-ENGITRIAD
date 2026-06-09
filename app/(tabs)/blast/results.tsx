// app/(tabs)/blast/results.tsx

import { Colors, FontFamily } from "@/constants/theme";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BlastResults() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  // Safely parse routing data fields from parameters channel
  const q = parseFloat(params.chargePerHole as string) || 18.0;
  const N = parseFloat(params.holesDelay as string) || 4;
  const D = parseFloat(params.distance as string) || 180;
  const K = parseFloat(params.kConstant as string) || 682;
  const alpha = parseFloat(params.alphaConstant as string) || 1.6;

  const blastLocation = (params.blastLocation as string) || "Block C • Zone 4";
  const date = (params.date as string) || "14/05/2025";

  // --- Analytical Structural Blasting Calculations ---
  const calculatedCPD = q * N;
  const squareRootCPD = calculatedCPD > 0 ? Math.sqrt(calculatedCPD) : 1;
  const scaledDistance = D / squareRootCPD;
  const predictedPPV = K * Math.pow(scaledDistance, -alpha);

  // Structural Danger Classification Limits
  let diagnosticStatus = "SAFE";
  let statusCardBg = "rgba(0, 212, 138, 0.08)";
  let statusCardBorder = "rgba(0, 212, 138, 0.2)";
  let checkboxBg = Colors.safe;
  let statusTextColor = Colors.safe;
  let checkMark = "✓";
  let technicalSummary =
    "PPV is within acceptable limits. Blast can proceed safely at this range.";

  if (predictedPPV >= 50.0) {
    diagnosticStatus = "CRITICAL RISK";
    statusCardBg = "rgba(255, 68, 102, 0.08)";
    statusCardBorder = "rgba(255, 68, 102, 0.2)";
    checkboxBg = Colors.high;
    statusTextColor = Colors.high;
    checkMark = "⚠️";
    technicalSummary =
      "Critical warning flag active! Severe structural cracks probable. Drop charge arrays.";
  } else if (predictedPPV >= 19.0) {
    diagnosticStatus = "HAZARD ALERT";
    statusCardBg = "rgba(255, 140, 0, 0.08)";
    statusCardBorder = "rgba(255, 140, 0, 0.2)";
    checkboxBg = Colors.moderate;
    statusTextColor = Colors.moderate;
    checkMark = "⚠";
    technicalSummary =
      "Vibrations border architectural tolerances. Drop delay configurations.";
  }

  // --- Automated PDF Document Assembly Engine ---
  const handleExportPDF = async () => {
    setIsExporting(true);
    const htmlMarkup = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Blast Compliance Engineering Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; padding: 30px; line-height: 1.5; }
            .header { border-bottom: 3px solid #0F172A; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0F172A; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 12px; color: #64748B; letter-spacing: 1px; text-transform: uppercase; margin-top: 5px; }
            .meta-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
            .hero-metric { background-color: #0F172A; color: #FFFFFF; text-align: center; padding: 30px; border-radius: 12px; margin-bottom: 25px; }
            .hero-val { font-size: 52px; font-weight: bold; color: #F59E0B; margin: 0; }
            .hero-unit { font-size: 16px; color: #94A3B8; }
            .status-bar { padding: 12px; border-radius: 6px; font-weight: bold; text-align: center; margin-bottom: 25px; font-size: 14px; color: #FFFFFF; }
            .status-safe { background-color: #166534; }
            .status-warn { background-color: #9A3412; }
            .status-critical { background-color: #991B1B; }
            .grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 25px; }
            .card { flex: 1; min-width: 45%; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; }
            .card-lbl { font-size: 10px; color: #64748B; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .card-val { font-size: 18px; font-weight: bold; color: #0F172A; }
            .formula-box { background-color: #FAFAFA; border-left: 4px solid #64748B; padding: 15px; font-family: monospace; font-size: 13px; margin-top: 30px; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">BlastGuard Compliance Analysis</h1>
            <div class="subtitle">Predictive Wave Vibration Technical Outcome Report</div>
          </div>

          <div class="meta-box">
            <strong>Blast Site Target Location:</strong> ${blastLocation}<br/>
            <strong>Operation Date:</strong> ${date}
          </div>

          <div class="hero-metric">
            <div class="hero-lbl" style="font-size: 11px; letter-spacing: 1px; color: #94A3B8;">PREDICTED PEAK PARTICLE VELOCITY</div>
            <div class="hero-val">${predictedPPV.toFixed(2)}<span class="hero-unit"> mm/s</span></div>
          </div>

          <div class="status-bar ${predictedPPV >= 50.0 ? "status-critical" : predictedPPV >= 19.0 ? "status-warn" : "status-safe"}">
            STRUCTURAL EVALUATION TIER STATUS: ${diagnosticStatus}
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-lbl">Charge Per Delay (CPD)</div>
              <div class="card-val">${calculatedCPD.toFixed(1)} kg</div>
            </div>
            <div class="card">
              <div class="card-lbl">Scaled Distance (SD)</div>
              <div class="card-val">${scaledDistance.toFixed(2)} m/vkg</div>
            </div>
            <div class="card">
              <div class="card-lbl">Site Regression Constant (K)</div>
              <div class="card-val">${K}</div>
            </div>
            <div class="card">
              <div class="card-lbl">Attenuation Exponent (alpha)</div>
              <div class="card-val">${alpha}</div>
            </div>
          </div>

          <div class="formula-box">
            <strong>MATHEMATICAL ATTENUATION BREAKDOWN:</strong><br/><br/>
            1. CPD Formula: ${q.toFixed(1)} kg × ${N} holes = ${calculatedCPD.toFixed(1)} kg<br/>
            2. SD Formula: ${D}m / √${calculatedCPD.toFixed(1)}kg = ${scaledDistance.toFixed(2)} m/vkg<br/>
            3. PPV Formula: ${K} × (${scaledDistance.toFixed(2)})^-${alpha} = <strong>${predictedPPV.toFixed(2)} mm/s</strong>
          </div>

          <div class="footer">
            Disclaimer: Ground wave propagation yields variations based on site geophysics; calculations are indicative predictive metrics only.
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlMarkup });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export Blast Wave Report" });
      } else {
        Alert.alert("System Notification", "File generated successfully context path: " + uri);
      }
    } catch (_err) {
      Alert.alert("System Error Alert", "Failed to properly generate and export PDF file report metrics.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header View Structure matching screen mockup */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.back()}>
          <Text style={styles.menuIconText}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RESULTS</Text>
        <TouchableOpacity style={styles.headerActionCircle} onPress={handleExportPDF}>
          <Text style={styles.actionIconText}>PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Main Predicted PPV Display Hero Card with Integrated Meta Data */}
        <View style={styles.heroCard}>
          <Text style={styles.heroSubLabel}>PREDICTED PPV</Text>
          <View style={styles.heroValueRow}>
            <Text style={[styles.heroValueText, { color: statusTextColor }]}>{predictedPPV.toFixed(1)}</Text>
            <Text style={styles.heroUnitText}>mm/s</Text>
          </View>
          <Text style={styles.heroMetaText}>
            {blastLocation}  ·  {date}
          </Text>
        </View>

        {/* 2x2 Grid Layout of Intermediate Metric Parameters */}
        <View style={styles.gridContainer}>
          <View style={styles.row}>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>CHARGE PER DELAY</Text>
              <Text style={styles.gridValue}>
                {calculatedCPD.toFixed(0)} <Text style={styles.gridUnit}>kg</Text>
              </Text>
            </View>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>SCALED DISTANCE</Text>
              <Text style={styles.gridValue}>
                {scaledDistance.toFixed(1)} <Text style={styles.gridUnit}>m/vkg</Text>
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>K CONSTANT</Text>
              <Text style={styles.gridValue}>{K.toFixed(0)}</Text>
            </View>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>α EXPONENT</Text>
              <Text style={styles.gridValue}>{alpha.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Status Indicator Compliance Panel */}
        <View style={[styles.statusCard, { backgroundColor: statusCardBg, borderColor: statusCardBorder }]}>
          <View style={[styles.checkboxContainer, { backgroundColor: checkboxBg }]}>
            <Text style={styles.checkboxIcon}>{checkMark}</Text>
          </View>
          <View style={styles.statusTextContent}>
            <Text style={[styles.statusTitle, { color: statusTextColor }]}>{diagnosticStatus}</Text>
            <Text style={styles.statusDesc}>{technicalSummary}</Text>
          </View>
        </View>

        {/* Analytical Wave Math Formula Breakdown Box */}
        <View style={styles.formulaSection}>
          <Text style={styles.formulaHeading}>FORMULA BREAKDOWN</Text>
          <Text style={styles.formulaLine}>
            CPD = {q.toFixed(1)} × {N} ={" "}
            <Text style={styles.highlightText}>{calculatedCPD.toFixed(0)} kg</Text>
          </Text>
          <Text style={styles.formulaLine}>
            SD = {D} / √{calculatedCPD.toFixed(0)} ={" "}
            <Text style={styles.highlightText}>{scaledDistance.toFixed(1)} m/vkg</Text>
          </Text>
          <Text style={styles.formulaLine}>
            PPV = {K} × {scaledDistance.toFixed(1)}
            <Text style={{ fontSize: 10 }}>-{alpha.toFixed(1)}</Text> ={" "}
            <Text style={[styles.successHighlight, { color: statusTextColor }]}>
              {predictedPPV.toFixed(1)} mm/s
            </Text>
          </Text>
        </View>

        {/* Screen Bottom Multi-Action Control Dashboard Matrix */}
        <View style={styles.actionGridRow}>
          <TouchableOpacity 
            style={[styles.exportPdfButton, isExporting && { opacity: 0.6 }]} 
            onPress={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={Colors.secondary} />
            ) : (
              <Text style={styles.exportButtonText}>📄 Export PDF</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBlastButton} onPress={() => router.replace("/(tabs)/blast")}>
            <Text style={styles.newBlastButtonText}>🔄 New Blast</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.trendNavigationButton} onPress={() => router.replace({ pathname: "/(tabs)/blast", params: { tab: "trend" } })}>
          <Text style={styles.trendButtonText}>📈 View PPV Trend for this Location</Text>
        </TouchableOpacity>

        {/* Mandatory Compliance Disclaimer */}
        <Text style={styles.disclaimerText}>
          Disclaimer: Ground wave propagation yields variations based on site geophysics; calculations are indicative predictive metrics only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.cardDeep },
  container: { flex: 1, backgroundColor: Colors.secondary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.cardDeep,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuButton: { padding: 4 },
  menuIconText: { color: Colors.text, fontSize: 28, fontWeight: "300" },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 18, color: Colors.text, letterSpacing: 1.5 },
  headerActionCircle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.cardMid,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIconText: { 
    color: Colors.text, 
    fontSize: 11, 
    fontFamily: FontFamily.bold 
  },
  heroCard: {
    backgroundColor: Colors.cardDeep,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(221, 161, 49, 0.12)",
  },
  heroSubLabel: { fontFamily: FontFamily.medium, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  heroValueRow: { flexDirection: "row", alignItems: "baseline" },
  heroValueText: { fontFamily: FontFamily.bold, fontSize: 68 },
  heroUnitText: { fontFamily: FontFamily.regular, fontSize: 18, color: Colors.textMuted, marginLeft: 6 },
  heroMetaText: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  gridContainer: { marginTop: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.cardDeep,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridLabel: { fontFamily: FontFamily.medium, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  gridValue: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.text },
  gridUnit: { fontSize: 12, color: Colors.textMuted, fontFamily: FontFamily.regular },
  statusCard: { flexDirection: "row", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 6, borderWidth: 1 },
  checkboxContainer: { width: 24, height: 24, borderRadius: 6, justifyContent: "center", alignItems: "center", marginRight: 14 },
  checkboxIcon: { color: Colors.text, fontSize: 14, fontWeight: "bold" },
  statusTextContent: { flex: 1 },
  statusTitle: { fontFamily: FontFamily.bold, fontSize: 14, letterSpacing: 0.5 },
  statusDesc: { fontFamily: FontFamily.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2, lineHeight: 15 },
  formulaSection: {
    backgroundColor: Colors.cardDeep,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formulaHeading: { fontFamily: FontFamily.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1, marginBottom: 10 },
  formulaLine: { fontFamily: FontFamily.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  highlightText: { color: Colors.primary, fontFamily: FontFamily.medium },
  successHighlight: { fontFamily: FontFamily.bold },
  actionGridRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  exportPdfButton: {
    flex: 1.1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 12,
    justifyContent: "center"
  },
  exportButtonText: { fontFamily: FontFamily.bold, color: Colors.secondary, fontSize: 14 },
  newBlastButton: {
    flex: 0.9,
    backgroundColor: Colors.cardDeep,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center"
  },
  newBlastButtonText: { fontFamily: FontFamily.bold, color: Colors.text, fontSize: 14 },
  trendNavigationButton: {
    backgroundColor: Colors.cardDeep,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trendButtonText: { fontFamily: FontFamily.bold, color: Colors.text, fontSize: 13 },
  disclaimerText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 14,
    marginTop: 24,
    paddingHorizontal: 10,
  },
});
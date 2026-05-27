// app/(tabs)/corrosion/results.tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface MetalData {
  name: string;
  density: number;
  mass: number;
  electrons: number;
  ea: string;
  numericEa: number;
  bConstant: number;
}

const METAL_METRICS: Record<string, MetalData> = {
  'Carbon Steel (Fe)':  { name: 'Carbon Steel (Fe)',  density: 7.85, mass: 55.85, electrons: 2, ea: '45-60', numericEa: 52500, bConstant: 26 },
  'Stainless Steel 316':{ name: 'Stainless Steel 316',density: 8.00, mass: 55.85, electrons: 2, ea: '60-80', numericEa: 70000, bConstant: 52 },
  'Aluminium (Al)':     { name: 'Aluminium (Al)',     density: 2.70, mass: 26.98, electrons: 3, ea: '35-55', numericEa: 45000, bConstant: 26 },
  'Copper (Cu)':        { name: 'Copper (Cu)',        density: 8.96, mass: 63.55, electrons: 2, ea: '50-65', numericEa: 57500, bConstant: 52 },
  'Zinc (Zn)':          { name: 'Zinc (Zn)',          density: 7.13, mass: 65.38, electrons: 2, ea: '40-55', numericEa: 47500, bConstant: 26 },
  'Nickel (Ni)':        { name: 'Nickel (Ni)',        density: 8.91, mass: 58.69, electrons: 2, ea: '55-70', numericEa: 62500, bConstant: 52 },
};

export default function CorrosionResults() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const metalType           = (params.metalType as string)        || 'Carbon Steel (Fe)';
  const environmentType     = (params.environmentType as string)  || 'Immersed / Aqueous';
  const selectedCorrosionType = (params.corrosionType as string)  || 'Uniform Corrosion';
  const pH                  = parseFloat(params.pH as string)         || 7.0;
  const temperature         = parseFloat(params.temperature as string) || 25.0;
  const chloride            = parseFloat(params.chloride as string)    || 0.0;
  const dissolvedOxygen     = parseFloat(params.dissolvedOxygen as string) || 8.0;
  const tWall               = parseFloat(params.tWall as string)       || 5.0;
  const tMin                = parseFloat(params.tMin as string)        || 0.0;
  const labMode             = params.labMode === 'true';
  const advancedMode        = params.advancedMode === 'true';
  const massLoss            = parseFloat(params.massLoss as string)    || 0.0;
  const exposedArea         = parseFloat(params.exposedArea as string) || 1.0;
  const exposureTime        = parseFloat(params.exposureTime as string)|| 1.0;
  const polarisationResistance = parseFloat(params.polarisationResistance as string) || 1.0;

  const metal = METAL_METRICS[metalType] || METAL_METRICS['Carbon Steel (Fe)'];

  let baseCR = 0.05;
  let intermediateICorr = '';

  if (labMode && massLoss > 0) {
    const K_mm_year = 8.76e4;
    baseCR = (K_mm_year * massLoss) / (exposedArea * exposureTime * metal.density);
  } else if (advancedMode && polarisationResistance > 0) {
    const i_corr = (metal.bConstant * 1000) / polarisationResistance;
    intermediateICorr = `${i_corr.toFixed(2)} μA/cm²`;
    baseCR = (i_corr * metal.mass * 0.00327) / (metal.electrons * metal.density);
  } else {
    if (environmentType === 'Marine')      baseCR = 0.25;
    if (environmentType === 'Atmospheric') baseCR = 0.02;
    if (environmentType === 'Buried')      baseCR = 0.04;
  }

  const R = 8.314;
  const TK_base    = 25.0 + 273.15;
  const TK_current = temperature + 273.15;
  const arrheniusFactor = Math.exp((-metal.numericEa / R) * (1 / TK_current - 1 / TK_base));
  let finalCR = baseCR * arrheniusFactor;

  if (pH < 4.0) {
    finalCR *= (1.0 + Math.pow(10, 4.0 - pH) * 0.2);
  } else if (pH > 10.0 && (metalType.includes('Aluminium') || metalType.includes('Zinc'))) {
    finalCR *= (1.0 + (pH - 10.0) * 0.5);
  }

  if (environmentType !== 'Atmospheric' && dissolvedOxygen > 0) {
    finalCR *= Math.pow(dissolvedOxygen / 8.0, 0.5);
  }

  const finalCR_mpy = finalCR * 39.37;

  let dominantType    = selectedCorrosionType;
  let pittingRiskFlag = false;
  if (chloride > 200.0) { pittingRiskFlag = true; dominantType = 'Pitting Dominant'; }

  const totalLifespan = finalCR > 0 ? tWall / finalCR : 999;
  const safeLifespan  = (finalCR > 0 && tMin > 0 && tWall > tMin) ? (tWall - tMin) / finalCR : totalLifespan;

  let pHLevelLabel = 'LOW'; let pHAffiliatedColor = '#22c55e';
  if (pH <= 2.0)       { pHLevelLabel = 'EXTREME';       pHAffiliatedColor = '#ef4444'; }
  else if (pH <= 4.0)  { pHLevelLabel = 'HIGH';          pHAffiliatedColor = '#f97316'; }
  else if (pH < 7.0)   { pHLevelLabel = 'MODERATE';      pHAffiliatedColor = '#eab308'; }
  else if (pH > 10.0)  { pHLevelLabel = 'MODERATE-HIGH'; pHAffiliatedColor = '#f97316'; }

  let thermalLabel = 'Low'; let thermalColor = '#22c55e';
  if (temperature > 80)       { thermalLabel = 'High';     thermalColor = '#ef4444'; }
  else if (temperature >= 40) { thermalLabel = 'Moderate'; thermalColor = '#eab308'; }

  let mitigationGuidance = 'Apply structural protective primers and check regular thickness logs.';
  if (pittingRiskFlag)   mitigationGuidance = 'High Halide risk detected! Upgrade to high PREN stainless alloys or inject localized chemical corrosion inhibitors.';
  else if (pH < 4.0)     mitigationGuidance = 'Critical acid limits met. Incorporate heavy duty polymer barrier coatings or isolate components with alkaline neutralization agents.';
  else if (finalCR > 0.3) mitigationGuidance = 'Accelerated degradation noted. Implement active sacrificial cathodic zinc blocks or structural surface cladding.';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>DIAGNOSTICS & RESULTS</Text>
        <Text style={styles.appSubtitle}>CORE METALLURGICAL EVALUATION ANALYSIS</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>• COMPUTERIZED CORROSION RATE</Text>
          <View style={styles.resultMetricsRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricHighlightText}>{finalCR.toFixed(4)}</Text>
              <Text style={styles.metricLabelText}>mm / year</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.metricBlock}>
              <Text style={styles.metricHighlightText}>{finalCR_mpy.toFixed(2)}</Text>
              <Text style={styles.metricLabelText}>mpy (mils / year)</Text>
            </View>
          </View>
          {intermediateICorr !== '' && (
            <View style={styles.intermediateDataRow}>
              <Text style={styles.intermediateLabel}>Calculated Current Density (i_corr):</Text>
              <Text style={styles.intermediateValue}>{intermediateICorr}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>• ESTIMATED OPERATIONAL WINDOWS</Text>
          <View style={styles.dataLogItem}>
            <Text style={styles.dataLabel}>Total Lifespan (Penetration Limit)</Text>
            <Text style={styles.dataValue}>{totalLifespan.toFixed(1)} Years</Text>
          </View>
          <View style={styles.dataLogItem}>
            <Text style={styles.dataLabel}>Safe Window (Until Minimum t_min)</Text>
            <Text style={[styles.dataValue, { color: '#e67e22' }]}>{safeLifespan.toFixed(1)} Years</Text>
          </View>
          <View style={styles.timelineTrack}>
            <View style={[styles.timelineSafeFill,   { flex: Math.max(0.1, safeLifespan / totalLifespan) }]} />
            <View style={[styles.timelineDangerFill,  { flex: Math.max(0.0, 1 - safeLifespan / totalLifespan) }]} />
          </View>
          <Text style={styles.helperCaptionText}>* Orange region highlights operating threshold before breach.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>• SYSTEM ANOMALIES & THREAT LOGS</Text>
          <View style={styles.dataLogItem}>
            <Text style={styles.dataLabel}>Dominant Mechanism Mode</Text>
            <Text style={[styles.dataValue, pittingRiskFlag && { color: '#ef4444', fontWeight: 'bold' }]}>
              {dominantType.toUpperCase()}
            </Text>
          </View>
          <View style={styles.dataLogItem}>
            <Text style={styles.dataLabel}>pH Threat Classification</Text>
            <Text style={[styles.statusPillText, { backgroundColor: pHAffiliatedColor }]}>
              {pHLevelLabel} (pH {pH.toFixed(1)})
            </Text>
          </View>
          <View style={styles.dataLogItem}>
            <Text style={styles.dataLabel}>Thermal Stress Zone</Text>
            <Text style={[styles.statusPillText, { backgroundColor: thermalColor }]}>
              {thermalLabel.toUpperCase()} ({temperature}°C)
            </Text>
          </View>
          {pittingRiskFlag && (
            <View style={styles.pittingWarningBlock}>
              <Text style={styles.warningAlertText}>⚠️ CRITICAL CHLORIDE ANOMALY FLAG DETECTED</Text>
              <Text style={styles.warningDescriptionText}>
                Chloride levels exceed {chloride} ppm. Localized pit formation voids bulk thickness estimations.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>• REINFORCEMENT RECOMMENDATIONS</Text>
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceBodyText}>{mitigationGuidance}</Text>
          </View>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ⚠️ Results are indicative only. Do not use for structural safety sign-off without review by a qualified professional engineer.
          </Text>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>◀ RETURN TO ESTIMATOR FORM</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#001122' },
  header:               { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#112944' },
  appTitle:             { fontSize: 19, fontWeight: '900', color: '#00bfff', letterSpacing: 1.5 },
  appSubtitle:          { fontSize: 10, color: '#88aabb', marginTop: 2, letterSpacing: 0.5 },
  scrollContainer:      { flex: 1 },
  scrollContent:        { padding: 12, paddingBottom: 40 },
  card:                 { backgroundColor: '#001a35', borderRadius: 8, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#112d4e' },
  cardTitle:            { fontSize: 12, fontWeight: 'bold', color: '#00bfff', marginBottom: 14, letterSpacing: 0.5 },
  resultMetricsRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  metricBlock:          { flex: 1, alignItems: 'center' },
  metricHighlightText:  { fontSize: 28, fontWeight: '900', color: '#ffffff', fontFamily: 'monospace' },
  metricLabelText:      { fontSize: 11, color: '#88aabb', marginTop: 4, fontWeight: '600' },
  verticalDivider:      { width: 1, height: 50, backgroundColor: '#224466' },
  intermediateDataRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#112544' },
  intermediateLabel:    { color: '#88aabb', fontSize: 11 },
  intermediateValue:    { color: '#4ade80', fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' },
  dataLogItem:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#112544' },
  dataLabel:            { color: '#aabbcc', fontSize: 12 },
  dataValue:            { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  statusPillText:       { color: '#ffffff', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  timelineTrack:        { height: 10, backgroundColor: '#112233', borderRadius: 5, flexDirection: 'row', marginTop: 14, overflow: 'hidden' },
  timelineSafeFill:     { backgroundColor: '#22c55e' },
  timelineDangerFill:   { backgroundColor: '#e67e22' },
  helperCaptionText:    { color: '#667788', fontSize: 10, marginTop: 6, fontStyle: 'italic' },
  pittingWarningBlock:  { backgroundColor: '#3b1010', borderColor: '#7f1d1d', borderWidth: 1, borderRadius: 6, padding: 10, marginTop: 12 },
  warningAlertText:     { color: '#f87171', fontSize: 11, fontWeight: 'bold' },
  warningDescriptionText:{ color: '#fca5a5', fontSize: 11, marginTop: 2, lineHeight: 15 },
  guidanceBox:          { backgroundColor: '#001122', borderRadius: 6, padding: 12, borderLeftWidth: 3, borderLeftColor: '#e67e22' },
  guidanceBodyText:     { color: '#ccddee', fontSize: 12, lineHeight: 17 },
  disclaimerBox:        { backgroundColor: '#1a1200', borderColor: '#7a5800', borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 14 },
  disclaimerText:       { color: '#f0b429', fontSize: 11, lineHeight: 16 },
  backButton:           { borderColor: '#e67e22', borderWidth: 1.5, borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  backButtonText:       { color: '#e67e22', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
});
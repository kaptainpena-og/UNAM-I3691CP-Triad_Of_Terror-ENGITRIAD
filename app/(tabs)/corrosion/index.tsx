// app/(tabs)/corrosion/index.tsx

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export const METAL_PROPERTIES = [
  { name: 'Carbon Steel (Fe)', density: 7.85, mass: 55.85, electrons: 2, ea: '45-60' },
  { name: 'Stainless Steel 316', density: 8.00, mass: 55.85, electrons: 2, ea: '60-80' },
  { name: 'Aluminium (Al)', density: 2.70, mass: 26.98, electrons: 3, ea: '35-55' },
  { name: 'Copper (Cu)', density: 8.96, mass: 63.55, electrons: 2, ea: '50-65' },
  { name: 'Zinc (Zn)', density: 7.13, mass: 65.38, electrons: 2, ea: '40-55' },
  { name: 'Nickel (Ni)', density: 8.91, mass: 58.69, electrons: 2, ea: '55-70' },
];

export const GALVANIC_SERIES: Record<string, number> = {
  'Carbon Steel (Fe)': -0.44,
  'Stainless Steel 316': -0.10,
  'Aluminium (Al)': -0.66,
  'Copper (Cu)': 0.34,
  'Zinc (Zn)': -0.76,
  'Nickel (Ni)': -0.23,
};

export default function CorrosionIndex() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Estimate' | 'Formulas' | 'Galvanic' | 'Metal Reference'>('Estimate');

  const [metalType, setMetalType] = useState('Carbon Steel (Fe)');
  const [environmentType, setEnvironmentType] = useState('Immersed / Aqueous');
  const [corrosionType, setCorrosionType] = useState('Uniform Corrosion');
  const [pH, setPH] = useState('7.0');
  const [temperature, setTemperature] = useState('25');
  const [chloride, setChloride] = useState('0');
  const [dissolvedOxygen, setDissolvedOxygen] = useState('8');
  const [tWall, setTWall] = useState('5.0');
  const [tMin, setTMin] = useState('4.0');

  const [labMode, setLabMode] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  const [massLoss, setMassLoss] = useState('');
  const [exposedArea, setExposedArea] = useState('');
  const [exposureTime, setExposureTime] = useState('');
  const [polarisationResistance, setPolarisationResistance] = useState('');

  const [galvanicMetal1, setGalvanicMetal1] = useState('Aluminium (Al)');
  const [galvanicMetal2, setGalvanicMetal2] = useState('Copper (Cu)');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const numericPH = parseFloat(pH) || 7.0;
  let pHBgColor = '#22c55e';
  let pHRiskText = 'LOW';
  if (numericPH < 2) { pHBgColor = '#ef4444'; pHRiskText = 'EXTREME'; }
  else if (numericPH < 4) { pHBgColor = '#f97316'; pHRiskText = 'HIGH'; }
  else if (numericPH < 7) { pHBgColor = '#eab308'; pHRiskText = 'MODERATE'; }
  else if (numericPH > 10) { pHBgColor = '#f97316'; pHRiskText = 'MODERATE-HIGH'; }

  const handleCalculate = () => {
    const newErrors: Record<string, string> = {};
    const parsedPH = parseFloat(pH);
    const parsedTemp = parseFloat(temperature);
    const parsedWall = parseFloat(tWall);

    if (isNaN(parsedPH) || parsedPH < 0 || parsedPH > 14) {
      newErrors.pH = 'Validation Error: pH boundary constraints require values between 0.0 and 14.0';
    }
    if (isNaN(parsedTemp)) newErrors.temperature = 'Temperature value is required';
    if (isNaN(parsedWall) || parsedWall <= 0) newErrors.tWall = 'Valid structural current wall thickness is required';

    if (labMode) {
      if (!massLoss || parseFloat(massLoss) <= 0) newErrors.massLoss = 'Mass loss W (g) must be greater than zero';
      if (!exposedArea || parseFloat(exposedArea) <= 0) newErrors.exposedArea = 'Exposed Area A (cm²) must be greater than zero';
      if (!exposureTime || parseFloat(exposureTime) <= 0) newErrors.exposureTime = 'Exposure Time T (h) must be greater than zero';
    }

    if (advancedMode && (!polarisationResistance || parseFloat(polarisationResistance) <= 0)) {
      newErrors.polarisationResistance = 'Polarisation Resistance Rp is required for electrochemical diagnostics';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    router.push({
      pathname: '/corrosion/results',
      params: {
        metalType, environmentType, corrosionType, pH, temperature, chloride,
        dissolvedOxygen, tWall, tMin, secondMetal: galvanicMetal2,
        labMode: String(labMode), advancedMode: String(advancedMode),
        massLoss, exposedArea, exposureTime, polarisationResistance,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>CORROSION ESTIMATOR</Text>
        <Text style={styles.appSubtitle}>METALLURGY APP — RATE MODULE v2.0</Text>
      </View>

      <View style={styles.tabContainer}>
        {(['Estimate', 'Formulas', 'Galvanic', 'Metal Reference'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>

        {activeTab === 'Estimate' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>• METAL & ENVIRONMENT</Text>

              <Text style={styles.inputLabel}>METAL TYPE</Text>
              <View style={styles.pickerSubstitute}>
                {METAL_PROPERTIES.map((m) => (
                  <TouchableOpacity
                    key={m.name}
                    style={[styles.inlineSelector, metalType === m.name && styles.inlineSelectorActive]}
                    onPress={() => setMetalType(m.name)}
                  >
                    <Text style={styles.selectorText}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>ENVIRONMENT TYPE</Text>
              <View style={styles.pickerSubstitute}>
                {['Atmospheric', 'Immersed / Aqueous', 'Buried', 'Marine'].map((env) => (
                  <TouchableOpacity
                    key={env}
                    style={[styles.inlineSelector, environmentType === env && styles.inlineSelectorActive]}
                    onPress={() => setEnvironmentType(env)}
                  >
                    <Text style={styles.selectorText}>{env}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enable Lab Test Mode (Weight Loss Method)</Text>
              <Switch value={labMode} onValueChange={setLabMode} thumbColor="#00bfff" trackColor={{ false: '#223344', true: '#004488' }} />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enable Advanced Mode (Electrochemical LPR)</Text>
              <Switch value={advancedMode} onValueChange={setAdvancedMode} thumbColor="#00bfff" trackColor={{ false: '#223344', true: '#004488' }} />
            </View>

            {labMode && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>• LAB EXPERIMENTAL DATA INPUTS</Text>

                <Text style={styles.inputLabel}>MASS LOSS W (g)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={massLoss} onChangeText={setMassLoss} placeholder="e.g. 0.15" placeholderTextColor="#667788" />
                {errors.massLoss && <Text style={styles.errorText}>{errors.massLoss}</Text>}

                <Text style={styles.inputLabel}>EXPOSED SURFACE AREA A (cm²)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={exposedArea} onChangeText={setExposedArea} placeholder="e.g. 25.0" placeholderTextColor="#667788" />
                {errors.exposedArea && <Text style={styles.errorText}>{errors.exposedArea}</Text>}

                <Text style={styles.inputLabel}>EXPOSURE TIME T (hours)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={exposureTime} onChangeText={setExposureTime} placeholder="e.g. 720" placeholderTextColor="#667788" />
                {errors.exposureTime && <Text style={styles.errorText}>{errors.exposureTime}</Text>}
              </View>
            )}

            {advancedMode && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>• ELECTROCHEMICAL DIAGNOSTICS</Text>
                <Text style={styles.inputLabel}>POLARISATION RESISTANCE Rp (Ω·cm²)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={polarisationResistance} onChangeText={setPolarisationResistance} placeholder="e.g. 3000" placeholderTextColor="#667788" />
                {errors.polarisationResistance && <Text style={styles.errorText}>{errors.polarisationResistance}</Text>}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>• ENVIRONMENTAL CONDITIONS</Text>

              <Text style={styles.inputLabel}>pH LEVEL [0 - 14]</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={pH} onChangeText={setPH} placeholder="7.0" placeholderTextColor="#667788" />
              <View style={[styles.riskIndicatorBand, { backgroundColor: pHBgColor }]}>
                <Text style={styles.riskIndicatorText}>pH Zone Threat Classification: {pHRiskText}</Text>
              </View>
              {errors.pH && <Text style={styles.errorText}>{errors.pH}</Text>}

              <Text style={styles.inputLabel}>TEMPERATURE (°C)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={temperature} onChangeText={setTemperature} placeholder="25" placeholderTextColor="#667788" />
              {errors.temperature && <Text style={styles.errorText}>{errors.temperature}</Text>}

              <Text style={styles.inputLabel}>CHLORIDE CONCENTRATION (ppm)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={chloride} onChangeText={setChloride} placeholder="0" placeholderTextColor="#667788" />
              {parseFloat(chloride) > 200 && (
                <Text style={styles.warnText}>⚠️ High Chloride Alert! Pitting threshold propagation triggered (&gt;200 ppm).</Text>
              )}

              {environmentType !== 'Atmospheric' && (
                <View>
                  <Text style={styles.inputLabel}>DISSOLVED OXYGEN (mg/L)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={dissolvedOxygen} onChangeText={setDissolvedOxygen} placeholder="8" placeholderTextColor="#667788" />
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>• COMPONENT GEOMETRY</Text>

              <Text style={styles.inputLabel}>CURRENT WALL THICKNESS t_wall (mm)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={tWall} onChangeText={setTWall} placeholder="5.0" placeholderTextColor="#667788" />
              {errors.tWall && <Text style={styles.errorText}>{errors.tWall}</Text>}

              <Text style={styles.inputLabel}>MIN. ALLOWABLE THICKNESS t_min (mm) [OPTIONAL]</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={tMin} onChangeText={setTMin} placeholder="3.0" placeholderTextColor="#667788" />
            </View>

            <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
              <Text style={styles.calculateButtonText}>▶ RUN ESTIMATION</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Formulas' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>• FORMULA SCHEMATICS & SYSTEM POLICIES</Text>

            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>1. Standard Corrosion Rate (Weight Loss Method)</Text>
              <Text style={styles.formulaExpression}>CR = (K × W) / (A × T × D)</Text>
              <Text style={styles.formulaDescription}>Converts physical gravimetric coupon mass decay into standardized volumetric loss over time.</Text>
            </View>

            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>2. Arrhenius Equation (Thermal Kinetic Influence)</Text>
              <Text style={styles.formulaExpression}>{"CR(T) = A × e^(-Ea / (R × TK))"}</Text>
              <Text style={styles.formulaDescription}>Modulates core base electrochemical degradation exponentially relative to temperature fluctuations.</Text>
            </View>

            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>3. Stern-Geary / Electrochemical Linear Polarization</Text>
              <Text style={styles.formulaExpression}>{"i_corr = B / Rp\nCR = (i_corr × M) / (n × F × D)"}</Text>
              <Text style={styles.formulaDescription}>Evaluates active galvanic density current directly derived from structural polarization resistance loops.</Text>
            </View>

            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>4. Localized Halide Acidification (pH & Chloride)</Text>
              <Text style={styles.formulaExpression}>{"CR_pH = k_pH × [H+]^n\nCR_pit = k_pit × [Cl]^0.5 × e^(-Ea_pit / (R × T))"}</Text>
              <Text style={styles.formulaDescription}>Quantifies accelerated cracking damage in environments saturated with chloride salts or acidic buffers.</Text>
            </View>
          </View>
        )}

        {activeTab === 'Galvanic' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>• GALVANIC COUPLING DIAGNOSTICS</Text>
            <Text style={styles.formulaDescription}> Select two contact candidate metals to map structural displacement risks.</Text>

            <Text style={styles.inputLabel}>METAL 1 (ANODE CANDIDATE)</Text>
            <View style={styles.pickerSubstitute}>
              {Object.keys(GALVANIC_SERIES).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.inlineSelector, galvanicMetal1 === m && styles.inlineSelectorActive]}
                  onPress={() => setGalvanicMetal1(m)}
                >
                  <Text style={styles.selectorText}>{m} ({GALVANIC_SERIES[m]} V)</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>METAL 2 (CATHODE CANDIDATE)</Text>
            <View style={styles.pickerSubstitute}>
              {Object.keys(GALVANIC_SERIES).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.inlineSelector, galvanicMetal2 === m && styles.inlineSelectorActive]}
                  onPress={() => setGalvanicMetal2(m)}
                >
                  <Text style={styles.selectorText}>{m} ({GALVANIC_SERIES[m]} V)</Text>
                </TouchableOpacity>
              ))}
            </View>

            {(() => {
              const pot1 = GALVANIC_SERIES[galvanicMetal1];
              const pot2 = GALVANIC_SERIES[galvanicMetal2];
              const diff = Math.abs(pot1 - pot2) * 1000;
              const anode = pot1 < pot2 ? galvanicMetal1 : galvanicMetal2;
              const cathode = pot1 >= pot2 ? galvanicMetal1 : galvanicMetal2;

              let severity = 'Negligible';
              let sevColor = '#22c55e';
              if (diff >= 500) { severity = 'Severe'; sevColor = '#ef4444'; }
              else if (diff >= 250) { severity = 'High'; sevColor = '#f97316'; }
              else if (diff >= 50) { severity = 'Low to Moderate'; sevColor = '#eab308'; }

              return (
                <View style={styles.galvanicResultBlock}>
                  <Text style={styles.galvanicTitle}>Potential Disparity: {diff.toFixed(0)} mV</Text>
                  <Text style={[styles.galvanicRiskText, { color: sevColor }]}>Risk Tier: {severity}</Text>
                  <Text style={styles.anodeLabel}>Sacrificial Anode (Corrodes): {anode}</Text>
                  <Text style={styles.cathodeLabel}>Protected Cathode (Stable): {cathode}</Text>
                </View>
              );
            })()}
          </View>
        )}

        {activeTab === 'Metal Reference' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>• METALLURGICAL CONSTANTS DICTIONARY</Text>

            <View style={styles.tableRowHeader}>
              <Text style={[styles.tableCellHeader, { flex: 2 }]}>Alloy</Text>
              <Text style={styles.tableCellHeader}>Density</Text>
              <Text style={styles.tableCellHeader}>Mass</Text>
              <Text style={styles.tableCellHeader}>Valency</Text>
              <Text style={styles.tableCellHeader}>Ea (kJ)</Text>
            </View>

            {METAL_PROPERTIES.map((metal, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.rowAlternate]}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{metal.name}</Text>
                <Text style={styles.tableCell}>{metal.density}</Text>
                <Text style={styles.tableCell}>{metal.mass}</Text>
                <Text style={styles.tableCell}>{metal.electrons}</Text>
                <Text style={styles.tableCell}>{metal.ea}</Text>
              </View>
            ))}

            <Text style={[styles.cardTitle, { marginTop: 20 }]}>• HALIDE SATURATION BOUNDARIES</Text>
            <Text style={styles.referenceText}>Tap Water Standard: &lt; 250 ppm</Text>
            <Text style={styles.referenceText}>Brackish Aquifer Matrix: 1,000 - 10,000 ppm</Text>
            <Text style={styles.referenceText}>Open Seawater Boundary: ~19,000 ppm</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001122' },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#112944' },
  appTitle: { fontSize: 20, fontWeight: '900', color: '#00bfff', letterSpacing: 1.5 },
  appSubtitle: { fontSize: 11, color: '#88aabb', marginTop: 2 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 10, backgroundColor: '#001633' },
  tabButton: { flex: 1, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20, backgroundColor: '#112544', alignItems: 'center' },
  activeTabButton: { backgroundColor: '#e67e22' },
  tabText: { fontSize: 11, color: '#aabbcc', fontWeight: '700' },
  activeTabText: { color: '#ffffff' },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: '#001a35', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#112d4e' },
  cardTitle: { fontSize: 13, fontWeight: 'bold', color: '#00bfff', marginBottom: 12, letterSpacing: 0.5 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#88aabb', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#001122', borderColor: '#224466', borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, color: '#ffffff', fontSize: 14 },
  pickerSubstitute: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4 },
  inlineSelector: { backgroundColor: '#112544', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, marginRight: 6, marginBottom: 6, borderWidth: 1, borderColor: '#224466' },
  inlineSelectorActive: { backgroundColor: '#00bfff', borderColor: '#ffffff' },
  selectorText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#001633', padding: 12, borderRadius: 6, marginBottom: 12 },
  toggleLabel: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  riskIndicatorBand: { padding: 6, borderRadius: 4, marginTop: 6 },
  riskIndicatorText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: '600' },
  warnText: { color: '#f97316', fontSize: 11, marginTop: 4, fontWeight: '600' },
  calculateButton: { backgroundColor: '#00bfff', borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  calculateButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  formulaItem: { borderBottomWidth: 1, borderBottomColor: '#112d4e', paddingBottom: 12, marginBottom: 12 },
  formulaName: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  formulaExpression: { fontFamily: 'monospace', color: '#e67e22', backgroundColor: '#001122', padding: 8, borderRadius: 4, marginVertical: 6, fontSize: 12 },
  formulaDescription: { color: '#aabbcc', fontSize: 11, lineHeight: 15 },
  galvanicResultBlock: { marginTop: 14, padding: 12, backgroundColor: '#001122', borderRadius: 6, borderLeftWidth: 4, borderLeftColor: '#00bfff' },
  galvanicTitle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  galvanicRiskText: { fontSize: 13, fontWeight: 'bold', marginVertical: 2 },
  anodeLabel: { color: '#f87171', fontSize: 11, marginTop: 4 },
  cathodeLabel: { color: '#4ade80', fontSize: 11 },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#112544', paddingVertical: 8, paddingHorizontal: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tableCellHeader: { flex: 1, color: '#00bfff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#112544' },
  rowAlternate: { backgroundColor: '#001f3f' },
  tableCell: { flex: 1, color: '#ffffff', fontSize: 11, textAlign: 'center' },
  referenceText: { color: '#aabbcc', fontSize: 12, marginVertical: 2 },
});
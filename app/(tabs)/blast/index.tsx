// app/(tabs)/blast/index.tsx

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

export default function BlastIndex() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Inputs' | 'Site Constants' | 'Blasting Guidelines'>('Inputs');

  const [chargePerHole, setChargePerHole] = useState('25.0');
  const [holesPerDelay, setHolesPerDelay] = useState('8');
  const [distanceToStructure, setDistanceToStructure] = useState('150');

  const [siteConstantK, setSiteConstantK] = useState('682');
  const [attenuationAlpha, setAttenuationAlpha] = useState('1.6');
  const [cpdLimit, setCpdLimit] = useState('300');

  const [useDefaultConstants, setUseDefaultConstants] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedQ = parseFloat(chargePerHole) || 0;
  const parsedN = parseFloat(holesPerDelay) || 0;
  const currentCPD = parsedQ * parsedN;

  const allowedCpdMax = parseFloat(cpdLimit) || 300;
  const isCpdOverLimit = currentCPD > allowedCpdMax;

  const handleRunPrediction = () => {
    const newErrors: Record<string, string> = {};
    const parsedD = parseFloat(distanceToStructure);
    const parsedK = parseFloat(siteConstantK);
    const parsedAlpha = parseFloat(attenuationAlpha);

    if (isNaN(parsedQ) || parsedQ <= 0) newErrors.chargePerHole = 'Charge per hole must be greater than zero.';
    if (isNaN(parsedN) || parsedN <= 0) newErrors.holesPerDelay = 'Hole count must be at least 1.';
    if (isNaN(parsedD) || parsedD <= 0) newErrors.distanceToStructure = 'Valid separation distance to building is required.';

    if (!useDefaultConstants) {
      if (isNaN(parsedK) || parsedK <= 0) newErrors.siteConstantK = 'Valid geological site constant K is required.';
      if (isNaN(parsedAlpha) || parsedAlpha <= 0) newErrors.attenuationAlpha = 'Valid site attenuation exponent is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    router.push({
      pathname: '/blast/results',
      params: {
        chargePerHole: String(parsedQ),
        holesPerDelay: String(parsedN),
        distanceToStructure: String(parsedD),
        siteConstantK: useDefaultConstants ? '682' : String(parsedK),
        attenuationAlpha: useDefaultConstants ? '1.6' : String(parsedAlpha),
        calculatedCPD: String(currentCPD),
        isCpdOverLimit: String(isCpdOverLimit),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>BLASTGUARD MODULE</Text>
        <Text style={styles.appSubtitle}>VIBRATION CONTROL & PPV PREDICTION SYSTEM</Text>
      </View>

      <View style={styles.tabContainer}>
        {(['Inputs', 'Site Constants', 'Blasting Guidelines'] as const).map((tab) => (
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

        {activeTab === 'Inputs' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>• HOLE GEOMETRY & LOADING SPECIFICATION</Text>

              <Text style={styles.inputLabel}>CHARGE PER HOLE - q (kg)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={chargePerHole} onChangeText={setChargePerHole} placeholder="e.g. 45.5" placeholderTextColor="#667788" />
              {errors.chargePerHole && <Text style={styles.errorText}>{errors.chargePerHole}</Text>}

              <Text style={styles.inputLabel}>NUMBER OF HOLES PER DELAY INTERVAL - N</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={holesPerDelay} onChangeText={setHolesPerDelay} placeholder="e.g. 4" placeholderTextColor="#667788" />
              {errors.holesPerDelay && <Text style={styles.errorText}>{errors.holesPerDelay}</Text>}

              <Text style={styles.inputLabel}>DISTANCE TO NEAREST ASSET STRUCTURE - D (m)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={distanceToStructure} onChangeText={setDistanceToStructure} placeholder="e.g. 250" placeholderTextColor="#667788" />
              {errors.distanceToStructure && <Text style={styles.errorText}>{errors.distanceToStructure}</Text>}
            </View>

            <View style={[styles.cpdResultCard, isCpdOverLimit && styles.cpdResultCardAlert]}>
              <Text style={styles.cpdCardLabel}>LIVE FIELD DEDUCTION: CHARGE PER DELAY (CPD)</Text>
              <Text style={styles.cpdValueText}>{currentCPD.toFixed(1)} kg</Text>
              <Text style={styles.cpdFormulaText}>Formula Reference: CPD = q × N</Text>
              {isCpdOverLimit && (
                <Text style={styles.cpdLimitWarningText}>⚠️ WARNING: Structural payload limits breached! Exceeds the {allowedCpdMax} kg safety cap threshold.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.calculateButton} onPress={handleRunPrediction}>
              <Text style={styles.calculateButtonText}>▶ RUN COMPLIANCE PREDICTION</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Site Constants' && (
          <View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enforce Standard Default Site Metrics (K=682, α=1.6)</Text>
              <Switch value={useDefaultConstants} onValueChange={setUseDefaultConstants} thumbColor="#00bfff" trackColor={{ false: '#223344', true: '#004488' }} />
            </View>

            {!useDefaultConstants && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>• EMPIRICAL SITE REGRESSION PROFILE</Text>

                <Text style={styles.inputLabel}>SITE TRANSMISSION CONSTANT - K (Geology dependent)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={siteConstantK} onChangeText={setSiteConstantK} placeholder="Typical range: 160 - 1800" placeholderTextColor="#667788" />
                {errors.siteConstantK && <Text style={styles.errorText}>{errors.siteConstantK}</Text>}

                <Text style={styles.inputLabel}>ATTENUATION EXPONENT / SLOPE COEFFICIENT - α</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={attenuationAlpha} onChangeText={setAttenuationAlpha} placeholder="Typical range: 1.2 - 2.0" placeholderTextColor="#667788" />
                {errors.attenuationAlpha && <Text style={styles.errorText}>{errors.attenuationAlpha}</Text>}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>• MAX PERMISSIBLE SITE SEVERITY CAP</Text>
              <Text style={styles.inputLabel}>CRITICAL CPD BOUNDARY CONSTRAINT VALUE (kg)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={cpdLimit} onChangeText={setCpdLimit} placeholder="300" placeholderTextColor="#667788" />
            </View>
          </View>
        )}

        {activeTab === 'Blasting Guidelines' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>• APPLIED MATHEMATICAL STANDARD SCHEMATICS</Text>

            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>1. Net Effective Energy Load Profile</Text>
              <Text style={styles.formulaExpression}>CPD = q × N</Text>
              <Text style={styles.formulaDescription}>
                Calculates the instantaneous explosive energy release sequence detonated inside an identical milli-second delay buffer window.
              </Text>
            </View>

            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>2. Ground Geometric Attenuation Ratio (Scaled Distance)</Text>
              <Text style={styles.formulaExpression}>{"SD = D / √CPD"}</Text>
              <Text style={styles.formulaDescription}>
                Normalizes relative geospatial distance against energy payloads. Governs peak shockwave dissipation models used in civil design regulations.
              </Text>
            </View>

            <View style={styles.formulaItem}>
              <Text style={styles.formulaName}>3. Predicted Peak Particle Velocity (USBM RI 8507 / ISEE)</Text>
              <Text style={styles.formulaExpression}>{"PPV = K × (SD)^(-α)"}</Text>
              <Text style={styles.formulaDescription}>
                Determines actual vector ground vibration wave speed passing a remote asset structure. Used directly to evaluate building damage probabilities.
              </Text>
            </View>
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
  tabText: { fontSize: 10, color: '#aabbcc', fontWeight: '700', textAlign: 'center' },
  activeTabText: { color: '#ffffff' },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: '#001a35', borderRadius: 8, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#112d4e' },
  cardTitle: { fontSize: 12, fontWeight: 'bold', color: '#00bfff', marginBottom: 12 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#88aabb', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#001122', borderColor: '#224466', borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, color: '#ffffff', fontSize: 14 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#001633', padding: 12, borderRadius: 6, marginBottom: 12 },
  toggleLabel: { color: '#ffffff', fontSize: 12, fontWeight: '600', flex: 1, marginRight: 8 },
  errorText: { color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: '600' },
  cpdResultCard: { backgroundColor: '#002211', borderColor: '#116633', borderWidth: 1, borderRadius: 6, padding: 16, marginBottom: 16 },
  cpdResultCardAlert: { backgroundColor: '#331111', borderColor: '#992222' },
  cpdCardLabel: { fontSize: 10, fontWeight: 'bold', color: '#aabbcc' },
  cpdValueText: { fontSize: 28, fontWeight: '900', color: '#f39c12', marginVertical: 4, fontFamily: 'monospace' },
  cpdFormulaText: { fontSize: 11, color: '#88aabb', fontStyle: 'italic' },
  cpdLimitWarningText: { color: '#f87171', fontSize: 11, fontWeight: 'bold', marginTop: 8 },
  calculateButton: { backgroundColor: '#00bfff', borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  calculateButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  formulaItem: { borderBottomWidth: 1, borderBottomColor: '#112d4e', paddingBottom: 12, marginBottom: 12 },
  formulaName: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  formulaExpression: { fontFamily: 'monospace', color: '#e67e22', backgroundColor: '#001122', padding: 8, borderRadius: 4, marginVertical: 6, fontSize: 12 },
  formulaDescription: { color: '#aabbcc', fontSize: 11, lineHeight: 15 },
});
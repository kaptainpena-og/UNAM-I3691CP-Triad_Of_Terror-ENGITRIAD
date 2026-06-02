// app/(tabs)/blast/index.tsx

import { Colors, FontFamily } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function NewBlastScreen() {
  const router = useRouter();

  // Form States (Pre-populated with your exact Figma design values for testing)
  const [blastLocation, setBlastLocation] = useState('Block C – Zone 4 (GPS)');
  const [date, setDate] = useState('14/05/2025');
  const [time, setTime] = useState('09:30');
  const [explosiveType, setExplosiveType] = useState('ANFO');
  const [holeDepth, setHoleDepth] = useState('8.5');
  const [chargePerHole, setChargePerHole] = useState('18.0');
  const [holesDelay, setHolesDelay] = useState('4');
  const [distance, setDistance] = useState('180');
  const [kConstant, setKConstant] = useState('682');
  const [alphaConstant, setAlphaConstant] = useState('1.6');

  // Computed State
  const [cpd, setCpd] = useState(72);

  // Automatically calculate CPD when dependent parameters change
  useEffect(() => {
    const q = parseFloat(chargePerHole) || 0;
    const n = parseFloat(holesDelay) || 0;
    setCpd(Math.round(q * n * 10) / 10);
  }, [chargePerHole, holesDelay]);

  const handleCalculatePPV = () => {
    // Navigate to results page passing all structural calculation inputs
    router.push({
      pathname: '/(tabs)/blast/results',
      params: {
        blastLocation,
        date,
        time,
        explosiveType,
        holeDepth,
        chargePerHole,
        holesDelay,
        distance,
        kConstant,
        alphaConstant,
        cpd: cpd.toString()
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Figma Header Navbar */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIconBar}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEW BLAST</Text>
        <TouchableOpacity style={styles.saveCircleButton}>
          <Text style={styles.saveIcon}>💾</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* SECTION 1: LOCATION & TIME */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>📍 LOCATION & TIME</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>BLAST LOCATION</Text>
            <View style={styles.inputWithIconContainer}>
              <Text style={styles.inlineIcon}>⛏️</Text>
              <TextInput
                style={[styles.input, { paddingLeft: 36, color: Colors.primary }]}
                value={blastLocation}
                onChangeText={setBlastLocation}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.fieldLabel}>DATE</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>TIME (24H)</Text>
              <TextInput
                style={styles.input}
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>
        </View>

        {/* SECTION 2: EXPLOSIVE PARAMETERS */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>💣 EXPLOSIVE PARAMETERS</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>EXPLOSIVE TYPE</Text>
            <TextInput
              style={styles.input}
              value={explosiveType}
              onChangeText={setExplosiveType}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.fieldLabel}>HOLE DEPTH (m)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={holeDepth}
                onChangeText={setHoleDepth}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>CHARGE / HOLE (kg)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={chargePerHole}
                onChangeText={setChargePerHole}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.fieldLabel}>HOLES / DELAY [N]</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={holesDelay}
                onChangeText={setHolesDelay}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>DISTANCE [m]</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={distance}
                onChangeText={setDistance}
              />
            </View>
          </View>
        </View>

        {/* SECTION 3: CPD PREVIEW */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>🔢 CPD PREVIEW</Text>
          <View style={styles.cpdRow}>
            <View>
              <Text style={styles.formulaText}>CPD = q × N</Text>
              <Text style={styles.formulaSubText}>Auto-calculated</Text>
            </View>
            <Text style={styles.cpdValue}>
              {cpd} <Text style={styles.cpdUnit}>kg</Text>
            </Text>
          </View>
        </View>

        {/* SECTION 4: SITE CONSTANTS */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionHeader}>⚙️ SITE CONSTANTS</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.fieldLabel}>K (DEFAULT: 682)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={kConstant}
                onChangeText={setKConstant}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>α (DEFAULT: 1.6)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={alphaConstant}
                onChangeText={setAlphaConstant}
              />
            </View>
          </View>

          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Using default site constants. Update with calibrated values from site regression analysis.
            </Text>
          </View>
        </View>

        {/* MAIN CALL TO ACTION ACTION BUTTON */}
        <TouchableOpacity style={styles.calculateButton} onPress={handleCalculatePPV}>
          <Text style={styles.calculateButtonText}>CALCULATE PPV →</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#02153A', // Direct deep Navy background matching design system context
  },
  container: {
    flex: 1,
    backgroundColor: '#02153A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    alignItems: 'center',
  },
  menuIconBar: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#00BCD4', // Precise cyan tint used in design accents
    letterSpacing: 1,
  },
  saveCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveIcon: {
    fontSize: 18,
  },
  cardSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Tinted transparent card base layers
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  sectionHeader: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.primary, // #DDA131 Amber token
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#757575',
    marginBottom: 6,
  },
  inputWithIconContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inlineIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#0c1a38',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  row: {
    flexDirection: 'row',
  },
  cpdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  formulaText: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: '#FFFFFF',
  },
  formulaSubText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#757575',
    marginTop: 2,
  },
  cpdValue: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.primary,
  },
  cpdUnit: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#757575',
  },
  warningContainer: {
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    borderRadius: 6,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 99, 0.15)',
  },
  warningText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#A0A0A0',
    lineHeight: 16,
  },
  calculateButton: {
    backgroundColor: Colors.primary, // #DDA131 Amber design token
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  calculateButtonText: {
    fontFamily: FontFamily.bold,
    color: '#02153A',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
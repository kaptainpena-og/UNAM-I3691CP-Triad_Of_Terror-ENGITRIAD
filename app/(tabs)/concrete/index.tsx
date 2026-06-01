// app/(tabs)/concrete/index.tsx

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
  View
} from 'react-native';

const GRADES = ['C20', 'C25', 'C30'];

export default function ConcreteMixerScreen() {
  const router = useRouter();
  const [projectName, setProjectName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('C25');
  const [volume, setVolume] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateAndSave = async () => {
    // 1. Input Validation
    if (!projectName.trim() || !volume.trim()) {
      Alert.alert('Validation Error', 'Please enter a project name and required volume.');
      return;
    }

    const volNumber = parseFloat(volume);
    if (isNaN(volNumber) || volNumber <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid number for volume greater than 0.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to save calculations.');
      return;
    }

    setLoading(true);

    try {
      // 2. Perform Indicative Calculation
      // Standard dry volume multiplier for concrete is ~1.54
      const dryVolume = volNumber * 1.54;
      
      // Determine mix ratios (Cement : Sand : Aggregate) and Water/Cement ratio
      let c = 1, s = 1.5, a = 3, wcRatio = 0.55; // C20 defaults
      if (selectedGrade === 'C25') {
        c = 1; s = 1; a = 2; wcRatio = 0.50;
      } else if (selectedGrade === 'C30') {
        c = 1; s = 0.75; a = 1.5; wcRatio = 0.45;
      }

      const totalParts = c + s + a;

      // Calculate raw volume per material
      const cementVol = (c / totalParts) * dryVolume;
      const sandVol = (s / totalParts) * dryVolume;
      const aggVol = (a / totalParts) * dryVolume;

      // Convert volume to standard mass (kg) based on rough bulk densities
      const cementQty = Math.round(cementVol * 1440);     // Cement density ~1440 kg/m³
      const sandQty = Math.round(sandVol * 1600);         // Sand density ~1600 kg/m³
      const aggregateQty = Math.round(aggVol * 1500);     // Aggregate density ~1500 kg/m³
      const waterQty = Math.round(cementQty * wcRatio);   // Water in Liters (1kg = 1L approx)

      // 3. Construct Firestore Payload
      const mixData = {
        userId: user.uid,
        projectName: projectName.trim(),
        concreteGrade: selectedGrade,
        volumeRequired: volNumber,
        cementQty,
        sandQty,
        aggregateQty,
        waterQty,
        createdAt: serverTimestamp(),
      };

      // 4. Save to Database
      const mixesCollection = collection(db, 'concreteMixes');
      await addDoc(mixesCollection, mixData);

      // 5. Navigate to Results / History Screen
      Alert.alert('Success', 'Mix calculation saved successfully!', [
        { text: 'View Results', onPress: () => router.push('/(tabs)/concrete/results') }
      ]);
      
      // Reset form
      setProjectName('');
      setVolume('');
      setSelectedGrade('C25');

    } catch (error: any) {
      Alert.alert('Database Error', error.message ?? 'Failed to save the record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.headerTitle}>Concrete Mixer</Text>
      <Text style={styles.subTitle}>Calculate raw material requirements for your site.</Text>

      {/* Project Name Input */}
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

      {/* Concrete Grade Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Concrete Grade</Text>
        <View style={styles.gradeContainer}>
          {GRADES.map((grade) => (
            <TouchableOpacity
              key={grade}
              style={[
                styles.gradeButton,
                selectedGrade === grade && styles.gradeButtonActive
              ]}
              onPress={() => setSelectedGrade(grade)}
            >
              <Text style={[
                styles.gradeText,
                selectedGrade === grade && styles.gradeTextActive
              ]}>
                {grade}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Volume Input */}
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

      {/* Submit Button */}
      <TouchableOpacity 
        style={[styles.primaryButton, loading && styles.buttonDisabled]} 
        onPress={calculateAndSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.background} />
        ) : (
          <Text style={styles.buttonText}>Calculate & Save</Text>
        )}
      </TouchableOpacity>

      {/* Mandatory Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          *Disclaimer: These calculations use standard dry-volume multipliers and assumed bulk densities. They are indicative only and should not be used for final structural safety sign-offs.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 24,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: Colors.secondary,
    marginBottom: 8,
  },
  subTitle: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gradeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  gradeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  gradeText: {
    fontFamily: FontFamily.medium,
    color: Colors.text,
    fontSize: 16,
  },
  gradeTextActive: {
    color: Colors.textOnPrimary,
  },
  primaryButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: FontFamily.bold,
    color: Colors.background,
    fontSize: 16,
  },
  disclaimerContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFF8E1', // Slight amber tint for warning
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  disclaimerText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  }
});
/**
 * STRIDE — 3-Step Interactive Onboarding Flow
 */

import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, GlassCard, Text } from '../../components/ui';
import { palette } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth';
import { useHaptics } from '../../hooks/useHaptics';
import { requestLocationPermissions } from '../../services/location';
import { requestNotificationPermission } from '../../services/notifications';
import { Zap, MapPin, Bell, Check, ChevronRight } from 'lucide-react-native';

export default function OnboardingScreen(): React.JSX.Element {
  const router = useRouter();
  const haptics = useHaptics();
  const { updateProfile, setOnboardingCompleted } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGoal, setSelectedGoal] = useState('5k');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('70');
  const [unit, setUnit] = useState<'km' | 'mi'>('km');

  const goals = [
    { id: 'casual', title: 'Consistency & Health', desc: 'Build an unbroken daily running habit' },
    { id: '5k', title: '5K Mastery', desc: 'Train for sub-25 min 5K milestones' },
    { id: '10k', title: '10K Crusher', desc: 'Step up endurance and threshold volume' },
    { id: 'half', title: 'Half Marathon', desc: 'Conquer long runs and aerobic efficiency' },
  ];

  const handleNext = async () => {
    haptics.light();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Step 3: Request permissions
      haptics.heavy();
      await requestLocationPermissions();
      await requestNotificationPermission();

      await updateProfile({
        displayName: name.trim() || 'Alex Mercer',
        weightKg: Number(weight) || 70,
        unitPreference: unit,
        onboardingCompleted: true,
      });

      router.replace('/(tabs)/');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Progress Dots */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, step >= 1 && styles.dotActive]} />
        <View style={[styles.dot, step >= 2 && styles.dotActive]} />
        <View style={[styles.dot, step >= 3 && styles.dotActive]} />
      </View>

      <View style={styles.container}>
        {/* Step 1: Goal Selection */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Zap size={32} color={palette.lime} />
            </View>
            <Text variant="display" color="white" style={styles.stepTitle}>
              What's Your Stride Goal?
            </Text>
            <Text variant="body" color="dark300" style={styles.stepSubtitle}>
              STRIDE AI tailors your pacing thresholds and weekly training load based on your primary target.
            </Text>

            <View style={styles.goalsList}>
              {goals.map((g) => {
                const isSelected = selectedGoal === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    activeOpacity={0.8}
                    style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                    onPress={() => {
                      haptics.selection();
                      setSelectedGoal(g.id);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="h3"
                        color={isSelected ? 'lime' : 'white'}
                        style={{ fontWeight: '800' }}
                      >
                        {g.title}
                      </Text>
                      <Text variant="caption" color="dark300" style={{ marginTop: 2 }}>
                        {g.desc}
                      </Text>
                    </View>
                    {isSelected && <Check size={20} color={palette.lime} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 2: Biometrics & Units */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text variant="caption" color="lime" style={styles.stepTag}>
              STEP 2 OF 3
            </Text>
            <Text variant="display" color="white" style={styles.stepTitle}>
              Runner Biometrics
            </Text>
            <Text variant="body" color="dark300" style={styles.stepSubtitle}>
              Calibrates MET calorie calculations and GPS pace cadence tracking.
            </Text>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text variant="caption" color="dark300">
                  YOUR NAME
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Alex Mercer"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.field}>
                <Text variant="caption" color="dark300">
                  WEIGHT (KG)
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="70"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>

              <View style={styles.field}>
                <Text variant="caption" color="dark300">
                  PREFERRED DISTANCE UNIT
                </Text>
                <View style={styles.unitToggleRow}>
                  <TouchableOpacity
                    style={[styles.unitBtn, unit === 'km' && styles.unitBtnActive]}
                    onPress={() => setUnit('km')}
                  >
                    <Text
                      variant="label"
                      color={unit === 'km' ? 'dark900' : 'white'}
                      style={{ fontWeight: '800' }}
                    >
                      Kilometers (km)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitBtn, unit === 'mi' && styles.unitBtnActive]}
                    onPress={() => setUnit('mi')}
                  >
                    <Text
                      variant="label"
                      color={unit === 'mi' ? 'dark900' : 'white'}
                      style={{ fontWeight: '800' }}
                    >
                      Miles (mi)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Permissions Primer */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text variant="caption" color="lime" style={styles.stepTag}>
              STEP 3 OF 3
            </Text>
            <Text variant="display" color="white" style={styles.stepTitle}>
              Enable Sensors
            </Text>
            <Text variant="body" color="dark300" style={styles.stepSubtitle}>
              STRIDE runs locally on your device with complete battery-efficient GPS smoothing and instant feedback.
            </Text>

            <View style={styles.permissionList}>
              <GlassCard variant="default" style={styles.permCard}>
                <View style={styles.permRow}>
                  <View style={styles.permIcon}>
                    <MapPin size={22} color={palette.lime} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" color="white" style={{ fontWeight: '800' }}>
                      Location & Route Tracking
                    </Text>
                    <Text variant="caption" color="dark300">
                      Calculates high-accuracy pace, live distance, and route maps in background.
                    </Text>
                  </View>
                </View>
              </GlassCard>

              <GlassCard variant="default" style={styles.permCard}>
                <View style={styles.permRow}>
                  <View style={styles.permIcon}>
                    <Bell size={22} color={palette.lime} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" color="white" style={{ fontWeight: '800' }}>
                      Coaching & Streak Reminders
                    </Text>
                    <Text variant="caption" color="dark300">
                      Daily motivation alerts tuned to your running habits and recovery.
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          </View>
        )}

        {/* Bottom CTA Button */}
        <View style={styles.bottomBar}>
          <Button
            variant="primary"
            size="lg"
            label={step === 3 ? 'ENABLE & GET STARTED' : 'CONTINUE'}
            icon={<ChevronRight size={20} color="#000000" />}
            onPress={handleNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
  },
  dot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dotActive: {
    backgroundColor: palette.lime,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(191, 255, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepTag: {
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  stepTitle: {
    fontWeight: '900',
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 8,
  },
  stepSubtitle: {
    color: '#A0A0A0',
    lineHeight: 22,
    marginBottom: 24,
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  goalCardSelected: {
    borderColor: palette.lime,
    backgroundColor: 'rgba(191, 255, 0, 0.08)',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  unitToggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unitBtnActive: {
    backgroundColor: palette.lime,
    borderColor: palette.lime,
  },
  permissionList: {
    gap: 14,
  },
  permCard: {
    padding: 16,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  permIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(191, 255, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingTop: 16,
  },
});

import { LiquidBackdrop } from '../../components/ui/LiquidBackdrop';
/**
 * STRIDE — Runner Profile & Settings Screen
 */

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { AchievementsFolder } from '../../features/profile/components/AchievementsFolder';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, GlassCard, Text, OfflineBanner } from '../../components/ui';
import { palette } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth';
import { useGoalsStore } from '../../store/goals';
import { useThemeStore } from '../../store/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { getAllRuns } from '../../services/sqlite';
import { formatDistance } from '../../utils/distance';
import { formatDuration } from '../../utils/format';
import { User, Trophy, Download, Trash2, Moon, Bell, Scale, Ruler } from 'lucide-react-native';

export default function ProfileScreen(): React.JSX.Element {
  const haptics = useHaptics();
  const router = useRouter();
  const { profile, updateProfile, setUnitPreference, deleteAccount } = useAuthStore();
  const { badges, personalRecords } = useGoalsStore();
  const { colorScheme, toggle: toggleTheme } = useThemeStore();

  const [weightInput, setWeightInput] = useState(
    profile.weightKg ? String(profile.weightKg) : '70',
  );
  const [heightInput, setHeightInput] = useState(
    profile.heightCm ? String(profile.heightCm) : '178',
  );
  const [nameInput, setNameInput] = useState(profile.displayName || 'Alex Mercer');
  const [isEditingBio, setIsEditingBio] = useState(false);

  const handleSaveBio = async () => {
    haptics.success();
    await updateProfile({
      displayName: nameInput,
      weightKg: Number(weightInput) || 70,
      heightCm: Number(heightInput) || 178,
    });
    setIsEditingBio(false);
  };

  const handleToggleUnit = async () => {
    haptics.selection();
    const nextUnit = profile.unitPreference === 'km' ? 'mi' : 'km';
    await setUnitPreference(nextUnit);
  };

  const handleExportData = async () => {
    haptics.light();
    try {
      const runs = await getAllRuns();
      const exportJson = JSON.stringify(
        { profile, runs, exportDate: new Date().toISOString() },
        null,
        2,
      );
      await Share.share({
        title: 'STRIDE_Export_Data.json',
        message: exportJson,
      });
    } catch {
      Alert.alert('Export Error', 'Unable to export data.');
    }
  };

  const handleDeleteAccount = () => {
    haptics.warning();
    Alert.alert(
      'Delete All Data (GDPR)',
      'Are you sure you want to permanently erase your runner profile, run history, routes, and AI coaching data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            haptics.error();
            await deleteAccount();
            Alert.alert('Account Cleared', 'All your local and cloud data has been deleted.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LiquidBackdrop />
      <StatusBar barStyle="light-content" />
      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="caption" color="dark300" style={styles.headerCaption}>
            RUNNER PROFILE
          </Text>
          <Text variant="h1" color="white" style={styles.headerTitle}>
            Account & Settings
          </Text>
        </View>

        {/* Profile Card */}
        <GlassCard variant="elevated" style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <User size={34} color={palette.lime} />
            </View>
            <View style={styles.profileInfo}>
              <Text variant="h2" color="white" style={styles.nameText}>
                {profile.displayName}
              </Text>
              <Text variant="bodySmall" color="dark300">
                {profile.email}
              </Text>
              <Text variant="caption" color="lime" style={styles.memberSince}>
                STRIDE MEMBER • PRO COACHING
              </Text>
            </View>
          </View>
        </GlassCard>

        <AchievementsFolder
          badges={badges}
          onPress={() => {
            haptics.light();
            router.push('/achievements');
          }}
        />

        {/* Unit Preference & Biometrics */}
        <GlassCard variant="default" style={styles.sectionCard}>
          <Text variant="label" color="white" style={styles.sectionLabel}>
            PREFERENCES & BIOMETRICS
          </Text>

          {/* Units Toggle */}
          <View style={styles.settingRow}>
            <View>
              <Text variant="body" color="white" style={{ fontWeight: '600' }}>
                Distance Units
              </Text>
              <Text variant="caption" color="dark300">
                Pace and distance display in {profile.unitPreference.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={styles.unitPill} onPress={handleToggleUnit}>
              <Text variant="label" color="lime" style={{ fontWeight: '500' }}>
                {profile.unitPreference.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Biometrics form */}
          {isEditingBio ? (
            <View style={styles.editForm}>
              <View style={styles.formField}>
                <Text variant="caption" color="dark300">
                  Full Name
                </Text>
                <TextInput
                  style={styles.input}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text variant="caption" color="dark300">
                    Weight (kg)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={weightInput}
                    onChangeText={setWeightInput}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text variant="caption" color="dark300">
                    Height (cm)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={heightInput}
                    onChangeText={setHeightInput}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Button
                variant="primary"
                size="sm"
                label="Save Biometrics"
                onPress={handleSaveBio}
                style={{ marginTop: 8 }}
              />
            </View>
          ) : (
            <View style={styles.bioPreviewRow}>
              <View style={styles.bioItem}>
                <Scale size={16} color="rgba(255, 255, 255, 0.4)" />
                <Text variant="bodySmall" color="white">
                  {profile.weightKg || 70} kg
                </Text>
              </View>
              <View style={styles.bioItem}>
                <Ruler size={16} color="rgba(255, 255, 255, 0.4)" />
                <Text variant="bodySmall" color="white">
                  {profile.heightCm || 178} cm
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditingBio(true)}>
                <Text variant="caption" color="lime" style={{ fontWeight: '700' }}>
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        {/* Personal Records Shelf */}
        <GlassCard variant="default" style={styles.sectionCard}>
          <View style={styles.prHeader}>
            <Trophy size={18} color="#FFD700" />
            <Text variant="label" color="white" style={{ fontWeight: '500' }}>
              PERSONAL RECORDS
            </Text>
          </View>

          <View style={styles.prGrid}>
            <View style={styles.prCell}>
              <Text variant="caption" color="dark300">
                Fastest 1K
              </Text>
              <Text style={styles.prVal}>
                {personalRecords.fastest1kSeconds
                  ? formatDuration(personalRecords.fastest1kSeconds)
                  : '4:38'}
              </Text>
            </View>
            <View style={styles.prCell}>
              <Text variant="caption" color="dark300">
                Fastest 5K
              </Text>
              <Text style={styles.prVal}>
                {personalRecords.fastest5kSeconds
                  ? formatDuration(personalRecords.fastest5kSeconds)
                  : '24:35'}
              </Text>
            </View>
            <View style={styles.prCell}>
              <Text variant="caption" color="dark300">
                Fastest 10K
              </Text>
              <Text style={styles.prVal}>
                {personalRecords.fastest10kSeconds
                  ? formatDuration(personalRecords.fastest10kSeconds)
                  : '52:00'}
              </Text>
            </View>
            <View style={styles.prCell}>
              <Text variant="caption" color="dark300">
                Longest Run
              </Text>
              <Text style={styles.prVal}>
                {personalRecords.longestDistanceMeters
                  ? formatDistance(personalRecords.longestDistanceMeters, profile.unitPreference)
                  : '11.2 km'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* App Settings */}
        <GlassCard variant="default" style={styles.sectionCard}>
          <Text variant="label" color="white" style={styles.sectionLabel}>
            SYSTEM & PRIVACY
          </Text>

          {/* Theme */}
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Moon size={18} color="rgba(255, 255, 255, 0.6)" />
              <Text variant="body" color="white">
                Dark Mode
              </Text>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#333333', true: palette.lime }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Daily Motivation */}
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Bell size={18} color="rgba(255, 255, 255, 0.6)" />
              <Text variant="body" color="white">
                Daily Coaching Notifications
              </Text>
            </View>
            <Switch
              value={profile.notificationEnabled}
              onValueChange={(val) => updateProfile({ notificationEnabled: val })}
              trackColor={{ false: '#333333', true: palette.lime }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Export */}
          <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Download size={18} color={palette.lime} />
              <Text variant="body" color="white">
                Export Running Data (JSON)
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* GDPR Delete */}
          <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Trash2 size={18} color="#FF4D4D" />
              <Text variant="body" color="errorRed">
                Delete Account & Purge Data (GDPR)
              </Text>
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* Medical disclaimer & version */}
        <View style={styles.footer}>
          <Text variant="caption" color="dark400" style={styles.footerText}>
            STRIDE v1.0.0 (Build 1) • Apple HIG & Nike Run Club Inspired{'\n'}
            Medical Disclaimer: Fitness guidance only. Consult a physician before starting any
            training regime.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#101B21',
  },
  scroll: {
    paddingBottom: 116,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
  },
  headerCaption: {
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '500',
  },
  headerTitle: {
    fontWeight: '600',
    marginTop: 2,
  },
  profileCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(185, 232, 218, 0.12)',
    borderWidth: 2,
    borderColor: palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameText: {
    fontWeight: '500',
  },
  memberSince: {
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  sectionLabel: {
    fontWeight: '500',
    letterSpacing: 1,
    fontSize: 11,
    color: '#888888',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  unitPill: {
    backgroundColor: 'rgba(185, 232, 218, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.lime,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  bioPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editForm: {
    gap: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formField: {
    gap: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  prCell: {
    width: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
  },
  prVal: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 4,
  },
  actionRow: {
    paddingVertical: 6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 16,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useUserStore, useChatStore } from '@/store';
import { AccessibilityProfileModal } from '@/components/ui';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import {
  Accessibility,
  Eye,
  Ear,
  ArrowUpCircle,
  Footprints,
  Trash2,
  Info,
  CheckCircle,
  Wifi,
  CircleDot,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { api } from '@/services/api';

interface ToggleItem {
  key: keyof AccessibilityProfile;
  label: string;
  description: string;
  icon: typeof Accessibility;
}

const TOGGLE_ITEMS: ToggleItem[] = [
  {
    key: 'wheelchair',
    label: 'Wheelchair User',
    description: 'I use a wheelchair or mobility aid',
    icon: Accessibility,
  },
  {
    key: 'visual_impairment',
    label: 'Visual Impairment',
    description: 'I need audio guidance or high contrast',
    icon: Eye,
  },
  {
    key: 'hearing_impairment',
    label: 'Hearing Impairment',
    description: 'I prefer visual cues over audio',
    icon: Ear,
  },
  {
    key: 'elevator_required',
    label: 'Elevator Required',
    description: 'I cannot use stairs',
    icon: ArrowUpCircle,
  },
  {
    key: 'avoid_stairs',
    label: 'Avoid Stairs',
    description: 'Prefer step-free routes when possible',
    icon: Footprints,
  },
  {
    key: 'slow_walker',
    label: 'Slow Walker',
    description: 'Prefer shorter walking distances',
    icon: Footprints,
  },
];

export default function ProfileScreen() {
  const {
    accessibilityProfile,
    updateProfile,
    deviceId,
    hasCompletedOnboarding,
  } = useUserStore();
  const { sessionId, messages, clearHistory } = useChatStore();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await api.checkHealth();
      setBackendStatus('ok');
    } catch (error) {
      setBackendStatus('error');
    }
  };

  const handleToggle = (key: keyof AccessibilityProfile, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({ [key]: value });
  };

  const handleClearHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Clear Conversation',
      'This will delete all your chat history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Toast.show({
              type: 'success',
              text1: 'Conversation cleared',
              visibilityTime: 2000,
            });
          },
        },
      ]
    );
  };

  const renderToggleItem = (item: ToggleItem, index: number) => {
    const Icon = item.icon;
    const isEnabled = accessibilityProfile[item.key];

    return (
      <Animated.View
        key={item.key}
        entering={FadeIn.delay(index * 50)}
        style={styles.toggleItem}
      >
        <View style={styles.toggleLeft}>
          <View style={[styles.iconWrap, isEnabled && styles.iconWrapActive]}>
            <Icon size={18} color={isEnabled ? COLORS.primary : COLORS.textMuted} />
          </View>
          <View>
            <Text style={styles.toggleLabel}>{item.label}</Text>
            <Text style={styles.toggleDescription}>{item.description}</Text>
          </View>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={(value) => handleToggle(item.key, value)}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={isEnabled ? COLORS.primary : '#F4F4F5'}
        />
      </Animated.View>
    );
  };

  const hasActiveProfile =
    accessibilityProfile.wheelchair ||
    accessibilityProfile.elevator_required ||
    accessibilityProfile.avoid_stairs;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Accessibility size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Accessibility Needs</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            CampusWay AI will automatically apply these settings to all route recommendations
          </Text>

          <View style={styles.togglesList}>
            {TOGGLE_ITEMS.map(renderToggleItem)}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Session Info</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Device ID</Text>
              <Text style={styles.infoValue}>{deviceId.slice(0, 8)}...</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Messages Sent</Text>
              <Text style={styles.infoValue}>{messages.filter((m) => m.role === 'user').length}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Backend Status</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    backendStatus === 'ok' && styles.statusDotOk,
                    backendStatus === 'error' && styles.statusDotError,
                  ]}
                />
                <Text style={styles.statusText}>
                  {backendStatus === 'checking'
                    ? 'Checking...'
                    : backendStatus === 'ok'
                    ? 'Connected'
                    : 'Offline'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
            <Trash2 size={18} color={COLORS.danger} />
            <Text style={styles.clearButtonText}>Clear Conversation History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About CampusWay AI</Text>
          <Text style={styles.aboutText}>
            CampusWay AI is an intelligent campus navigation assistant that provides
            accessibility-aware routing and real-time building information.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  togglesList: {
    gap: SPACING.sm,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.primaryPale,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  statusDotOk: {
    backgroundColor: COLORS.accent,
  },
  statusDotError: {
    backgroundColor: COLORS.danger,
  },
  statusText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#FEE2E2',
  },
  clearButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.danger,
  },
  aboutText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  versionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});

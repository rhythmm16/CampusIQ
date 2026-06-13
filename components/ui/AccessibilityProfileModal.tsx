import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { AccessibilityProfile } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { useUserStore } from '@/store';
import { Accessibility, Eye, Ear, ArrowUpCircle, Footprints, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface AccessibilityProfileModalProps {
  visible: boolean;
  onClose: () => void;
  isOnboarding?: boolean;
}

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
    key: 'sensory_friendly',
    label: 'Sensory / Quiet Route',
    description: 'Avoid noisy cafeterias, crowds, and construction zones',
    icon: Ear,
  },
  {
    key: 'slow_walker',
    label: 'Slow Walker',
    description: 'Prefer shorter walking distances',
    icon: Footprints,
  },
];

export function AccessibilityProfileModal({
  visible,
  onClose,
  isOnboarding = false,
}: AccessibilityProfileModalProps) {
  const router = useRouter();
  const { accessibilityProfile, updateProfile, completeOnboarding } = useUserStore();

  const handleToggle = (key: keyof AccessibilityProfile, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProfile({ [key]: value });
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isOnboarding) {
      completeOnboarding();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Accessibility Profile</Text>
          {!isOnboarding && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.subtitle}>
          {isOnboarding
            ? 'CampusIQ will automatically apply these settings to all route recommendations'
            : 'Customize your navigation preferences for accessibility-aware routing'}
        </Text>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {TOGGLE_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isEnabled = accessibilityProfile[item.key];

            return (
              <Animated.View
                key={item.key}
                entering={FadeIn.delay(index * 50)}
                style={styles.toggleItem}
              >
                <View style={styles.toggleLeft}>
                  <View style={[styles.iconContainer, isEnabled && styles.iconContainerActive]}>
                    <Icon
                      size={20}
                      color={isEnabled ? COLORS.primary : COLORS.textSecondary}
                    />
                  </View>
                  <View style={styles.toggleTextContainer}>
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
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {isOnboarding ? 'Continue' : 'Save Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    lineHeight: 22,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  iconContainerActive: {
    backgroundColor: COLORS.primaryPale,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING['3xl'],
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

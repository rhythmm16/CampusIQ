import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AccessibilityInfo } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Accessibility, ArrowUpCircle, CircleDot, BookOpen, Volume2, DoorOpen } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface AccessibilityBadgesProps {
  accessibility: AccessibilityInfo;
  compact?: boolean;
  showUnavailable?: boolean;
}

interface BadgeConfig {
  key: keyof AccessibilityInfo;
  label: string;
  icon: typeof Accessibility;
}

const BADGES: BadgeConfig[] = [
  { key: 'wheelchair_accessible', label: 'Wheelchair', icon: Accessibility },
  { key: 'has_elevator', label: 'Elevator', icon: ArrowUpCircle },
  { key: 'has_ramp', label: 'Ramp', icon: CircleDot },
  { key: 'has_accessible_restroom', label: 'Accessible WC', icon: DoorOpen },
  { key: 'has_braille_signage', label: 'Braille', icon: BookOpen },
  { key: 'has_audio_guidance', label: 'Audio Guide', icon: Volume2 },
  { key: 'step_free_entrance', label: 'Step-free', icon: DoorOpen },
];

export function AccessibilityBadges({
  accessibility,
  compact = false,
  showUnavailable = false,
}: AccessibilityBadgesProps) {
  const availableBadges = BADGES.filter((badge) => accessibility[badge.key]);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {accessibility.wheelchair_accessible && (
          <View style={styles.compactBadge}>
            <Accessibility size={12} color={COLORS.accent} />
          </View>
        )}
        {accessibility.has_elevator && (
          <View style={styles.compactBadge}>
            <ArrowUpCircle size={12} color={COLORS.accent} />
          </View>
        )}
        {accessibility.step_free_entrance && (
          <View style={styles.compactBadge}>
            <DoorOpen size={12} color={COLORS.accent} />
          </View>
        )}
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      <View style={styles.grid}>
        {BADGES.map((badge) => {
          const isAvailable = accessibility[badge.key];
          const Icon = badge.icon;

          if (!showUnavailable && !isAvailable) return null;

          return (
            <View
              key={badge.key}
              style={[
                styles.badge,
                isAvailable ? styles.badgeAvailable : styles.badgeUnavailable,
              ]}
            >
              <Icon
                size={16}
                color={isAvailable ? COLORS.accent : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.badgeText,
                  isAvailable ? styles.badgeTextAvailable : styles.badgeTextUnavailable,
                ]}
              >
                {badge.label}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  badgeAvailable: {
    backgroundColor: '#ECFDF5',
  },
  badgeUnavailable: {
    backgroundColor: '#FEF2F2',
  },
  badgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  badgeTextAvailable: {
    color: '#059669',
  },
  badgeTextUnavailable: {
    color: '#DC2626',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  compactBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { Building } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Building2, Clock, Accessibility } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface BuildingPopupProps {
  building: Building;
  onDirectionsPress: () => void;
  onDetailsPress: () => void;
  onDismiss: () => void;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function BuildingPopup({
  building,
  onDirectionsPress,
  onDetailsPress,
  onDismiss,
}: BuildingPopupProps) {
  const today = DAYS[new Date().getDay()];
  const hours = building.operating_hours[today];
  const isOpen = !hours.is_closed && (() => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return currentTime >= openMinutes && currentTime <= closeMinutes;
  })();

  const handleDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDirectionsPress();
  };

  const handleDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDetailsPress();
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      exiting={FadeOutDown.duration(150)}
      style={styles.container}
    >
      <View style={styles.handle} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.emoji}>{building.marker_emoji}</Text>
          <View>
            <Text style={styles.name}>{building.short_name}</Text>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, isOpen ? styles.statusOpen : styles.statusClosed]}
              />
              <Text style={[styles.status, isOpen ? styles.statusOpenText : styles.statusClosedText]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.accessibilityRow}>
        {building.accessibility.wheelchair_accessible && (
          <View style={styles.accessibilityBadge}>
            <Accessibility size={12} color={COLORS.accent} />
            <Text style={styles.accessibilityLabel}>Wheelchair</Text>
          </View>
        )}
        {building.accessibility.has_elevator && (
          <View style={styles.accessibilityBadge}>
            <Building2 size={12} color={COLORS.accent} />
            <Text style={styles.accessibilityLabel}>Elevator</Text>
          </View>
        )}
      </View>

      <View style={styles.hoursRow}>
        <Clock size={14} color={COLORS.textSecondary} />
        <Text style={styles.hoursText}>
          {hours.is_closed ? 'Closed today' : `${hours.open} - ${hours.close}`}
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.directionsButton]}
          onPress={handleDirections}
        >
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.detailsButton]}
          onPress={handleDetails}
        >
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emoji: {
    fontSize: 36,
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: COLORS.accent,
  },
  statusClosed: {
    backgroundColor: COLORS.danger,
  },
  status: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  statusOpenText: {
    color: '#059669',
  },
  statusClosedText: {
    color: COLORS.danger,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
  accessibilityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  accessibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.md,
  },
  accessibilityLabel: {
    fontSize: FONT_SIZE.xs,
    color: '#059669',
    fontWeight: '500',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  hoursText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  directionsButton: {
    backgroundColor: COLORS.primary,
  },
  directionsButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
});

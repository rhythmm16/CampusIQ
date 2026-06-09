import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Building } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { AccessibilityBadges } from './AccessibilityBadges';
import { ChevronRight } from 'lucide-react-native';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

interface BuildingCardProps {
  building: Building;
  onPress: () => void;
  showStatus?: boolean;
}

export function BuildingCard({ building, onPress, showStatus = true }: BuildingCardProps) {
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

  const categoryEmoji: Record<string, string> = {
    academic: '🏫',
    admin: '🏛️',
    food: '🍽️',
    sports: '🏋️',
    medical: '🏥',
    library: '📚',
    lab: '🔬',
    hostel: '🏠',
    parking: '🅿️',
    services: '🔧',
  };

  return (
    <Animated.View entering={FadeInDown.duration(200)}>
      <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{building.marker_emoji}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name}>{building.name}</Text>
            {showStatus && (
              <View style={[styles.statusPill, isOpen ? styles.statusOpen : styles.statusClosed]}>
                <Text style={[styles.statusText, isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
                  {isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.shortName}>{building.short_name}</Text>

          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {categoryEmoji[building.category]} {building.category.charAt(0).toUpperCase() + building.category.slice(1)}
              </Text>
            </View>
          </View>

          <AccessibilityBadges
            accessibility={building.accessibility}
            compact
          />
        </View>

        <ChevronRight size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  statusOpen: {
    backgroundColor: '#DCFCE7',
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  statusTextOpen: {
    color: '#166534',
  },
  statusTextClosed: {
    color: '#991B1B',
  },
  shortName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  categoryRow: {
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    selfAlign: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

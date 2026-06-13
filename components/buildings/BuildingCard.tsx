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
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${building.name}, ${building.category}, ${isOpen ? 'open now' : 'closed'}`}
        accessibilityHint="Opens building details"
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{building.marker_emoji}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{building.name}</Text>
            {showStatus && (
              <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
                <View style={[styles.statusDot, isOpen ? styles.dotOpen : styles.dotClosed]} />
              </View>
            )}
          </View>

          <Text style={styles.shortName} numberOfLines={1}>{building.short_name}</Text>

          <View style={styles.infoRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {categoryEmoji[building.category]} {building.category.charAt(0).toUpperCase() + building.category.slice(1)}
              </Text>
            </View>
            
            {showStatus && (
              <Text style={styles.hoursText}>
                {hours.is_closed ? 'Closed' : `${hours.open} - ${hours.close}`}
              </Text>
            )}
          </View>

          <AccessibilityBadges
            accessibility={building.accessibility}
            compact
          />
        </View>

        <View style={styles.chevronContainer}>
          <ChevronRight size={20} color={COLORS.primary} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOpen: {
    backgroundColor: '#DCFCE7',
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOpen: {
    backgroundColor: '#16A34A',
  },
  dotClosed: {
    backgroundColor: '#DC2626',
  },
  shortName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chevronContainer: {
    marginLeft: SPACING.sm,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OperatingHours } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';

interface HoursDisplayProps {
  operatingHours: Record<string, OperatingHours>;
  highlightToday?: boolean;
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export function HoursDisplay({ operatingHours, highlightToday = true }: HoursDisplayProps) {
  const today = DAYS_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <View style={styles.container}>
      {DAYS_ORDER.map((day) => {
        const hours = operatingHours[day];
        const isToday = day === today && highlightToday;

        return (
          <View
            key={day}
            style={[styles.row, isToday && styles.rowToday]}
          >
            <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
              {DAY_LABELS[day]}
            </Text>
            <Text style={[styles.hoursText, isToday && styles.todayText]}>
              {hours.is_closed
                ? 'Closed'
                : `${hours.open} - ${hours.close}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowToday: {
    backgroundColor: COLORS.primaryPale,
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  dayLabel: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  todayLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
  },
  todayText: {
    fontWeight: '600',
  },
});

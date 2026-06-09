import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';

type StatusType = 'open' | 'closed' | 'maintenance' | 'event';

interface StatusPillProps {
  status: StatusType;
  label?: string;
}

const STATUS_CONFIG: Record<StatusType, { bg: string; text: string; label: string }> = {
  open: { bg: '#DCFCE7', text: '#166534', label: 'Open' },
  closed: { bg: '#FEE2E2', text: '#991B1B', label: 'Closed' },
  maintenance: { bg: '#FEF3C7', text: '#92400E', label: 'Maintenance' },
  event: { bg: COLORS.primaryPale, text: COLORS.primary, label: 'Event' },
};

export function StatusPill({ status, label }: StatusPillProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.container, { backgroundColor: config.bg }]}
    >
      <Text style={[styles.text, { color: config.text }]}>
        {label || config.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  text: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Event } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { AlertTriangle, Calendar, WrenchIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface EventBannerProps {
  events: Event[];
  onPress?: (event: Event) => void;
}

const EVENT_ICONS: Record<string, typeof AlertTriangle> = {
  maintenance: WrenchIcon,
  emergency: AlertTriangle,
  seminar: Calendar,
  exam: Calendar,
  sports: Calendar,
  cultural: Calendar,
};

export function EventBanner({ events, onPress }: EventBannerProps) {
  if (events.length === 0) return null;

  const navigationEvents = events.filter((e) => e.affects_navigation);
  const generalEvents = events.filter((e) => !e.affects_navigation);

  const handlePress = (event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(event);
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {navigationEvents.map((event) => {
          const Icon = EVENT_ICONS[event.event_type] || Calendar;

          return (
            <TouchableOpacity
              key={event.event_id}
              style={[styles.banner, styles.bannerWarning]}
              onPress={() => handlePress(event)}
              activeOpacity={0.7}
            >
              <Icon size={14} color="#92400E" />
              <Text style={styles.bannerTextWarning}>{event.title}</Text>
            </TouchableOpacity>
          );
        })}

        {generalEvents.slice(0, 2).map((event) => {
          const Icon = EVENT_ICONS[event.event_type] || Calendar;

          return (
            <TouchableOpacity
              key={event.event_id}
              style={[styles.banner, styles.bannerInfo]}
              onPress={() => handlePress(event)}
              activeOpacity={0.7}
            >
              <Icon size={14} color="#1E40AF" />
              <Text style={styles.bannerTextInfo}>{event.title}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  bannerWarning: {
    backgroundColor: '#FEF3C7',
  },
  bannerInfo: {
    backgroundColor: COLORS.primaryPale,
  },
  bannerTextWarning: {
    fontSize: FONT_SIZE.sm,
    color: '#92400E',
    fontWeight: '500',
  },
  bannerTextInfo: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

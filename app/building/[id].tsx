import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { AccessibilityBadges, HoursDisplay } from '@/components/buildings';
import { useBuildings } from '@/hooks';
import { useChatStore } from '@/store';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { SAMPLE_EVENTS } from '@/constants/campus';
import { Building } from '@/types';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  Clock,
  Building2,
  AlertCircle,
  Calendar,
} from 'lucide-react-native';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function BuildingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getBuildingById } = useBuildings();
  const { sendMessage } = useChatStore();

  const building = getBuildingById(id || '');

  if (!building) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Building not found</Text>
      </View>
    );
  }

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

  const todayEvents = SAMPLE_EVENTS.filter(
    (e) => e.building_id === building.building_id && e.is_active
  );

  const handleGetDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendMessage(`How do I get to ${building.name}?`);
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <Text style={styles.emoji}>{building.marker_emoji}</Text>
          <View style={styles.heroContent}>
            <Text style={styles.name}>{building.name}</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  isOpen ? styles.statusPillOpen : styles.statusPillClosed,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isOpen ? styles.statusTextOpen : styles.statusTextClosed,
                  ]}
                >
                  {isOpen ? 'Open Now' : 'Closed'}
                </Text>
              </View>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>
                  {building.category.charAt(0).toUpperCase() + building.category.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Animated.View entering={FadeIn.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{building.description}</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <AccessibilityBadges accessibility={building.accessibility} showUnavailable />
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building2 size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Services</Text>
          </View>
          <View style={styles.servicesList}>
            {building.services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <View style={styles.serviceDot} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Opening Hours</Text>
          </View>
          <HoursDisplay operatingHours={building.operating_hours} />
        </Animated.View>

        {todayEvents.length > 0 && (
          <Animated.View entering={FadeIn.delay(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={COLORS.warning} />
              <Text style={styles.sectionTitle}>Today's Events</Text>
            </View>
            <View style={styles.eventsList}>
              {todayEvents.map((event) => (
                <View
                  key={event.event_id}
                  style={[
                    styles.eventCard,
                    event.affects_navigation && styles.eventCardWarning,
                  ]}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    {event.affects_navigation && (
                      <AlertCircle size={16} color={COLORS.warning} />
                    )}
                  </View>
                  <Text style={styles.eventRoom}>{event.room}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  {event.alternate_route_note && (
                    <Text style={styles.eventNote}>{event.alternate_route_note}</Text>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <Text style={styles.coordsText}>
            {building.coordinates.lat.toFixed(4)}, {building.coordinates.lng.toFixed(4)}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  notFoundText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  emoji: {
    fontSize: 56,
    marginRight: SPACING.lg,
  },
  heroContent: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusPillOpen: {
    backgroundColor: '#DCFCE7',
  },
  statusPillClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: '#166534',
  },
  statusTextClosed: {
    color: '#991B1B',
  },
  categoryPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  categoryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  servicesList: {
    gap: SPACING.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  serviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  serviceText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
  },
  eventsList: {
    gap: SPACING.md,
  },
  eventCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventCardWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: COLORS.warning,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  eventTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  eventRoom: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  eventDescription: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  eventNote: {
    fontSize: FONT_SIZE.sm,
    color: '#92400E',
    fontStyle: 'italic',
  },
  locationSection: {
    padding: SPACING.lg,
  },
  coordsText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: 24,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  directionsButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  directionsButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

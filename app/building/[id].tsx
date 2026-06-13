import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
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
  Navigation,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function BuildingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getBuildingById } = useBuildings();
  const { sendMessage } = useChatStore();
  
  const [showAllHours, setShowAllHours] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);

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
  
  const displayedServices = showAllServices ? building.services : building.services.slice(0, 4);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section with Gradient Effect */}
        <Animated.View entering={FadeIn} style={styles.heroGradient}>
          <View style={styles.hero}>
            <View style={styles.emojiCircle}>
              <Text style={styles.emoji}>{building.marker_emoji}</Text>
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.name}>{building.name}</Text>
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.statusBadge,
                    isOpen ? styles.statusBadgeOpen : styles.statusBadgeClosed,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      isOpen ? styles.statusDotOpen : styles.statusDotClosed,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      isOpen ? styles.statusTextOpen : styles.statusTextClosed,
                    ]}
                  >
                    {isOpen ? 'Open Now' : 'Closed'}
                  </Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {building.category.charAt(0).toUpperCase() + building.category.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
            <Navigation size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MapPin size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>View on Map</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.description}>{building.description}</Text>
        </Animated.View>

        {/* Accessibility Features */}
        {(building.accessibility.wheelchair_accessible || 
          building.accessibility.has_elevator || 
          building.accessibility.has_ramps) && (
          <Animated.View entering={FadeInDown.delay(250)} style={styles.card}>
            <Text style={styles.cardTitle}>Accessibility</Text>
            <AccessibilityBadges accessibility={building.accessibility} showUnavailable={false} />
          </Animated.View>
        )}

        {/* Services - Compact Grid */}
        {building.services.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Building2 size={20} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Services & Facilities</Text>
              </View>
              {building.services.length > 4 && (
                <TouchableOpacity 
                  onPress={() => {
                    setShowAllServices(!showAllServices);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  {showAllServices ? (
                    <ChevronUp size={20} color={COLORS.primary} />
                  ) : (
                    <ChevronDown size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.servicesGrid}>
              {displayedServices.map((service, index) => (
                <View key={index} style={styles.serviceChip}>
                  <Text style={styles.serviceChipText}>{service}</Text>
                </View>
              ))}
            </View>
            {!showAllServices && building.services.length > 4 && (
              <Text style={styles.moreText}>+{building.services.length - 4} more</Text>
            )}
          </Animated.View>
        )}

        {/* Operating Hours - Compact */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Clock size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Hours</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {
                setShowAllHours(!showAllHours);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              {showAllHours ? (
                <ChevronUp size={20} color={COLORS.primary} />
              ) : (
                <ChevronDown size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>
          
          {!showAllHours ? (
            <View style={styles.todayHours}>
              <Text style={styles.todayLabel}>Today</Text>
              <Text style={styles.todayTime}>
                {hours.is_closed ? 'Closed' : `${hours.open} - ${hours.close}`}
              </Text>
            </View>
          ) : (
            <HoursDisplay operatingHours={building.operating_hours} />
          )}
        </Animated.View>

        {/* Today's Events */}
        {todayEvents.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Calendar size={20} color={COLORS.warning} />
              <Text style={styles.cardTitle}>Today's Events</Text>
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
                  {event.affects_navigation && event.alternate_route_note && (
                    <View style={styles.eventWarning}>
                      <Text style={styles.eventNote}>{event.alternate_route_note}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View entering={SlideInRight.delay(500)} style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={handleGetDirections}>
          <Navigation size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
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
  
  // Hero Section with Modern Design
  heroGradient: {
    backgroundColor: COLORS.primary,
    paddingBottom: SPACING.xl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  emoji: {
    fontSize: 44,
  },
  heroContent: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeOpen: {
    backgroundColor: 'rgba(220, 252, 231, 0.95)',
  },
  statusBadgeClosed: {
    backgroundColor: 'rgba(254, 226, 226, 0.95)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOpen: {
    backgroundColor: '#16A34A',
  },
  statusDotClosed: {
    backgroundColor: '#DC2626',
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
  categoryBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  categoryText: {
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Card Style
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  serviceChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  moreText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },

  // Hours Display
  todayHours: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  todayLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  todayTime: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Events
  eventsList: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventCardWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: COLORS.warning,
    borderWidth: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  eventTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  eventRoom: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  eventWarning: {
    backgroundColor: 'rgba(146, 64, 14, 0.1)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  eventNote: {
    fontSize: FONT_SIZE.sm,
    color: '#92400E',
    fontWeight: '500',
  },

  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

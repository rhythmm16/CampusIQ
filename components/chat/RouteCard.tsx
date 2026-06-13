import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { RouteData } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { useMapStore, useUserStore } from '@/store';
import { primaryRouteKey } from '@/services/routing';
import { useTurnByTurnSpeech } from '@/hooks';
import * as Haptics from 'expo-haptics';
import {
  Clock,
  MapPin,
  AlertCircle,
  Accessibility,
  Volume2,
  CloudRain,
  Ear,
  Activity,
} from 'lucide-react-native';
import { speak, stopSpeaking, routeToSpeech } from '@/services/speech';

interface RouteCardProps {
  routeData: {
    fastest?: RouteData;
    accessible?: RouteData;
    scenic?: RouteData;
    quiet?: RouteData;
    weather_shielded?: RouteData;
  };
}

type RouteType = keyof RouteCardProps['routeData'];

const TAB_CONFIG: { key: RouteType; label: string; icon: typeof Clock }[] = [
  { key: 'fastest', label: 'Fastest', icon: Clock },
  { key: 'accessible', label: 'Accessible', icon: Accessibility },
  { key: 'quiet', label: 'Quiet', icon: Ear },
  { key: 'weather_shielded', label: 'Covered', icon: CloudRain },
  { key: 'scenic', label: 'Scenic', icon: MapPin },
];

export function RouteCard({ routeData }: RouteCardProps) {
  const router = useRouter();
  const { setActiveRoute, setRouteOptions } = useMapStore();
  const { language, accessibilityProfile } = useUserStore();
  const defaultTab = primaryRouteKey(accessibilityProfile);
  const [selectedTab, setSelectedTab] = useState<RouteType>(
    routeData[defaultTab] ? defaultTab : 'fastest'
  );
  const { active: turnByTurnActive, stepIndex, start: startTurnByTurn, stop: stopTurnByTurn } =
    useTurnByTurnSpeech(language);

  useEffect(() => {
    const tab = primaryRouteKey(accessibilityProfile);
    if (routeData[tab]) setSelectedTab(tab);
  }, [accessibilityProfile, routeData]);

  const currentRoute = routeData[selectedTab];

  const handleViewOnMap = () => {
    if (currentRoute) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRouteOptions(routeData);
      setActiveRoute(currentRoute);
      router.push('/(tabs)/map');
    }
  };

  const handleSpeak = () => {
    if (!currentRoute) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopSpeaking();
    stopTurnByTurn();
    speak(routeToSpeech(currentRoute), language);
  };

  const handleTurnByTurn = () => {
    if (!currentRoute) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (turnByTurnActive) {
      stopTurnByTurn();
    } else {
      stopSpeaking();
      startTurnByTurn(currentRoute);
    }
  };

  const handleTabChange = (tab: RouteType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
    stopTurnByTurn();
  };

  if (!currentRoute) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.fromText}>{currentRoute.from_building.short_name}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.headerRight}>
          <Text style={styles.toText}>{currentRoute.to_building.short_name}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
            const hasRoute = routeData[key];
            const isSelected = selectedTab === key;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.tab,
                  isSelected && styles.tabActive,
                  !hasRoute && styles.tabDisabled,
                ]}
                onPress={() => hasRoute && handleTabChange(key)}
                disabled={!hasRoute}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityLabel={`${label} route`}
                accessibilityState={{ selected: isSelected, disabled: !hasRoute }}
              >
                <Icon
                  size={14}
                  color={
                    !hasRoute
                      ? COLORS.textMuted
                      : isSelected
                        ? COLORS.primary
                        : COLORS.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.tabTextActive,
                    !hasRoute && styles.tabTextDisabled,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.routeDetails}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Clock size={16} color={COLORS.primary} />
            <Text style={styles.statValue}>{currentRoute.total_walk_time_minutes} min</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <MapPin size={16} color={COLORS.primary} />
            <Text style={styles.statValue}>{currentRoute.total_distance_meters} m</Text>
          </View>
        </View>

        {(selectedTab === 'accessible' || selectedTab === 'quiet') &&
          currentRoute.accessibility_notes && (
            <View style={styles.note}>
              <Accessibility size={14} color={COLORS.accent} />
              <Text style={styles.noteText}>{currentRoute.accessibility_notes}</Text>
            </View>
          )}

        {currentRoute.weather_note && (
          <View style={styles.weatherNote}>
            <CloudRain size={14} color={COLORS.primary} />
            <Text style={styles.weatherNoteText}>{currentRoute.weather_note}</Text>
          </View>
        )}

        {currentRoute.pulse_warnings && currentRoute.pulse_warnings.length > 0 && (
          <View style={styles.pulseWarning}>
            <Activity size={14} color={COLORS.warning} />
            <Text style={styles.warningText}>{currentRoute.pulse_warnings.join(' ')}</Text>
          </View>
        )}

        {currentRoute.event_warnings && currentRoute.event_warnings.length > 0 && (
          <View style={styles.warning}>
            <AlertCircle size={14} color={COLORS.warning} />
            <Text style={styles.warningText}>{currentRoute.event_warnings.join(', ')}</Text>
          </View>
        )}

        {turnByTurnActive && (
          <View style={styles.turnByTurnBanner}>
            <Volume2 size={14} color={COLORS.primary} />
            <Text style={styles.turnByTurnText}>
              Step {stepIndex + 1} of {currentRoute.steps.length}
            </Text>
          </View>
        )}

        <View style={styles.stepsContainer}>
          {currentRoute.steps.map((step, index) => (
            <View
              key={index}
              style={[styles.step, turnByTurnActive && index === stepIndex && styles.stepActive]}
            >
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.speakButton, turnByTurnActive && styles.speakButtonActive]}
          onPress={handleTurnByTurn}
          accessibilityRole="button"
          accessibilityLabel={turnByTurnActive ? 'Stop turn-by-turn guidance' : 'Start turn-by-turn guidance'}
        >
          <Volume2 size={18} color={turnByTurnActive ? '#FFFFFF' : COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.readButton}
          onPress={handleSpeak}
          accessibilityRole="button"
          accessibilityLabel="Read full route aloud"
        >
          <Text style={styles.readButtonText}>Read aloud</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={handleViewOnMap}
          accessibilityRole="button"
          accessibilityLabel={`View route on map`}
        >
          <Text style={styles.mapButtonText}>Map →</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flex: 1, alignItems: 'flex-start' },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  fromText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.textSecondary },
  toText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.primary },
  arrow: { fontSize: FONT_SIZE.lg, color: COLORS.textSecondary, marginHorizontal: SPACING.sm },
  tabsScroll: { maxHeight: 48 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  tabDisabled: { opacity: 0.5 },
  tabText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.primary, fontWeight: '600' },
  tabTextDisabled: { color: COLORS.textMuted },
  routeDetails: { padding: SPACING.lg },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.textPrimary },
  statDivider: { width: 1, height: 20, backgroundColor: COLORS.border },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  noteText: { flex: 1, fontSize: FONT_SIZE.sm, color: '#065F46', lineHeight: 20 },
  weatherNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#EFF6FF',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  weatherNoteText: { flex: 1, fontSize: FONT_SIZE.sm, color: '#1E40AF', lineHeight: 20 },
  pulseWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#FFF7ED',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#FEF3C7',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  warningText: { flex: 1, fontSize: FONT_SIZE.sm, color: '#92400E' },
  turnByTurnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.primaryPale,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  turnByTurnText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
  stepsContainer: { gap: SPACING.sm },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  stepActive: { backgroundColor: COLORS.primaryPale, borderRadius: BORDER_RADIUS.sm, padding: SPACING.xs },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: { fontSize: FONT_SIZE.xs, color: '#FFFFFF', fontWeight: '600' },
  stepText: { flex: 1, fontSize: FONT_SIZE.base, color: COLORS.textPrimary, lineHeight: 20 },
  actionRow: { flexDirection: 'row', alignItems: 'stretch' },
  speakButton: {
    width: 52,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakButtonActive: { backgroundColor: COLORS.primary },
  readButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  readButtonText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.primary },
  mapButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  mapButtonText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: '#FFFFFF' },
});

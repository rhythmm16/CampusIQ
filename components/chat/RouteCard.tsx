import React, { useState } from 'react';
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
import { useMapStore } from '@/store';
import * as Haptics from 'expo-haptics';
import { Clock, MapPin, AlertCircle, Accessibility } from 'lucide-react-native';

interface RouteCardProps {
  routeData: {
    fastest?: RouteData;
    accessible?: RouteData;
    scenic?: RouteData;
  };
}

type RouteType = 'fastest' | 'accessible' | 'scenic';

const TAB_CONFIG: { key: RouteType; label: string; icon: typeof Clock }[] = [
  { key: 'fastest', label: 'Fastest', icon: Clock },
  { key: 'accessible', label: 'Accessible', icon: Accessibility },
  { key: 'scenic', label: 'Scenic', icon: MapPin },
];

export function RouteCard({ routeData }: RouteCardProps) {
  const router = useRouter();
  const { setActiveRoute, setRouteOptions } = useMapStore();
  const [selectedTab, setSelectedTab] = useState<RouteType>('fastest');

  const currentRoute = routeData[selectedTab];

  const handleViewOnMap = () => {
    if (currentRoute) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRouteOptions(routeData);
      setActiveRoute(currentRoute);
      router.push('/(tabs)/map');
    }
  };

  const handleTabChange = (tab: RouteType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
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

        {selectedTab === 'accessible' && currentRoute.accessibility_notes && (
          <View style={styles.note}>
            <Accessibility size={14} color={COLORS.accent} />
            <Text style={styles.noteText}>{currentRoute.accessibility_notes}</Text>
          </View>
        )}

        {currentRoute.event_warnings && currentRoute.event_warnings.length > 0 && (
          <View style={styles.warning}>
            <AlertCircle size={14} color={COLORS.warning} />
            <Text style={styles.warningText}>{currentRoute.event_warnings.join(', ')}</Text>
          </View>
        )}

        <View style={styles.stepsContainer}>
          {currentRoute.steps.map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.mapButton} onPress={handleViewOnMap}>
        <Text style={styles.mapButtonText}>View on Map →</Text>
      </TouchableOpacity>
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
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fromText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
  arrow: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabTextDisabled: {
    color: COLORS.textMuted,
  },
  routeDetails: {
    padding: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  noteText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#065F46',
    lineHeight: 20,
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
  warningText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#92400E',
  },
  stepsContainer: {
    gap: SPACING.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: FONT_SIZE.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Building, RouteData, Coordinates } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { INITIAL_MAP_REGION, BUILDINGS, SAMPLE_EVENTS } from '@/constants/campus';
import { useMapStore } from '@/store';
import * as Haptics from 'expo-haptics';
import { Locate, X, MapPin } from 'lucide-react-native';

interface CampusMapViewProps {
  onBuildingPress?: (building: Building) => void;
  showControls?: boolean;
}

// Building item component for the list view
function BuildingListItem({
  building,
  onPress,
  isActive,
}: {
  building: Building;
  onPress: () => void;
  isActive: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.buildingItem, isActive && styles.buildingItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.buildingDot, { backgroundColor: building.marker_color }]} />
      <View style={styles.buildingContent}>
        <Text style={styles.buildingName}>{building.short_name}</Text>
        <Text style={styles.buildingCategory}>{building.category}</Text>
      </View>
      <Text style={styles.buildingEmoji}>{building.marker_emoji}</Text>
    </TouchableOpacity>
  );
}

export function CampusMapView({ onBuildingPress, showControls = true }: CampusMapViewProps) {
  const router = useRouter();
  const { activeRoute, highlightedBuildingId, clearRoute, selectBuilding } = useMapStore();
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (activeRoute) {
      setAnimatedProgress(0);
      const animate = () => {
        setAnimatedProgress((prev) => {
          if (prev >= 1) return 1;
          return prev + 0.05;
        });
      };
      const interval = setInterval(animate, 50);
      return () => clearInterval(interval);
    }
  }, [activeRoute]);

  const handleBuildingPress = (building: Building) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBuildingPress?.(building);
  };

  const handleClearRoute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearRoute();
  };

  // Get buildings to show (all or route endpoints)
  const displayBuildings = activeRoute
    ? [activeRoute.from_building, activeRoute.to_building]
    : BUILDINGS;

  return (
    <View style={styles.container}>
      {/* For web, we show a list-based map view since react-native-maps doesn't work on web */}
      <View style={styles.mapContainer}>
        <View style={styles.campusHeader}>
          <MapPin size={20} color={COLORS.primary} />
          <Text style={styles.campusTitle}>Campus Map</Text>
        </View>

        {activeRoute && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.routeOverview}>
            <View style={styles.routeHeader}>
              <View style={styles.routeEndpoint}>
                <View style={[styles.endpointDot, styles.startDot]} />
                <Text style={styles.endpointText}>{activeRoute.from_building.short_name}</Text>
              </View>
              <Text style={styles.routeArrow}>→</Text>
              <View style={styles.routeEndpoint}>
                <View style={[styles.endpointDot, styles.endDot]} />
                <Text style={styles.endpointText}>{activeRoute.to_building.short_name}</Text>
              </View>
            </View>

            <View style={styles.routeStats}>
              <Text style={styles.routeStatText}>
                    {activeRoute.total_walk_time_minutes} min • {activeRoute.total_distance_meters}m
              </Text>
            </View>

            <View style={styles.animatedLine}>
              <View style={[styles.animatedProgress, { width: `${animatedProgress * 100}%` }]} />
            </View>
          </Animated.View>
        )}

        <ScrollView
          style={styles.buildingsList}
          showsVerticalScrollIndicator={false}
        >
          {displayBuildings.map((building) => (
            <BuildingListItem
              key={building.building_id}
              building={building}
              onPress={() => handleBuildingPress(building)}
              isActive={highlightedBuildingId === building.building_id}
            />
          ))}
        </ScrollView>
      </View>

      {showControls && activeRoute && (
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlButton, styles.clearButton]} onPress={handleClearRoute}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    margin: SPACING.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  campusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  campusTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  routeOverview: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  routeEndpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  endpointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  startDot: {
    backgroundColor: '#10B981',
  },
  endDot: {
    backgroundColor: COLORS.danger,
  },
  endpointText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  routeArrow: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },
  routeStats: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  routeStatText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  animatedLine: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  animatedProgress: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  buildingsList: {
    flex: 1,
  },
  buildingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  buildingItemActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryPale,
  },
  buildingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  buildingContent: {
    flex: 1,
  },
  buildingName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  buildingCategory: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  buildingEmoji: {
    fontSize: 20,
  },
  controls: {
    position: 'absolute',
    right: 24,
    bottom: 180,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  clearButton: {
    backgroundColor: COLORS.primary,
  },
});

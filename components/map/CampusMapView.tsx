import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Building } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { useMapStore } from '@/store';
import * as Haptics from 'expo-haptics';
import { X, Navigation } from 'lucide-react-native';
import { BUILDINGS, INITIAL_MAP_REGION } from '@/constants/campus';
import Toast from 'react-native-toast-message';

interface CampusMapViewProps {
  onBuildingPress?: (building: Building) => void;
  showControls?: boolean;
}

export function CampusMapView({ onBuildingPress, showControls = true }: CampusMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const { activeRoute, highlightedBuildingId, clearRoute, currentLocationId, setCurrentLocation } = useMapStore();

  // Set Main Gate as default location and show toast on mount
  useEffect(() => {
    const mainGate = BUILDINGS.find(b => b.building_id === 'main_gate');
    if (mainGate && !currentLocationId) {
      setCurrentLocation('main_gate');
      
      // Show toast notification
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: 'You are at Main Gate',
          text2: 'Welcome to Chitkara University',
          position: 'top',
          visibilityTime: 3000,
          topOffset: 60,
        });
      }, 500);
      
      // Focus on Main Gate with proper zoom after map loads
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.animateToRegion({
            latitude: mainGate.coordinates.lat,
            longitude: mainGate.coordinates.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }, 1000);
      }
    }
  }, []);

  const handleBuildingPress = (building: Building) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBuildingPress?.(building);
  };

  const handleClearRoute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearRoute();
  };

  const handleRecenterMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeRoute && mapRef.current) {
      const coordinates = [
        activeRoute.from_building.coordinates,
        ...activeRoute.waypoints,
        activeRoute.to_building.coordinates,
      ].map(coord => ({
        latitude: coord.lat,
        longitude: coord.lng,
      }));

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
        animated: true,
      });
    } else if (mapRef.current) {
      mapRef.current.animateToRegion(INITIAL_MAP_REGION, 1000);
    }
  };

  // Auto-fit map when route changes
  useEffect(() => {
    if (activeRoute && mapRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => handleRecenterMap(), 400);
    }
  }, [activeRoute]);

  // Get route path coordinates
  const routeCoordinates = activeRoute
    ? [
        { latitude: activeRoute.from_building.coordinates.lat, longitude: activeRoute.from_building.coordinates.lng },
        ...activeRoute.waypoints.map(w => ({
          latitude: w.lat,
          longitude: w.lng,
        })),
        { latitude: activeRoute.to_building.coordinates.lat, longitude: activeRoute.to_building.coordinates.lng },
      ]
    : [];

  return (
    <View style={styles.container}>
      {/* Route Overview Floating Card */}
      {activeRoute && (
        <View style={styles.routeOverview}>
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
        </View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={INITIAL_MAP_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        loadingEnabled={true}
        mapType="standard"
      >
        {/* Building Markers */}
        {BUILDINGS.map((building) => {
          const isHighlighted = building.building_id === highlightedBuildingId;
          const isOnRoute = activeRoute && (
            building.building_id === activeRoute.from_building.building_id ||
            building.building_id === activeRoute.to_building.building_id ||
            activeRoute.segments.some(s => s.to === building.building_id)
          );
          const isCurrent = building.building_id === currentLocationId;

          return (
            <Marker
              key={building.building_id}
              coordinate={{
                latitude: building.coordinates.lat,
                longitude: building.coordinates.lng,
              }}
              title={building.short_name}
              description={building.category}
              onPress={() => handleBuildingPress(building)}
            >
              <View style={[
                styles.marker,
                isHighlighted && styles.markerHighlighted,
                isOnRoute && styles.markerOnRoute,
                isCurrent && styles.markerCurrent,
              ]}>
                <Text style={styles.markerEmoji}>{building.marker_emoji}</Text>
              </View>
            </Marker>
          );
        })}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={COLORS.primary}
            strokeWidth={5}
            lineJoin="round"
            lineCap="round"
          />
        )}
      </MapView>

      {/* Floating Action Buttons */}
      {showControls && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleRecenterMap}
            accessibilityLabel="Recenter map"
          >
            <Navigation size={20} color={COLORS.primary} />
          </TouchableOpacity>

          {activeRoute && (
            <TouchableOpacity
              style={[styles.floatingButton, styles.clearButton]}
              onPress={handleClearRoute}
              accessibilityLabel="Clear route"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  routeOverview: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  routeEndpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  endpointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  startDot: {
    backgroundColor: '#10B981',
  },
  endDot: {
    backgroundColor: COLORS.danger,
  },
  endpointText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  routeArrow: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.xs,
  },
  routeStats: {
    alignItems: 'center',
  },
  routeStatText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  markerHighlighted: {
    borderColor: COLORS.accent,
    borderWidth: 3,
  },
  markerOnRoute: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  markerCurrent: {
    borderColor: '#10B981',
    borderWidth: 3,
    backgroundColor: '#F0FDF4',
  },
  markerEmoji: {
    fontSize: 18,
  },
  floatingActions: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: SPACING.sm,
  },
  floatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  clearButton: {
    backgroundColor: COLORS.primary,
  },
});

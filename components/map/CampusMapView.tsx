import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Platform, Animated as RNAnimated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import { Building } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { useMapStore } from '@/store';
import * as Haptics from 'expo-haptics';
import { X, MapPin, Navigation } from 'lucide-react-native';
import { BUILDINGS } from '@/constants/campus';

// Chitkara University Main Gate location with proper zoom level
const MAIN_GATE_REGION = {
  latitude: 30.5135,
  longitude: 76.6575,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

interface CampusMapViewProps {
  onBuildingPress?: (building: Building) => void;
  showControls?: boolean;
}

export function CampusMapView({ onBuildingPress, showControls = true }: CampusMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const { activeRoute, highlightedBuildingId, clearRoute, currentLocationId, setCurrentLocation } = useMapStore();
  const [routeAnimated, setRouteAnimated] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Animation for route card
  const routeScale = useSharedValue(0);
  const routeOpacity = useSharedValue(0);

  // Set current location to main gate on mount
  useEffect(() => {
    setCurrentLocation('main_gate');
  }, []);

  const handleBuildingPress = (building: Building) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBuildingPress?.(building);
  };

  const handleClearRoute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRouteAnimated(false);
    routeScale.value = withTiming(0, { duration: 200 });
    routeOpacity.value = withTiming(0, { duration: 200 });
    clearRoute();
  };

  const handleRecenterMap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeRoute && mapRef.current && isMapReady) {
      // Fit map to show the entire route
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
    } else if (mapRef.current && isMapReady) {
      mapRef.current.animateToRegion(MAIN_GATE_REGION, 1000);
    }
  };

  // Auto-fit map when route changes with smooth animation
  useEffect(() => {
    if (activeRoute && mapRef.current && isMapReady && !routeAnimated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Animate route card entrance with spring
      routeOpacity.value = withTiming(1, { duration: 300 });
      routeScale.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });
      
      setTimeout(() => {
        handleRecenterMap();
        setRouteAnimated(true);
      }, 300);
    }
  }, [activeRoute, isMapReady]);

  // Reset animation state when route is cleared
  useEffect(() => {
    if (!activeRoute) {
      setRouteAnimated(false);
    }
  }, [activeRoute]);

  const animatedRouteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: routeScale.value }],
    opacity: routeOpacity.value,
  }));

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
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.mapHeader}>
        <MapPin size={20} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Campus Map</Text>
      </Animated.View>

      {/* Route Overview Card */}
      {activeRoute && routeOpacity.value > 0 && (
        <Animated.View 
          style={[styles.routeOverview, animatedRouteStyle]}
        >
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
        </Animated.View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={MAIN_GATE_REGION}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        onMapReady={() => setIsMapReady(true)}
        pitchEnabled={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
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
                styles.markerContainer,
                (isHighlighted || isOnRoute) && styles.markerHighlighted,
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
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Map Controls */}
      {showControls && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleRecenterMap}
            accessibilityLabel="Recenter map"
          >
            <Navigation size={20} color={COLORS.primary} />
          </TouchableOpacity>

          {activeRoute && (
            <TouchableOpacity
              style={[styles.controlButton, styles.clearButton]}
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
  mapHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  routeOverview: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    padding: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 10,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
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
  },
  routeStatText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  markerHighlighted: {
    borderColor: COLORS.primary,
    borderWidth: 3.5,
    transform: [{ scale: 1.15 }],
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
    backgroundColor: '#FFFFFF',
  },
  markerCurrent: {
    borderColor: '#10B981',
    borderWidth: 4,
    backgroundColor: '#D1FAE5',
    shadowColor: '#10B981',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 10,
    transform: [{ scale: 1.2 }],
  },
  markerEmoji: {
    fontSize: 20,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 24,
  },
  controls: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    gap: 12,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  clearButton: {
    backgroundColor: COLORS.primary,
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated as RNAnimated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { CampusMapView, BuildingPopup } from '@/components/map';
import { useMapStore, useChatStore } from '@/store';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Building } from '@/types';
import { Search, Clock, MapPin, X, ChevronUp, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const POPULAR_DESTINATIONS = [
  { id: 'library', label: 'Library', emoji: '📚' },
  { id: 'cafeteria', label: 'Central Cafeteria', emoji: '🍽️' },
  { id: 'cs_block', label: 'CS Block', emoji: '💻' },
  { id: 'sports_complex', label: 'Sports Complex', emoji: '🏋️' },
  { id: 'medical_center', label: 'Medical Center', emoji: '🏥' },
];

export default function MapScreen() {
  const router = useRouter();
  const {
    activeRoute,
    selectedBuilding,
    buildings,
    highlightBuilding,
    selectBuilding,
    clearRoute,
  } = useMapStore();
  const { sendMessage } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sheetHeight, setSheetHeight] = useState(activeRoute ? 280 : 120);
  const [isDragging, setIsDragging] = useState(false);

  const sheetY = useSharedValue(activeRoute ? 280 : 120);

  const handleBuildingPress = (building: Building) => {
    selectBuilding(building);
    highlightBuilding(building.building_id);
  };

  const handleGetDirections = (building: Building) => {
    selectBuilding(null);
    sendMessage(`How do I get to ${building.name}?`);
    router.push('/(tabs)');
  };

  const handleViewDetails = (building: Building) => {
    selectBuilding(null);
    router.push(`/building/${building.building_id}`);
  };

  const handleDismissPopup = () => {
    selectBuilding(null);
    highlightBuilding(null);
  };

  const handlePopularDestination = (destId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const building = buildings.find((b) => b.building_id === destId);
    if (building) {
      sendMessage(`How do I get to ${building.name}?`);
      router.push('/(tabs)');
    }
  };

  const handleClearRoute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearRoute();
    setSheetHeight(120);
  };

  const filteredBuildings = searchQuery.trim()
    ? buildings.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.short_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <View style={styles.container}>
      <CampusMapView onBuildingPress={handleBuildingPress} />

      {selectedBuilding && (
        <BuildingPopup
          building={selectedBuilding}
          onDirectionsPress={() => {
            selectBuilding(null);
            handleGetDirections(selectedBuilding);
          }}
          onDetailsPress={() => {
            selectBuilding(null);
            router.push(`/building/${selectedBuilding.building_id}`);
          }}
          onDismiss={handleDismissPopup}
        />
      )}

      <Animated.View
        entering={SlideInUp.springify().damping(15)}
        style={[
          styles.bottomSheet,
          { height: sheetHeight },
        ]}
      >
        <View style={styles.handleBar} />

        <TouchableOpacity
          style={styles.sheetHeader}
          onPress={() => {
            const newHeight = sheetHeight === 280 ? 120 : 280;
            setSheetHeight(newHeight);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.sheetHeaderContent}>
            <Text style={styles.sheetTitle}>
              {activeRoute ? 'Route Details' : 'Campus Map'}
            </Text>
            {sheetHeight === 280 ? (
              <ChevronDown size={20} color={COLORS.textSecondary} />
            ) : (
              <ChevronUp size={20} color={COLORS.textSecondary} />
            )}
          </View>
        </TouchableOpacity>

        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScrollContent}
        >
          {activeRoute ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.routeDetails}>
              <View style={styles.routeHeader}>
                <View style={styles.routeEndpoints}>
                  <View style={[styles.endpointPill, styles.startPill]}>
                    <Text style={styles.endpointLabel}>A</Text>
                  </View>
                  <Text style={styles.routeFrom}>{activeRoute.from_building.short_name}</Text>
                  <Text style={styles.routeArrow}>→</Text>
                  <View style={[styles.endpointPill, styles.endPill]}>
                    <Text style={styles.endpointLabel}>B</Text>
                  </View>
                  <Text style={styles.routeTo}>{activeRoute.to_building.short_name}</Text>
                </View>
              </View>

              <View style={styles.statsCard}>
                <View style={styles.stat}>
                  <Clock size={20} color={COLORS.primary} />
                  <Text style={styles.statValue}>{activeRoute.total_walk_time_minutes}</Text>
                  <Text style={styles.statUnit}>min</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <MapPin size={20} color={COLORS.primary} />
                  <Text style={styles.statValue}>{activeRoute.total_distance_meters}</Text>
                  <Text style={styles.statUnit}>m</Text>
                </View>
              </View>

              {activeRoute.route_type === 'accessible' && activeRoute.accessibility_notes && (
                <View style={styles.a11yNote}>
                  <Text style={styles.a11yNoteText}>{activeRoute.accessibility_notes}</Text>
                </View>
              )}

              <View style={styles.stepsList}>
                {activeRoute.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.clearRouteButton} onPress={handleClearRoute}>
                <Text style={styles.clearRouteText}>Clear Route</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.searchSection}>
              <View style={styles.searchInput}>
                <Search size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.searchTextInput}
                  placeholder="Search buildings..."
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.trim() && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {filteredBuildings ? (
                <View style={styles.searchResults}>
                  {filteredBuildings.slice(0, 5).map((building) => (
                    <TouchableOpacity
                      key={building.building_id}
                      style={styles.searchResultItem}
                      onPress={() => {
                        setSearchQuery('');
                        selectBuilding(building);
                        Keyboard.dismiss();
                      }}
                    >
                      <Text style={styles.buildingEmoji}>{building.marker_emoji}</Text>
                      <View>
                        <Text style={styles.buildingName}>{building.short_name}</Text>
                        <Text style={styles.buildingCategory}>{building.category}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.popularDestinations}>
                  <Text style={styles.sectionTitle}>Popular Destinations</Text>
                  <View style={styles.destinationsList}>
                    {POPULAR_DESTINATIONS.map((dest) => {
                      const building = buildings.find((b) => b.building_id === dest.id);
                      if (!building) return null;

                      return (
                        <TouchableOpacity
                          key={dest.id}
                          style={styles.destinationCard}
                          onPress={() => handlePopularDestination(dest.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.destinationEmoji}>{dest.emoji}</Text>
                          <Text style={styles.destinationLabel}>{dest.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
    paddingBottom: 24,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  sheetHeader: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
    gap: SPACING.sm,
  },
  sheetTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sheetContent: {
    flex: 1,
  },
  sheetScrollContent: {
    padding: SPACING.lg,
  },
  routeDetails: {
    gap: SPACING.lg,
  },
  routeHeader: {
    alignItems: 'center',
  },
  routeEndpoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  endpointPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startPill: {
    backgroundColor: '#10B981',
  },
  endPill: {
    backgroundColor: COLORS.danger,
  },
  endpointLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  routeFrom: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
  },
  routeArrow: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
  },
  routeTo: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xl,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
  },
  statUnit: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  a11yNote: {
    backgroundColor: '#ECFDF5',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  a11yNoteText: {
    fontSize: FONT_SIZE.sm,
    color: '#059669',
  },
  stepsList: {
    gap: SPACING.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  clearRouteButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  clearRouteText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  searchSection: {
    gap: SPACING.lg,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  searchTextInput: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  searchResults: {
    gap: SPACING.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  buildingEmoji: {
    fontSize: 24,
  },
  buildingName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  buildingCategory: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  popularDestinations: {},
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  destinationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
  },
  destinationEmoji: {
    fontSize: 16,
  },
  destinationLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});

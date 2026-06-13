import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Keyboard,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CampusMapView, BuildingPopup } from '@/components/map';
import { useMapStore, useChatStore } from '@/store';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Building } from '@/types';
import { Search, X, Clock, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const POPULAR_DESTINATIONS = [
  { id: 'library', label: 'LRC', emoji: '📚' },
  { id: 'cafeteria', label: 'Cafeteria', emoji: '🍽️' },
  { id: 'cs_block', label: 'De-Morgan', emoji: '💻' },
  { id: 'sports_complex', label: 'Sports', emoji: '🏋️' },
  { id: 'medical_center', label: 'Health Center', emoji: '🏥' },
  { id: 'main_gate', label: 'Main Gate', emoji: '🚪' },
];

const SEARCH_HISTORY_KEY = '@campusiq_search_history';

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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showRouteModal, setShowRouteModal] = useState(false);

  // Load search history
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // Show route modal when route is active
  useEffect(() => {
    if (activeRoute) {
      setShowRouteModal(true);
    }
  }, [activeRoute]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchHistory = async (buildingName: string) => {
    try {
      const updated = [buildingName, ...searchHistory.filter(h => h !== buildingName)].slice(0, 3);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const handleBuildingPress = (building: Building) => {
    selectBuilding(building);
    highlightBuilding(building.building_id);
  };

  const handleBuildingSelect = (building: Building) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveSearchHistory(building.short_name);
    selectBuilding(building);
    highlightBuilding(building.building_id);
    setSearchQuery('');
    setShowSearchDropdown(false);
    Keyboard.dismiss();
  };

  const handleGetDirections = (building: Building) => {
    selectBuilding(null);
    setShowSearchDropdown(false);
    sendMessage(`How do I get to ${building.name}?`);
    router.push('/(tabs)');
  };

  const handleDismissPopup = () => {
    selectBuilding(null);
    highlightBuilding(null);
  };

  const handlePopularDestination = (destId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const building = buildings.find((b) => b.building_id === destId);
    if (building) {
      saveSearchHistory(building.short_name);
      selectBuilding(building);
      highlightBuilding(building.building_id);
      setSearchQuery('');
      setShowSearchDropdown(false);
      Keyboard.dismiss();
    }
  };

  const handleClearRoute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearRoute();
    setShowRouteModal(false);
  };

  const filteredBuildings = searchQuery.trim()
    ? buildings.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.short_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <View style={styles.container}>
      <CampusMapView onBuildingPress={handleBuildingPress} />

      {/* Top Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search buildings..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowSearchDropdown(true)}
          />
          {searchQuery.trim() ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Search Dropdown */}
        {showSearchDropdown && (
          <View style={styles.searchDropdown}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Search Results */}
              {searchQuery.trim() ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Search Results</Text>
                  {filteredBuildings.length > 0 ? (
                    filteredBuildings.slice(0, 5).map((building) => (
                      <TouchableOpacity
                        key={building.building_id}
                        style={styles.listItem}
                        onPress={() => handleBuildingSelect(building)}
                      >
                        <Text style={styles.itemEmoji}>{building.marker_emoji}</Text>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemName}>{building.short_name}</Text>
                          <Text style={styles.itemCategory}>{building.category}</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noResults}>No buildings found</Text>
                  )}
                </View>
              ) : (
                <>
                  {/* Search History */}
                  {searchHistory.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Recent Searches</Text>
                      {searchHistory.map((name, index) => {
                        const building = buildings.find(
                          (b) => b.short_name === name || b.name === name
                        );
                        if (!building) return null;
                        return (
                          <TouchableOpacity
                            key={index}
                            style={styles.listItem}
                            onPress={() => handleBuildingSelect(building)}
                          >
                            <Clock size={18} color={COLORS.textSecondary} />
                            <View style={styles.itemContent}>
                              <Text style={styles.itemName}>{name}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Popular Destinations */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Popular Destinations</Text>
                    {POPULAR_DESTINATIONS.map((dest) => {
                      const building = buildings.find((b) => b.building_id === dest.id);
                      if (!building) return null;
                      return (
                        <TouchableOpacity
                          key={dest.id}
                          style={styles.listItem}
                          onPress={() => handlePopularDestination(dest.id)}
                        >
                          <Text style={styles.itemEmoji}>{dest.emoji}</Text>
                          <View style={styles.itemContent}>
                            <Text style={styles.itemName}>{dest.label}</Text>
                            <Text style={styles.itemCategory}>{building.category}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeDropdown}
              onPress={() => {
                setShowSearchDropdown(false);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.closeDropdownText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Building Popup */}
      {selectedBuilding && !showSearchDropdown && (
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

      {/* Route Modal */}
      <Modal
        visible={showRouteModal && activeRoute !== null}
        transparent
        animationType="fade"
        onRequestClose={handleClearRoute}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.routeModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Route Details</Text>
              <TouchableOpacity onPress={handleClearRoute}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {activeRoute && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Route Info */}
                <View style={styles.routeInfo}>
                  <View style={styles.routeEndpoints}>
                    <View style={[styles.endpointDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.endpointText}>{activeRoute.from_building.short_name}</Text>
                    <Text style={styles.routeArrow}>→</Text>
                    <View style={[styles.endpointDot, { backgroundColor: COLORS.danger }]} />
                    <Text style={styles.endpointText}>{activeRoute.to_building.short_name}</Text>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Clock size={18} color={COLORS.primary} />
                      <Text style={styles.statValue}>{activeRoute.total_walk_time_minutes} min</Text>
                    </View>
                    <View style={styles.stat}>
                      <MapPin size={18} color={COLORS.primary} />
                      <Text style={styles.statValue}>{activeRoute.total_distance_meters}m</Text>
                    </View>
                  </View>
                </View>

                {/* Steps */}
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

                {activeRoute.accessibility_notes && (
                  <View style={styles.accessibilityNote}>
                    <Text style={styles.accessibilityNoteText}>
                      ♿ {activeRoute.accessibility_notes}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={styles.clearButton} onPress={handleClearRoute}>
                  <Text style={styles.clearButtonText}>Clear Route</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    paddingVertical: 4,
  },
  searchDropdown: {
    marginTop: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    paddingVertical: SPACING.md,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemCategory: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  noResults: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  closeDropdown: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  closeDropdownText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  routeModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BORDER_RADIUS.xl * 1.5,
    borderTopRightRadius: BORDER_RADIUS.xl * 1.5,
    maxHeight: '70%',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  routeInfo: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.lg,
  },
  routeEndpoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  endpointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.xl,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stepsList: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    lineHeight: 22,
    paddingTop: 4,
  },
  accessibilityNote: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#ECFDF5',
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  accessibilityNoteText: {
    fontSize: FONT_SIZE.sm,
    color: '#059669',
    lineHeight: 20,
  },
  clearButton: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});

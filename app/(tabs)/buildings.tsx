import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BuildingCard } from '@/components/buildings';
import { useBuildings } from '@/hooks';
import { BuildingCategory } from '@/types';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const CATEGORY_LABELS: Record<BuildingCategory | 'all', { label: string; emoji: string }> = {
  all: { label: 'All', emoji: '📋' },
  academic: { label: 'Academic', emoji: '🏫' },
  admin: { label: 'Admin', emoji: '🏛️' },
  food: { label: 'Food', emoji: '🍽️' },
  sports: { label: 'Sports', emoji: '🏋️' },
  medical: { label: 'Medical', emoji: '🏥' },
  library: { label: 'Library', emoji: '📚' },
  lab: { label: 'Lab', emoji: '🔬' },
  hostel: { label: 'Hostel', emoji: '🏠' },
  parking: { label: 'Parking', emoji: '🅿️' },
  services: { label: 'Services', emoji: '🔧' },
};

const CATEGORIES: (BuildingCategory | 'all')[] = [
  'all',
  'academic',
  'food',
  'medical',
  'sports',
  'library',
  'hostel',
  'parking',
  'services',
];

export default function BuildingsScreen() {
  const router = useRouter();
  const {
    buildings,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
  } = useBuildings();

  const handleBuildingPress = (buildingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/building/${buildingId}`);
  };

  const handleCategoryPress = (category: BuildingCategory | 'all') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const renderCategoryChip = (category: BuildingCategory | 'all') => {
    const isSelected = selectedCategory === category;
    const config = CATEGORY_LABELS[category];

    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryEmoji}>{config.emoji}</Text>
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.categoryTextActive,
          ]}
        >
          {config.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBuilding = ({
    item,
    index,
  }: {
    item: typeof buildings[0];
    index: number;
  }) => (
    <BuildingCard
      building={item}
      onPress={() => handleBuildingPress(item.building_id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>No buildings found</Text>
      <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modern Header with Gradient */}
      <Animated.View entering={FadeInDown} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏛️ Campus Buildings</Text>
          <Text style={styles.headerSubtitle}>{buildings.length} locations</Text>
        </View>

        {/* Integrated Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Search size={20} color={COLORS.primary} strokeWidth={2.5} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search buildings, services..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.trim() && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Horizontal Category Filter */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map(renderCategoryChip)}
        </ScrollView>
      </Animated.View>

      {/* Buildings List */}
      <FlatList
        data={buildings}
        renderItem={renderBuilding}
        keyExtractor={(item) => item.building_id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  
  // Modern Header with Gradient Effect
  headerGradient: {
    backgroundColor: COLORS.primary,
    paddingBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.base,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  
  // Enhanced Search
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchTextInput: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    paddingVertical: 4,
    fontWeight: '500',
  },
  
  // Category Chips
  categoriesContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // List
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

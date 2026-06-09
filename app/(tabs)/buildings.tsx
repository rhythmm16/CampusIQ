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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buildings</Text>
        <Text style={styles.headerSubtitle}>{buildings.length} locations on campus</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search buildings, services..."
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
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {CATEGORIES.map(renderCategoryChip)}
      </ScrollView>

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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
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
    paddingVertical: SPACING.xs,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});

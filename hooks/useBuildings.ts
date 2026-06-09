import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMapStore } from '@/store';
import { Building, BuildingCategory } from '@/types';
import { BUILDINGS } from '@/constants/campus';

export function useBuildings() {
  const { buildings, loadBuildings } = useMapStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category'>('name');

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  const filteredBuildings = useMemo(() => {
    let result = buildings.length > 0 ? buildings : BUILDINGS;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (building) =>
          building.name.toLowerCase().includes(query) ||
          building.short_name.toLowerCase().includes(query) ||
          building.services.some((s) => s.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((building) => building.category === selectedCategory);
    }

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'category') {
      result = [...result].sort((a, b) => a.category.localeCompare(b.category));
    }

    return result;
  }, [buildings, searchQuery, selectedCategory, sortBy]);

  const getBuildingById = useCallback(
    (id: string): Building | undefined => {
      return buildings.find((b) => b.building_id === id) || BUILDINGS.find((b) => b.building_id === id);
    },
    [buildings]
  );

  const categories: (BuildingCategory | 'all')[] = useMemo(() => {
    return ['all', ...Array.from(new Set(buildings.map((b) => b.category))) as BuildingCategory[]];
  }, [buildings]);

  return {
    buildings: filteredBuildings,
    allBuildings: buildings,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    getBuildingById,
    categories,
  };
}

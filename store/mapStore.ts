import { create } from 'zustand';
import { Building, RouteData, Coordinates, Event } from '@/types';
import { BUILDINGS, SAMPLE_EVENTS, INITIAL_MAP_REGION } from '@/constants/campus';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MapState {
  buildings: Building[];
  events: Event[];
  activeRoute: RouteData | null;
  routeOptions: {
    fastest?: RouteData;
    accessible?: RouteData;
    scenic?: RouteData;
    quiet?: RouteData;
    weather_shielded?: RouteData;
  } | null;
  selectedRouteIndex: number;
  highlightedBuildingId: string | null;
  /** Set by QR scan or Snap & Navigate — used as route origin */
  currentLocationId: string | null;
  mapRegion: typeof INITIAL_MAP_REGION;
  selectedBuilding: Building | null;
  isMapReady: boolean;
  loadBuildings: () => Promise<void>;
  loadEvents: () => Promise<void>;
  setActiveRoute: (route: RouteData) => void;
  setRouteOptions: (options: MapState['routeOptions']) => void;
  selectRouteOption: (index: number) => void;
  highlightBuilding: (id: string | null) => void;
  selectBuilding: (building: Building | null) => void;
  setCurrentLocation: (id: string | null) => void;
  clearRoute: () => void;
  setMapRegion: (region: typeof INITIAL_MAP_REGION) => void;
  setMapReady: (ready: boolean) => void;
  getBuildingById: (id: string) => Building | undefined;
  searchBuildings: (query: string) => Building[];
  filterByCategory: (category: string) => Building[];
}

export const ROUTE_TAB_KEYS = [
  'fastest',
  'accessible',
  'quiet',
  'weather_shielded',
  'scenic',
] as const;

export const useMapStore = create<MapState>()((set, get) => ({
  buildings: BUILDINGS,
  events: SAMPLE_EVENTS,
  activeRoute: null,
  routeOptions: null,
  selectedRouteIndex: 0,
  highlightedBuildingId: null,
  currentLocationId: null,
  mapRegion: INITIAL_MAP_REGION,
  selectedBuilding: null,
  isMapReady: false,

  loadBuildings: async () => {
    try {
      const cached = await AsyncStorage.getItem('campusiq-buildings');
      if (cached) {
        set({ buildings: JSON.parse(cached) });
      } else {
        await AsyncStorage.setItem('campusiq-buildings', JSON.stringify(BUILDINGS));
        set({ buildings: BUILDINGS });
      }
    } catch (error) {
      console.error('Error loading buildings:', error);
      set({ buildings: BUILDINGS });
    }
  },

  loadEvents: async () => {
    const activeEvents = SAMPLE_EVENTS.filter((e) => e.is_active);
    set({ events: activeEvents });
  },

  setActiveRoute: (route: RouteData) => {
    set({ activeRoute: route, selectedRouteIndex: 0 });
  },

  setRouteOptions: (options) => {
    set({ routeOptions: options, selectedRouteIndex: 0 });
    if (options?.fastest) {
      set({ activeRoute: options.fastest });
    }
  },

  selectRouteOption: (index: number) => {
    const { routeOptions } = get();
    if (!routeOptions) return;

    const selectedKey = ROUTE_TAB_KEYS[index];
    const selectedRoute = selectedKey ? routeOptions[selectedKey] : undefined;

    if (selectedRoute) {
      set({ selectedRouteIndex: index, activeRoute: selectedRoute });
    }
  },

  setCurrentLocation: (id: string | null) => {
    set({ currentLocationId: id });
  },

  highlightBuilding: (id: string | null) => {
    set({ highlightedBuildingId: id });
  },

  selectBuilding: (building: Building | null) => {
    set({ selectedBuilding: building });
  },

  clearRoute: () => {
    set({
      activeRoute: null,
      routeOptions: null,
      selectedRouteIndex: 0,
    });
  },

  setMapRegion: (region) => {
    set({ mapRegion: region });
  },

  setMapReady: (ready: boolean) => {
    set({ isMapReady: ready });
  },

  getBuildingById: (id: string) => {
    return get().buildings.find((b) => b.building_id === id);
  },

  searchBuildings: (query: string) => {
    const queryLower = query.toLowerCase();
    return get().buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(queryLower) ||
        b.short_name.toLowerCase().includes(queryLower) ||
        b.services.some((s) => s.toLowerCase().includes(queryLower))
    );
  },

  filterByCategory: (category: string) => {
    if (category === 'all') return get().buildings;
    return get().buildings.filter((b) => b.category === category);
  },
}));

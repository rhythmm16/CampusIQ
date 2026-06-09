import AsyncStorage from '@react-native-async-storage/async-storage';
import { Building, Event, RouteData } from '@/types';
import { BUILDINGS, SAMPLE_EVENTS } from '@/constants/campus';

const KEYS = {
  BUILDINGS: 'campusway:buildings',
  EVENTS_TODAY: 'campusway:events_today',
  POPULAR_ROUTES: 'campusway:popular_routes',
  LAST_SYNC: 'campusway:last_sync',
};

const POPULAR_ROUTES_QUERIES: Record<string, string> = {
  cafeteria: 'The Central Cafeteria is located near the center of campus. It\'s open from 7 AM to 10 PM serving breakfast, lunch, and dinner.',
  library: 'The Main Library has 4 floors with elevator access. Open 8 AM - 8 PM weekdays. 24-hour study hall on ground floor.',
  medical: 'The Medical Center is open 24/7 for emergencies. Located near the cafeteria. Pharmacy available.',
  parking: 'Parking Lot P1 is at the main entrance. Open 24 hours with EV charging and accessible parking bays.',
  hostel: 'Hostel A is wheelchair accessible with elevators. Hostel B has limited accessibility.',
  sports: 'The Sports Complex includes gym, basketball court, and swimming pool. Open 6 AM - 9 PM daily.',
  admin: 'The Administrative Block handles admissions, finance, and HR. Open 9 AM - 5 PM weekdays.',
  cs: 'The Computer Science Block has labs and seminar halls. Elevator available for accessibility.',
};

export const offlineCache = {
  async cacheBuildings(buildings: Building[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.BUILDINGS, JSON.stringify(buildings));
      await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Error caching buildings:', error);
    }
  },

  async getCachedBuildings(): Promise<Building[] | null> {
    try {
      const cached = await AsyncStorage.getItem(KEYS.BUILDINGS);
      if (cached) {
        return JSON.parse(cached);
      }
      return BUILDINGS;
    } catch (error) {
      console.error('Error getting cached buildings:', error);
      return BUILDINGS;
    }
  },

  async cacheEvents(events: Event[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.EVENTS_TODAY, JSON.stringify(events));
    } catch (error) {
      console.error('Error caching events:', error);
    }
  },

  async getCachedEvents(): Promise<Event[] | null> {
    try {
      const cached = await AsyncStorage.getItem(KEYS.EVENTS_TODAY);
      if (cached) {
        return JSON.parse(cached);
      }
      return SAMPLE_EVENTS.filter((e) => e.is_active);
    } catch (error) {
      console.error('Error getting cached events:', error);
      return SAMPLE_EVENTS.filter((e) => e.is_active);
    }
  },

  async getCachedResponse(userMessage: string): Promise<string | null> {
    const msgLower = userMessage.toLowerCase();

    for (const [keyword, response] of Object.entries(POPULAR_ROUTES_QUERIES)) {
      if (msgLower.includes(keyword)) {
        return response;
      }
    }

    return null;
  },

  async preCachePopularRoutes(): Promise<void> {
    const routes: RouteData[] = [];
    // Pre-generate routes for common destinations
    const popularDestinations = ['cafeteria', 'library', 'medical_center', 'parking_p1', 'cs_block'];

    for (const destId of popularDestinations) {
      const from = BUILDINGS.find((b) => b.building_id === 'main_gate');
      const to = BUILDINGS.find((b) => b.building_id === destId);

      if (from && to) {
        const distance = Math.round(
          Math.sqrt(
            Math.pow((to.coordinates.lat - from.coordinates.lat) * 111000, 2) +
              Math.pow((to.coordinates.lng - from.coordinates.lng) * 111000, 2)
          )
        );

        routes.push({
          route_type: 'fastest',
          from_building: from,
          to_building: to,
          steps: [`Start at ${from.name}`, `Head to ${to.name}`, `Arrive at ${to.name}`],
          segments: [
            {
              from: from.building_id,
              to: to.building_id,
              distance_meters: distance,
              walk_time_minutes: Math.round(distance / 80),
              path_type: 'main_road',
              is_accessible: true,
            },
          ],
          waypoints: [from.coordinates, to.coordinates],
          total_distance_meters: distance,
          total_walk_time_minutes: Math.round(distance / 80),
        });
      }
    }

    try {
      await AsyncStorage.setItem(KEYS.POPULAR_ROUTES, JSON.stringify(routes));
    } catch (error) {
      console.error('Error caching popular routes:', error);
    }
  },

  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.LAST_SYNC);
    } catch {
      return null;
    }
  },

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.BUILDINGS,
        KEYS.EVENTS_TODAY,
        KEYS.POPULAR_ROUTES,
        KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },
};

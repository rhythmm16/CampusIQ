import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatResponse, AccessibilityProfile } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import * as Haptics from 'expo-haptics';
import { Building, RouteData } from '@/types';
import { BUILDINGS, PATHS } from '@/constants/campus';
import { useMapStore } from './mapStore';
import { useUserStore } from './userStore';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string;
  isConnected: boolean;
  sendMessage: (content: string) => Promise<void>;
  addAIMessage: (content: string, routeData?: ChatResponse['route_data']) => void;
  clearHistory: () => void;
  setConnected: (val: boolean) => void;
  getAIMockResponse: (userMessage: string) => Promise<ChatResponse>;
}

const generateRouteData = (from: Building, to: Building, profile: AccessibilityProfile): {
  fastest?: RouteData;
  accessible?: RouteData;
  scenic?: RouteData;
} => {
  const needsAccessible = profile.wheelchair || profile.avoid_stairs || profile.elevator_required;

  const baseDistance = Math.round(
    Math.sqrt(
      Math.pow((to.coordinates.lat - from.coordinates.lat) * 111000, 2) +
      Math.pow((to.coordinates.lng - from.coordinates.lng) * 111000, 2)
    )
  );

  const walkTime = Math.round(baseDistance / 80);

  const waypoints = [
    from.coordinates,
    {
      lat: (from.coordinates.lat + to.coordinates.lat) / 2,
      lng: (from.coordinates.lng + to.coordinates.lng) / 2,
    },
    to.coordinates,
  ];

  const fastestRoute: RouteData = {
    route_type: 'fastest',
    from_building: from,
    to_building: to,
    steps: [
      `Start at ${from.name}`,
      `Head ${to.coordinates.lat > from.coordinates.lat ? 'north' : 'south'} on the main path`,
      `Continue past the ${from.marker_emoji} landmark`,
      `Arrive at ${to.name}`,
    ],
    segments: [
      {
        from: from.building_id,
        to: to.building_id,
        distance_meters: baseDistance,
        walk_time_minutes: walkTime,
        path_type: 'main_road',
        is_accessible: true,
      },
    ],
    waypoints,
    total_distance_meters: baseDistance,
    total_walk_time_minutes: walkTime,
  };

  const accessibleRoute: RouteData = needsAccessible
    ? {
        ...fastestRoute,
        route_type: 'accessible',
        total_distance_meters: Math.round(baseDistance * 1.2),
        total_walk_time_minutes: Math.round(walkTime * 1.3),
        steps: [
          `Start at ${from.name}`,
          `Take the accessible ramp (step-free)`,
          `Follow the marked accessible path`,
          `Use elevator if going to upper floors`,
          `Arrive at ${to.name} via accessible entrance`,
        ],
        accessibility_notes: 'Step-free route with ramp access. Elevator available for multi-floor destinations.',
      }
    : fastestRoute;

  const scenicRoute: RouteData = {
    ...fastestRoute,
    route_type: 'scenic',
    total_distance_meters: Math.round(baseDistance * 1.3),
    total_walk_time_minutes: Math.round(walkTime * 1.4),
    accessibility_notes: 'Landscaped garden route with shaded walkways.',
  };

  return {
    fastest: fastestRoute,
    accessible: accessibleRoute,
    scenic: scenicRoute,
  };
};

const findBuilding = (query: string): Building | undefined => {
  const queryLower = query.toLowerCase();
  return BUILDINGS.find(
    (b) =>
      b.name.toLowerCase().includes(queryLower) ||
      b.short_name.toLowerCase().includes(queryLower) ||
      b.building_id.toLowerCase().includes(queryLower)
  );
};

const getHoursInfo = (building: Building): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const hours = building.operating_hours[today];

  if (hours.is_closed) {
    return `${building.name} is closed today. It will reopen tomorrow.`;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = hours.open.split(':').map(Number);
  const [closeH, closeM] = hours.close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentTime < openMinutes) {
    return `${building.name} opens at ${hours.open} today. It closes at ${hours.close}.`;
  } else if (currentTime > closeMinutes) {
    return `${building.name} has closed for today. It will reopen tomorrow.`;
  }
  return `${building.name} is currently open! Hours: ${hours.open} - ${hours.close} today.`;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      sessionId: uuidv4(),
      isConnected: true,

      getAIMockResponse: async (userMessage: string): Promise<ChatResponse> => {
        const profile = useUserStore.getState().accessibilityProfile;
        const msgLower = userMessage.toLowerCase();

        const hasAccessibilityNeed =
          msgLower.includes('wheelchair') ||
          msgLower.includes('accessible') ||
          msgLower.includes('elevator') ||
          msgLower.includes('stairs') ||
          msgLower.includes('disability') ||
          msgLower.includes('blind') ||
          msgLower.includes('visual');

        const toBuilding = findBuilding(msgLower);

        if (msgLower.includes('how do i get to') || msgLower.includes('directions to') || msgLower.includes('way to')) {
          if (toBuilding) {
            const fromBuilding = BUILDINGS[0];
            const routeData = generateRouteData(fromBuilding, toBuilding, profile);
            return {
              response: `I'll help you get to ${toBuilding.name}!\n\n${toBuilding.marker_emoji} ${fromBuilding.short_name} → ${toBuilding.short_name}\n\n` +
                `Distance: ${routeData.fastest?.total_distance_meters}m (${routeData.fastest?.total_walk_time_minutes} min walk)\n\n` +
                (hasAccessibilityNeed || profile.wheelchair || profile.avoid_stairs
                  ? 'I\'ve selected an accessible route for you.\n\n'
                  : '') +
                `Want to see this on the map?`,
              route_data: routeData,
              buildings_to_highlight: [toBuilding.building_id],
              session_id: get().sessionId,
              has_route: true,
            };
          }
        }

        if (msgLower.includes('hours') || msgLower.includes('open') || msgLower.includes('closed')) {
          if (toBuilding) {
            return {
              response: getHoursInfo(toBuilding),
              route_data: null,
              buildings_to_highlight: [toBuilding.building_id],
              session_id: get().sessionId,
              has_route: false,
            };
          }
        }

        if (msgLower.includes('event') || msgLower.includes('happening') || msgLower.includes('today')) {
          return {
            response: 'Today\'s Events:\n\n🎭 Tech Fest Registration at Auditorium (all day)\n💻 AI Seminar at CS Block Seminar Hall (2 hours)\n⚠️ Library Path Maintenance - use alternate route via Cafeteria\n\nWould you like details or directions to any of these?',
            route_data: null,
            buildings_to_highlight: ['auditorium', 'cs_block', 'library'],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        if (msgLower.includes('food') || msgLower.includes('eat') || msgLower.includes('cafeteria')) {
          const cafeBuilding = BUILDINGS.find(b => b.building_id === 'cafeteria')!;
          const foodTruck = BUILDINGS.find(b => b.building_id === 'food_truck_zone')!;
          return {
            response: `You have a few food options on campus:\n\n🍽️ ${cafeBuilding.name}\nHours: 7 AM - 10 PM\nDistance: ~2 min walk\n\n🚚 ${foodTruck.name}\nHours: 11 AM - 10 PM\nDistance: ~3 min walk\n\nWhich one would you like directions to?`,
            route_data: null,
            buildings_to_highlight: ['cafeteria', 'food_truck_zone'],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        if (msgLower.includes('medical') || msgLower.includes('hospital') || msgLower.includes('doctor')) {
          const medical = BUILDINGS.find(b => b.building_id === 'medical_center')!;
          return {
            response: `🏥 ${medical.name}\n\nOpen 24/7 for emergencies.\n\nServices: ${medical.services.join(', ')}\n\n${getHoursInfo(medical)}\n\nWould you like directions?`,
            route_data: null,
            buildings_to_highlight: ['medical_center'],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        if (msgLower.includes('parking')) {
          const parking = BUILDINGS.find(b => b.building_id === 'parking_p1')!;
          return {
            response: `🅿️ ${parking.name}\n\nServices: ${parking.services.join(', ')}\n\nOpen 24 hours with EV charging available.\n\nWould you like directions to the parking lot?`,
            route_data: null,
            buildings_to_highlight: ['parking_p1'],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        if (msgLower.includes('library')) {
          const library = BUILDINGS.find(b => b.building_id === 'library')!;
          const hours = library.operating_hours[
            ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
          ];
          return {
            response: `📚 ${library.name}\n\n${getHoursInfo(library)}\n\nServices: ${library.services.join(', ')}\n\nAccessibility: Elevator, ramp, and braille signage available.\n\nWould you like directions?`,
            route_data: null,
            buildings_to_highlight: ['library'],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        if (msgLower.includes('main gate') || msgLower.includes('arrived') || msgLower.includes('just arrived')) {
          return {
            response: 'Welcome to CampusWay AI! I\'m here to help you navigate the campus.\n\nYou\'re currently at the Main Gate. I can help you with:\n\n• Finding buildings and getting directions\n• Checking operating hours\n• Finding food, medical services, parking\n• Accessibility-aware routing\n\nWhere would you like to go?',
            route_data: null,
            buildings_to_highlight: ['main_gate'],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        if (hasAccessibilityNeed) {
          return {
            response: 'I\'ve noted your accessibility needs. All route recommendations will now prioritize:\n\n♿ Step-free paths\n🛗 Buildings with elevators\n♿ Accessible entrances\n\nWhere would you like to go?',
            route_data: null,
            buildings_to_highlight: [],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        const matchedBuilding = toBuilding;
        if (matchedBuilding) {
          return {
            response: `${matchedBuilding.marker_emoji} ${matchedBuilding.name}\n\n${matchedBuilding.description}\n\n${getHoursInfo(matchedBuilding)}\n\n${matchedBuilding.accessibility.wheelchair_accessible ? '♿ Wheelchair accessible' : '⚠️ Limited accessibility'}\n\nWould you like directions?`,
            route_data: null,
            buildings_to_highlight: [matchedBuilding.building_id],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        return {
          response: 'I can help you navigate the campus! Ask me about:\n\n• Buildings and locations\n• Getting directions\n• Operating hours\n• Events happening today\n• Food options\n• Accessibility features\n\nTry asking: "How do I get to the library?" or "Where can I get food?"',
          route_data: null,
          buildings_to_highlight: [],
          session_id: get().sessionId,
          has_route: false,
        };
      },

      sendMessage: async (content: string) => {
        const userMessage: Message = {
          id: uuidv4(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isLoading: true,
        }));

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
          const response = await get().getAIMockResponse(content);

          const aiMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: response.response,
            timestamp: new Date(),
            route_data: response.route_data,
          };

          set((state) => ({
            messages: [...state.messages, aiMessage],
            isLoading: false,
          }));

          if (response.has_route && response.route_data?.fastest) {
            useMapStore.getState().setActiveRoute(response.route_data.fastest);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          if (response.buildings_to_highlight.length > 0) {
            useMapStore.getState().highlightBuilding(response.buildings_to_highlight[0]);
          }
        } catch (error) {
          console.error('Error sending message:', error);
          set({ isLoading: false });
        }
      },

      addAIMessage: (content: string, routeData?: ChatResponse['route_data']) => {
        const aiMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          route_data: routeData,
        };
        set((state) => ({
          messages: [...state.messages, aiMessage],
        }));
      },

      clearHistory: () => {
        set({
          messages: [],
          sessionId: uuidv4(),
        });
      },

      setConnected: (val: boolean) => set({ isConnected: val }),
    }),
    {
      name: 'campusway-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages,
        sessionId: state.sessionId,
      }),
    }
  )
);

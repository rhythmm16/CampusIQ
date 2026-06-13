import 'react-native-get-random-values';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatResponse, AccessibilityProfile } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import * as Haptics from 'expo-haptics';
import { Building, RouteData } from '@/types';
import { BUILDINGS } from '@/constants/campus';
import { calculateRouteOptions, getRouteFromOptions, primaryRouteKey } from '@/services/routing';
import { formatPulseSummary } from '@/services/pulse';
import { api, isMockApi } from '@/services/api';
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
  // Real graph traversal (Dijkstra) over the campus path network with
  // accessibility-aware edge costs and event-blocked path handling.
  return calculateRouteOptions(from.building_id, to.building_id, profile);
};

const getRouteOrigin = (): Building => {
  const originId = useMapStore.getState().currentLocationId ?? 'main_gate';
  return BUILDINGS.find((b) => b.building_id === originId) ?? BUILDINGS[0];
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

        if (
          msgLower.includes('pulse') ||
          msgLower.includes('queue') ||
          msgLower.includes('crowd') ||
          msgLower.includes('parking') ||
          msgLower.includes('seats')
        ) {
          return {
            response: `Live Campus Pulse:\n\n${formatPulseSummary()}\n\nI'll factor this into your route suggestions — e.g. take the east path when the cafeteria west entrance has a long queue.`,
            route_data: null,
            buildings_to_highlight: ['cafeteria', 'library', 'parking_main'],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        if (msgLower.includes('how do i get to') || msgLower.includes('directions to') || msgLower.includes('way to')) {
          if (toBuilding) {
            const fromBuilding = getRouteOrigin();
            const routeData = generateRouteData(fromBuilding, toBuilding, profile);
            const primaryKey = primaryRouteKey(profile);
            const primary = getRouteFromOptions(routeData, profile);

            if (!primary) {
              return {
                response: `I couldn't find a route to ${toBuilding.name} right now. A path may be blocked by an event. Try another destination or ask me about alternatives.`,
                route_data: null,
                buildings_to_highlight: [toBuilding.building_id],
                session_id: get().sessionId,
                has_route: false,
              };
            }

            const pulseNote =
              primary.pulse_warnings && primary.pulse_warnings.length > 0
                ? `📡 ${primary.pulse_warnings.join(' ')}\n\n`
                : '';
            const weatherNote = primary.weather_note ? `🌧️ ${primary.weather_note}\n\n` : '';

            return {
              response: `I'll help you get to ${toBuilding.name}!\n\n${toBuilding.marker_emoji} ${fromBuilding.short_name} → ${toBuilding.short_name}\n\n` +
                `Distance: ${primary.total_distance_meters}m (${primary.total_walk_time_minutes} min walk)\n\n` +
                (primaryKey === 'quiet' ? "Using a sensory-quiet route away from noisy zones.\n\n" : '') +
                (primaryKey === 'weather_shielded' ? 'Using a weather-shielded route with covered paths.\n\n' : '') +
                (primaryKey === 'accessible' ? "I've selected a step-free accessible route for you.\n\n" : '') +
                pulseNote +
                weatherNote +
                (primary.event_warnings && primary.event_warnings.length > 0
                  ? `⚠️ ${primary.event_warnings.join(' ')}\n\n`
                  : '') +
                `Want to see this on the map? Tap turn-by-turn for voice guidance.`,
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
            response: 'Today\'s Events:\n\n🎭 Tech Fest Registration at University Auditorium (all day)\n💻 AI Seminar at De-Morgan Block Seminar Hall (2 hours)\n⚠️ Library Path Maintenance - use alternate route via Cafeteria\n\nWould you like details or directions to any of these?',
            route_data: null,
            buildings_to_highlight: ['auditorium', 'cs_block', 'library'],
            session_id: get().sessionId,
            has_route: false,
          };
        }

        if (msgLower.includes('food') || msgLower.includes('eat') || msgLower.includes('cafeteria')) {
          const cafeBuilding = BUILDINGS.find(b => b.building_id === 'cafeteria')!;
          const foodCourt = BUILDINGS.find(b => b.building_id === 'food_court')!;
          return {
            response: `You have a few food options on campus:\n\n🍽️ ${cafeBuilding.name}\nHours: 7 AM - 10 PM\nDistance: ~2 min walk\n\n🍕 ${foodCourt.name}\nHours: 11 AM - 10 PM\nDistance: ~3 min walk\n\nWhich one would you like directions to?`,
            route_data: null,
            buildings_to_highlight: ['cafeteria', 'food_court'],
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
          const parking = BUILDINGS.find(b => b.building_id === 'parking_main')!;
          return {
            response: `🅿️ ${parking.name}\n\nServices: ${parking.services.join(', ')}\n\nOpen 24 hours with accessible parking available.\n\nWould you like directions to the parking area?`,
            route_data: null,
            buildings_to_highlight: ['parking_main'],
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
            response: 'Welcome to CampusIQ! I\'m here to help you navigate the campus.\n\nYou\'re currently at the Main Gate. I can help you with:\n\n• Finding buildings and getting directions\n• Checking operating hours\n• Finding food, medical services, parking\n• Accessibility-aware routing\n\nWhere would you like to go?',
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
          let response: ChatResponse;

          if (!isMockApi && get().isConnected) {
            try {
              const { accessibilityProfile, deviceId } = useUserStore.getState();
              response = await api.sendChatMessage(
                get().sessionId,
                content,
                deviceId,
                accessibilityProfile
              );
            } catch (apiError) {
              console.warn('Backend unavailable, using local agent:', apiError);
              response = await get().getAIMockResponse(content);
            }
          } else {
            response = await get().getAIMockResponse(content);
          }

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

          if (response.has_route && response.route_data) {
            const profile = useUserStore.getState().accessibilityProfile;
            const primaryRoute = getRouteFromOptions(response.route_data, profile);
            const tabIndex = primaryRoute
              ? ['fastest', 'accessible', 'quiet', 'weather_shielded', 'scenic'].indexOf(
                  primaryRoute.route_type
                )
              : 0;

            useMapStore.getState().setRouteOptions(response.route_data);
            if (tabIndex >= 0) {
              useMapStore.getState().selectRouteOption(tabIndex);
            } else if (primaryRoute) {
              useMapStore.getState().setActiveRoute(primaryRoute);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

          if (response.buildings_to_highlight.length > 0) {
            useMapStore.getState().highlightBuilding(response.buildings_to_highlight[0]);
          }
        } catch (error) {
          console.error('Error sending message:', error);

          const errorMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content:
              "Sorry, I couldn't process that just now. Please check your connection and try again.",
            timestamp: new Date(),
          };

          set((state) => ({
            messages: [...state.messages, errorMessage],
            isLoading: false,
          }));

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      name: 'campusiq-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages,
        sessionId: state.sessionId,
      }),
    }
  )
);

import { Building, ChatResponse, RouteData, AccessibilityProfile } from '@/types';
import { BUILDINGS } from '@/constants/campus';
import { calculateRoute as computeRoute, RouteType } from '@/services/routing';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

export const isMockApi = USE_MOCK_API;
export const apiBaseUrl = API_URL;

interface CalculateRouteParams {
  from_id: string;
  to_id: string;
  wheelchair?: boolean;
  avoid_stairs?: boolean;
  elevator_required?: boolean;
}

export const api = {
  async sendChatMessage(
    sessionId: string,
    message: string,
    deviceId: string,
    accessibilityProfile?: AccessibilityProfile
  ): Promise<ChatResponse> {
    if (USE_MOCK_API) {
      return this.mockChatResponse(message);
    }

    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        device_id: deviceId,
        accessibility_profile: accessibilityProfile,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  },

  async fetchBuildings(): Promise<Building[]> {
    if (USE_MOCK_API) {
      return BUILDINGS;
    }

    const response = await fetch(`${API_URL}/api/buildings`);
    if (!response.ok) {
      throw new Error('Failed to fetch buildings');
    }
    return response.json();
  },

  async fetchBuildingById(id: string): Promise<Building> {
    if (USE_MOCK_API) {
      const building = BUILDINGS.find((b) => b.building_id === id);
      if (!building) throw new Error('Building not found');
      return building;
    }

    const response = await fetch(`${API_URL}/api/buildings/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch building');
    }
    return response.json();
  },

  async calculateRoute(params: CalculateRouteParams): Promise<RouteData> {
    if (USE_MOCK_API) {
      return this.mockRouteResponse(params);
    }

    const response = await fetch(`${API_URL}/api/routes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate route');
    }
    return response.json();
  },

  async snapLocate(imageBase64: string): Promise<{
    building_id: string | null;
    confidence: number;
    reason?: string;
  }> {
    if (USE_MOCK_API) {
      return {
        building_id: null,
        confidence: 0,
        reason: 'Snap & Navigate requires the backend Vision endpoint.',
      };
    }

    const response = await fetch(`${API_URL}/api/vision/locate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    });
    if (!response.ok) {
      throw new Error('Failed to locate from image');
    }
    return response.json();
  },

  async clearConversation(sessionId: string): Promise<void> {
    if (USE_MOCK_API) return;

    await fetch(`${API_URL}/api/chat/${sessionId}`, { method: 'DELETE' });
  },

  async checkHealth(): Promise<{
    status: string;
    llm?: boolean;
    provider?: string;
    model?: string;
  }> {
    if (USE_MOCK_API) {
      return { status: 'ok', llm: false, provider: 'local' };
    }

    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },

  mockChatResponse(message: string): ChatResponse {
    return {
      response: 'I can help you navigate the campus! Try asking about buildings, directions, or events.',
      route_data: null,
      buildings_to_highlight: [],
      session_id: 'mock-session',
      has_route: false,
    };
  },

  mockRouteResponse(params: CalculateRouteParams): RouteData {
    const profile: AccessibilityProfile = {
      wheelchair: params.wheelchair ?? false,
      avoid_stairs: params.avoid_stairs ?? false,
      elevator_required: params.elevator_required ?? false,
      slow_walker: false,
      visual_impairment: false,
      hearing_impairment: false,
      sensory_friendly: false,
    };

    const routeType: RouteType =
      params.wheelchair || params.avoid_stairs || params.elevator_required
        ? 'accessible'
        : 'fastest';

    const route = computeRoute(params.from_id, params.to_id, routeType, profile);
    if (!route) {
      throw new Error('No route found between the selected buildings');
    }

    return route;
  },
};

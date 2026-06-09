import { Building, ChatResponse, RouteData } from '@/types';
import { BUILDINGS } from '@/constants/campus';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK_API = true;

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
    accessibilityProfile?: Record<string, boolean>
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

  async clearConversation(sessionId: string): Promise<void> {
    if (USE_MOCK_API) return;

    await fetch(`${API_URL}/api/chat/${sessionId}`, { method: 'DELETE' });
  },

  async checkHealth(): Promise<{ status: string }> {
    if (USE_MOCK_API) {
      return { status: 'ok' };
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
    const fromBuilding = BUILDINGS.find((b) => b.building_id === params.from_id);
    const toBuilding = BUILDINGS.find((b) => b.building_id === params.to_id);

    if (!fromBuilding || !toBuilding) {
      throw new Error('Building not found');
    }

    const distance = Math.round(
      Math.sqrt(
        Math.pow((toBuilding.coordinates.lat - fromBuilding.coordinates.lat) * 111000, 2) +
          Math.pow((toBuilding.coordinates.lng - fromBuilding.coordinates.lng) * 111000, 2)
      )
    );

    return {
      route_type: params.wheelchair ? 'accessible' : 'fastest',
      from_building: fromBuilding,
      to_building: toBuilding,
      steps: [
        `Start at ${fromBuilding.name}`,
        `Head towards ${toBuilding.name}`,
        `Arrive at ${toBuilding.name}`,
      ],
      segments: [
        {
          from: params.from_id,
          to: params.to_id,
          distance_meters: distance,
          walk_time_minutes: Math.round(distance / 80),
          path_type: 'main_road',
          is_accessible: true,
        },
      ],
      waypoints: [fromBuilding.coordinates, toBuilding.coordinates],
      total_distance_meters: distance,
      total_walk_time_minutes: Math.round(distance / 80),
    };
  },
};

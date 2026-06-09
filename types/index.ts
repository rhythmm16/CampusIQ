export type BuildingCategory = 'academic' | 'admin' | 'food' | 'sports' | 'medical' | 'library' | 'lab' | 'hostel' | 'parking' | 'services';

export interface AccessibilityInfo {
  wheelchair_accessible: boolean;
  has_elevator: boolean;
  has_ramp: boolean;
  has_accessible_restroom: boolean;
  has_braille_signage: boolean;
  has_audio_guidance: boolean;
  step_free_entrance: boolean;
}

export interface OperatingHours {
  open: string;
  close: string;
  is_closed: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Building {
  building_id: string;
  name: string;
  short_name: string;
  description: string;
  category: BuildingCategory;
  floor_count: number;
  coordinates: Coordinates;
  accessibility: AccessibilityInfo;
  services: string[];
  operating_hours: Record<string, OperatingHours>;
  marker_emoji: string;
  marker_color: string;
}

export interface RouteSegment {
  from: string;
  to: string;
  distance_meters: number;
  walk_time_minutes: number;
  path_type: string;
  is_accessible: boolean;
  notes?: string;
}

export interface RouteData {
  route_type: 'fastest' | 'accessible' | 'scenic';
  from_building: Building;
  to_building: Building;
  steps: string[];
  segments: RouteSegment[];
  waypoints: Coordinates[];
  total_distance_meters: number;
  total_walk_time_minutes: number;
  accessibility_notes?: string;
  event_warnings?: string[];
}

export interface ChatResponse {
  response: string;
  route_data: {
    fastest?: RouteData;
    accessible?: RouteData;
    scenic?: RouteData;
  } | null;
  buildings_to_highlight: string[];
  session_id: string;
  has_route: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  route_data?: ChatResponse['route_data'];
}

export interface AccessibilityProfile {
  wheelchair: boolean;
  visual_impairment: boolean;
  hearing_impairment: boolean;
  elevator_required: boolean;
  avoid_stairs: boolean;
  slow_walker: boolean;
}

export type EventType = 'seminar' | 'exam' | 'sports' | 'maintenance' | 'emergency' | 'cultural';

export interface Event {
  event_id: string;
  title: string;
  description: string;
  building_id: string;
  room: string;
  start_time: string;
  end_time: string;
  event_type: EventType;
  affects_navigation: boolean;
  blocked_paths?: string[];
  alternate_route_note?: string;
  is_active: boolean;
}

export interface LocationState {
  latitude: number;
  longitude: number;
  hasPermission: boolean;
}

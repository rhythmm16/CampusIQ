import {
  Building,
  RouteData,
  RouteSegment,
  AccessibilityProfile,
  Coordinates,
} from '@/types';
import { BUILDINGS, PATHS, SAMPLE_EVENTS } from '@/constants/campus';
import {
  getPathAttributes,
  CAMPUS_PULSE,
  PULSE_AFFECTED_BUILDINGS,
} from '@/constants/campusFeatures';
import { isBadWeather } from '@/services/weather';

export type RouteType = 'fastest' | 'accessible' | 'scenic' | 'quiet' | 'weather_shielded';

interface GraphEdge {
  to: string;
  from: string;
  distance: number;
  walkTime: number;
  isAccessible: boolean;
  hasStairs: boolean;
  pathId: string;
  noiseLevel: number;
  isCovered: boolean;
  isIndoor: boolean;
}

const BUILDING_BY_ID = new Map<string, Building>(
  BUILDINGS.map((b) => [b.building_id, b])
);

function pathId(from: string, to: string): string {
  return `${from}-${to}`;
}

function buildGraph(): Map<string, GraphEdge[]> {
  const graph = new Map<string, GraphEdge[]>();

  const addEdge = (from: string, to: string, base: Omit<GraphEdge, 'to' | 'from' | 'pathId'>) => {
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from)!.push({ ...base, from, to, pathId: pathId(from, to) });
  };

  for (const p of PATHS) {
    const attr = getPathAttributes(p.from, p.to);
    const shared = {
      distance: p.distance,
      walkTime: p.walk_time,
      isAccessible: p.is_accessible,
      hasStairs: p.has_stairs,
      noiseLevel: attr.noise_level,
      isCovered: attr.is_covered,
      isIndoor: attr.is_indoor,
    };
    addEdge(p.from, p.to, shared);
    addEdge(p.to, p.from, shared);
  }

  return graph;
}

const GRAPH = buildGraph();

const PULSE_BY_BUILDING = new Map(CAMPUS_PULSE.map((p) => [p.building_id, p]));

function getBlockedPathIds(): Set<string> {
  const blocked = new Set<string>();
  for (const event of SAMPLE_EVENTS) {
    if (!event.is_active || !event.affects_navigation || !event.blocked_paths) continue;
    for (const bp of event.blocked_paths) {
      blocked.add(bp);
      const [a, b] = bp.split('-');
      if (a && b) {
        blocked.add(pathId(a, b));
        blocked.add(pathId(b, a));
      }
    }
  }
  return blocked;
}

function needsStepFree(profile: AccessibilityProfile): boolean {
  return profile.wheelchair || profile.elevator_required || profile.avoid_stairs;
}

function needsQuiet(profile: AccessibilityProfile, routeType: RouteType): boolean {
  return routeType === 'quiet' || profile.sensory_friendly;
}

function pulsePenalty(edge: GraphEdge): number {
  let penalty = 0;
  for (const node of [edge.from, edge.to]) {
    if (!PULSE_AFFECTED_BUILDINGS.has(node)) continue;
    const pulse = PULSE_BY_BUILDING.get(node);
    if (!pulse) continue;
    if (pulse.status === 'busy') penalty += (pulse.congestion_penalty_minutes ?? 3) * 25;
    else if (pulse.status === 'full') penalty += 200;
    else if (pulse.status === 'moderate') penalty += 40;
  }
  return penalty;
}

function edgeCost(
  edge: GraphEdge,
  routeType: RouteType,
  profile: AccessibilityProfile,
  blocked: Set<string>,
  badWeather: boolean
): number {
  if (blocked.has(edge.pathId)) return Infinity;

  const mustBeStepFree =
    routeType === 'accessible' || routeType === 'weather_shielded' || needsStepFree(profile);

  if (mustBeStepFree && (edge.hasStairs || !edge.isAccessible)) {
    return Infinity;
  }

  let cost = edge.distance + pulsePenalty(edge);

  if (routeType === 'scenic') {
    if (edge.hasStairs) cost += 250;
    if (!edge.isAccessible) cost += 150;
  }

  if (needsQuiet(profile, routeType)) {
    cost += edge.noiseLevel * 35;
    if (edge.noiseLevel >= 7) cost += 120;
  }

  if (routeType === 'weather_shielded' || (badWeather && routeType !== 'fastest')) {
    if (!edge.isCovered && !edge.isIndoor) cost += 180;
    if (edge.isIndoor) cost -= 20;
    if (edge.isCovered) cost -= 10;
  }

  return Math.max(cost, edge.distance * 0.5);
}

function dijkstra(
  fromId: string,
  toId: string,
  costFn: (edge: GraphEdge) => number
): { path: string[]; edges: GraphEdge[] } | null {
  if (fromId === toId) return { path: [fromId], edges: [] };
  if (!GRAPH.has(fromId) || !BUILDING_BY_ID.has(toId)) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; edge: GraphEdge }>();
  const visited = new Set<string>();
  dist.set(fromId, 0);

  while (true) {
    let current: string | null = null;
    let currentDist = Infinity;
    for (const [node, d] of dist) {
      if (!visited.has(node) && d < currentDist) {
        current = node;
        currentDist = d;
      }
    }
    if (current === null || current === toId) break;
    visited.add(current);

    for (const edge of GRAPH.get(current) ?? []) {
      if (visited.has(edge.to)) continue;
      const stepCost = costFn(edge);
      if (!isFinite(stepCost)) continue;
      const next = currentDist + stepCost;
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next);
        prev.set(edge.to, { node: current, edge });
      }
    }
  }

  if (!dist.has(toId) || !isFinite(dist.get(toId)!)) return null;

  const path: string[] = [];
  const edges: GraphEdge[] = [];
  let node: string | undefined = toId;
  while (node && node !== fromId) {
    path.unshift(node);
    const p = prev.get(node);
    if (!p) return null;
    edges.unshift(p.edge);
    node = p.node;
  }
  path.unshift(fromId);
  return { path, edges };
}

function paceMultiplier(profile: AccessibilityProfile): number {
  if (profile.slow_walker) return 1.4;
  if (profile.wheelchair) return 1.15;
  return 1;
}

function buildSegments(edges: GraphEdge[]): RouteSegment[] {
  return edges.map((e) => ({
    from: e.from,
    to: e.to,
    distance_meters: e.distance,
    walk_time_minutes: e.walkTime,
    path_type: e.hasStairs ? 'footpath' : e.isIndoor ? 'indoor' : e.isCovered ? 'covered' : 'main_road',
    is_accessible: e.isAccessible && !e.hasStairs,
    notes: e.hasStairs
      ? 'Contains stairs'
      : e.noiseLevel >= 7
      ? 'Noisy area — sensory route avoids this when possible'
      : undefined,
  }));
}

function buildSteps(path: string[], routeType: RouteType): string[] {
  if (path.length === 0) return [];
  const startName = BUILDING_BY_ID.get(path[0])?.name ?? path[0];
  const steps: string[] = [`Start at ${startName}`];

  for (let i = 1; i < path.length; i++) {
    const building = BUILDING_BY_ID.get(path[i]);
    const name = building?.short_name ?? path[i];
    const isLast = i === path.length - 1;
    if (isLast) {
      const full = building?.name ?? name;
      if (routeType === 'accessible' || routeType === 'weather_shielded') {
        steps.push(`Arrive at ${full} via the accessible entrance`);
      } else {
        steps.push(`Arrive at ${full}`);
      }
    } else {
      steps.push(`Continue past ${name}`);
    }
  }
  return steps;
}

function buildWaypoints(path: string[]): Coordinates[] {
  return path
    .map((id) => BUILDING_BY_ID.get(id)?.coordinates)
    .filter((c): c is Coordinates => Boolean(c));
}

function collectPulseWarnings(path: string[]): string[] {
  const warnings: string[] = [];
  for (const node of path) {
    const pulse = PULSE_BY_BUILDING.get(node);
    if (pulse && (pulse.status === 'busy' || pulse.status === 'full') && pulse.detail) {
      warnings.push(pulse.detail);
    }
  }
  return [...new Set(warnings)];
}

function collectEventWarnings(): string[] {
  return SAMPLE_EVENTS.filter(
    (e) => e.is_active && e.affects_navigation && e.alternate_route_note
  ).map((e) => e.alternate_route_note as string);
}

function notesForRoute(routeType: RouteType, profile: AccessibilityProfile, badWeather: boolean): string | undefined {
  if (routeType === 'quiet' || profile.sensory_friendly) {
    return 'Sensory-quiet route. Avoids noisy cafeterias, crowded plazas, and high-traffic zones.';
  }
  if (routeType === 'weather_shielded' || (badWeather && routeType === 'accessible')) {
    return 'Weather-shielded route. Maximizes covered walkways and indoor corridors.';
  }
  if (routeType === 'accessible' || needsStepFree(profile)) {
    return 'Step-free route. Stairs avoided; ramps and elevators used where needed.';
  }
  if (routeType === 'scenic') {
    return 'Gentle route favoring step-free, pleasant walkways.';
  }
  return undefined;
}

export function calculateRoute(
  fromId: string,
  toId: string,
  routeType: RouteType,
  profile: AccessibilityProfile,
  options?: { badWeather?: boolean }
): RouteData | null {
  const fromBuilding = BUILDING_BY_ID.get(fromId);
  const toBuilding = BUILDING_BY_ID.get(toId);
  if (!fromBuilding || !toBuilding) return null;

  const blocked = getBlockedPathIds();
  const badWeather = options?.badWeather ?? isBadWeather();

  const result = dijkstra(fromId, toId, (edge) =>
    edgeCost(edge, routeType, profile, blocked, badWeather)
  );
  if (!result) return null;

  const segments = buildSegments(result.edges);
  const totalDistance = segments.reduce((sum, s) => sum + s.distance_meters, 0);
  const rawWalkTime = segments.reduce((sum, s) => sum + s.walk_time_minutes, 0);
  const totalWalkTime = Math.max(1, Math.round(rawWalkTime * paceMultiplier(profile)));

  const pulseWarnings = collectPulseWarnings(result.path);
  const eventWarnings = blocked.size > 0 ? collectEventWarnings() : undefined;

  return {
    route_type: routeType,
    from_building: fromBuilding,
    to_building: toBuilding,
    steps: buildSteps(result.path, routeType),
    segments,
    waypoints: buildWaypoints(result.path),
    total_distance_meters: totalDistance,
    total_walk_time_minutes: totalWalkTime,
    accessibility_notes: notesForRoute(routeType, profile, badWeather),
    event_warnings: eventWarnings,
    pulse_warnings: pulseWarnings.length > 0 ? pulseWarnings : undefined,
    weather_note: badWeather && routeType === 'weather_shielded'
      ? 'Rain or heat detected — this route stays under cover where possible.'
      : badWeather
      ? 'Consider the Weather-Shielded tab for covered paths.'
      : undefined,
  };
}

export interface RouteOptions {
  fastest?: RouteData;
  accessible?: RouteData;
  scenic?: RouteData;
  quiet?: RouteData;
  weather_shielded?: RouteData;
}

export function calculateRouteOptions(
  fromId: string,
  toId: string,
  profile: AccessibilityProfile,
  options?: { badWeather?: boolean }
): RouteOptions {
  const badWeather = options?.badWeather ?? isBadWeather();
  return {
    fastest: calculateRoute(fromId, toId, 'fastest', profile, { badWeather }) ?? undefined,
    accessible: calculateRoute(fromId, toId, 'accessible', profile, { badWeather }) ?? undefined,
    scenic: calculateRoute(fromId, toId, 'scenic', profile, { badWeather }) ?? undefined,
    quiet: calculateRoute(fromId, toId, 'quiet', profile, { badWeather }) ?? undefined,
    weather_shielded:
      calculateRoute(fromId, toId, 'weather_shielded', profile, { badWeather }) ?? undefined,
  };
}

/** Pick the best default route tab for a user's profile. */
export function primaryRouteKey(profile: AccessibilityProfile, badWeather?: boolean): keyof RouteOptions {
  if (badWeather ?? isBadWeather()) return 'weather_shielded';
  if (profile.sensory_friendly) return 'quiet';
  if (profile.wheelchair || profile.avoid_stairs || profile.elevator_required) return 'accessible';
  return 'fastest';
}

export function getRouteFromOptions(
  options: RouteOptions,
  profile: AccessibilityProfile,
  badWeather?: boolean
): RouteData | undefined {
  const key = primaryRouteKey(profile, badWeather);
  return options[key] ?? options.fastest ?? options.accessible;
}

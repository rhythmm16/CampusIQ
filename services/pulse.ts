import { CAMPUS_PULSE, SAFETY_POIS, CampusPulseEntry, SafetyPoi } from '@/constants/campusFeatures';
import { BUILDINGS } from '@/constants/campus';

export function getCampusPulse(): CampusPulseEntry[] {
  return CAMPUS_PULSE;
}

export function getPulseForBuilding(buildingId: string): CampusPulseEntry | undefined {
  return CAMPUS_PULSE.find((p) => p.building_id === buildingId);
}

export function getSafetyPois(): SafetyPoi[] {
  return SAFETY_POIS;
}

export function getSafetyPoisByType(type: SafetyPoi['type']): SafetyPoi[] {
  return SAFETY_POIS.filter((p) => p.type === type);
}

export function getNearestSafetyPoi(
  fromBuildingId: string,
  type: SafetyPoi['type']
): SafetyPoi | undefined {
  const from = BUILDINGS.find((b) => b.building_id === fromBuildingId);
  if (!from) return getSafetyPoisByType(type)[0];

  const candidates = getSafetyPoisByType(type);
  if (candidates.length === 0) return undefined;

  let best = candidates[0];
  let bestDist = Infinity;
  for (const poi of candidates) {
    const d =
      Math.pow(poi.coordinates.lat - from.coordinates.lat, 2) +
      Math.pow(poi.coordinates.lng - from.coordinates.lng, 2);
    if (d < bestDist) {
      bestDist = d;
      best = poi;
    }
  }
  return best;
}

export function formatPulseSummary(): string {
  return CAMPUS_PULSE.map((p) => `• ${p.label}: ${p.detail ?? p.status}`).join('\n');
}

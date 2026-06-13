/**
 * Extended campus data for Live Pulse, safety POIs, and path attributes
 * (noise, covered walkways) used by quiet & weather-shielded routing.
 */
import { Coordinates } from '@/types';

export type SafetyPoiType = 'aed' | 'exit' | 'assembly';

export interface SafetyPoi {
  id: string;
  type: SafetyPoiType;
  name: string;
  building_id: string;
  coordinates: Coordinates;
  floor?: string;
}

export interface PathAttributes {
  noise_level: number; // 0 = quiet, 10 = very noisy
  is_covered: boolean;
  is_indoor: boolean;
}

export interface CampusPulseEntry {
  building_id: string;
  label: string;
  status: 'good' | 'moderate' | 'busy' | 'full';
  /** Extra minutes to add when routing through this building's paths */
  congestion_penalty_minutes?: number;
  detail?: string;
}

/** Per-edge attributes keyed as "from-to" (both directions use same meta). */
export const PATH_ATTRIBUTES: Record<string, PathAttributes> = {
  'main_gate-admin_block': { noise_level: 3, is_covered: false, is_indoor: false },
  'admin_block-library': { noise_level: 2, is_covered: true, is_indoor: true },
  'library-cafeteria': { noise_level: 4, is_covered: true, is_indoor: true },
  'cafeteria-cs_block': { noise_level: 8, is_covered: false, is_indoor: false },
  'cs_block-mech_block': { noise_level: 5, is_covered: false, is_indoor: false },
  'mech_block-innovation_hub': { noise_level: 3, is_covered: true, is_indoor: false },
  'main_gate-parking_p1': { noise_level: 4, is_covered: false, is_indoor: false },
  'parking_p1-medical_center': { noise_level: 2, is_covered: true, is_indoor: false },
  'medical_center-cafeteria': { noise_level: 7, is_covered: false, is_indoor: false },
  'admin_block-atm_bank': { noise_level: 3, is_covered: true, is_indoor: true },
  'atm_bank-cafeteria': { noise_level: 6, is_covered: true, is_indoor: true },
  'cs_block-auditorium': { noise_level: 5, is_covered: false, is_indoor: false },
  'auditorium-sports_complex': { noise_level: 6, is_covered: false, is_indoor: false },
  'sports_complex-hostel_a': { noise_level: 4, is_covered: false, is_indoor: false },
  'hostel_a-hostel_b': { noise_level: 3, is_covered: false, is_indoor: false },
  'hostel_b-innovation_hub': { noise_level: 2, is_covered: true, is_indoor: false },
  'library-cs_block': { noise_level: 2, is_covered: true, is_indoor: true },
  'cafeteria-food_truck_zone': { noise_level: 9, is_covered: false, is_indoor: false },
  'innovation_hub-food_truck_zone': { noise_level: 7, is_covered: false, is_indoor: false },
  'auditorium-main_gate': { noise_level: 5, is_covered: false, is_indoor: false },
  'cs_block-hostel_a': { noise_level: 4, is_covered: true, is_indoor: false },
  'medical_center-atm_bank': { noise_level: 3, is_covered: true, is_indoor: true },
  'sports_complex-mech_block': { noise_level: 5, is_covered: false, is_indoor: false },
  'parking_p1-admin_block': { noise_level: 3, is_covered: true, is_indoor: false },
};

export const DEFAULT_PATH_ATTR: PathAttributes = {
  noise_level: 3,
  is_covered: false,
  is_indoor: false,
};

export function getPathAttributes(from: string, to: string): PathAttributes {
  return (
    PATH_ATTRIBUTES[`${from}-${to}`] ??
    PATH_ATTRIBUTES[`${to}-${from}`] ??
    DEFAULT_PATH_ATTR
  );
}

/** Simulated live campus pulse — demo-friendly, updates routing suggestions. */
export const CAMPUS_PULSE: CampusPulseEntry[] = [
  {
    building_id: 'cafeteria',
    label: 'Central Cafeteria',
    status: 'busy',
    congestion_penalty_minutes: 5,
    detail: 'West entrance has a ~20 min queue. East path recommended.',
  },
  {
    building_id: 'library',
    label: 'Main Library',
    status: 'moderate',
    detail: '42 study seats available (of 200). Quiet floor has space.',
  },
  {
    building_id: 'parking_p1',
    label: 'Parking Lot P1',
    status: 'moderate',
    detail: '12 accessible bays free. EV charging: 3 spots open.',
  },
  {
    building_id: 'food_truck_zone',
    label: 'Food Truck Zone',
    status: 'busy',
    congestion_penalty_minutes: 3,
    detail: 'Crowded lunch rush — noisy, avoid for sensory routes.',
  },
  {
    building_id: 'auditorium',
    label: 'Auditorium',
    status: 'good',
    detail: 'Tech Fest registration — moderate foot traffic near lobby.',
  },
];

export const SAFETY_POIS: SafetyPoi[] = [
  {
    id: 'exit_main_gate',
    type: 'exit',
    name: 'Main Gate Emergency Exit',
    building_id: 'main_gate',
    coordinates: { lat: 17.4448, lng: 78.3487 },
  },
  {
    id: 'exit_admin',
    type: 'exit',
    name: 'Admin Block Rear Exit',
    building_id: 'admin_block',
    coordinates: { lat: 17.4453, lng: 78.3498 },
  },
  {
    id: 'aed_admin',
    type: 'aed',
    name: 'AED — Admin Block Ground Floor',
    building_id: 'admin_block',
    coordinates: { lat: 17.4456, lng: 78.3494 },
    floor: 'Ground',
  },
  {
    id: 'aed_library',
    type: 'aed',
    name: 'AED — Library Entrance',
    building_id: 'library',
    coordinates: { lat: 17.4461, lng: 78.3499 },
    floor: 'Ground',
  },
  {
    id: 'aed_medical',
    type: 'aed',
    name: 'AED — Medical Center',
    building_id: 'medical_center',
    coordinates: { lat: 17.4468, lng: 78.3510 },
  },
  {
    id: 'assembly_sports',
    type: 'assembly',
    name: 'Sports Ground Assembly Point',
    building_id: 'sports_complex',
    coordinates: { lat: 17.4478, lng: 78.3520 },
  },
  {
    id: 'assembly_main',
    type: 'assembly',
    name: 'Main Gate Assembly Area',
    building_id: 'main_gate',
    coordinates: { lat: 17.4449, lng: 78.3491 },
  },
];

/** Buildings whose nearby paths get extra congestion cost when pulse is busy. */
export const PULSE_AFFECTED_BUILDINGS = new Set([
  'cafeteria',
  'food_truck_zone',
  'library',
  'parking_p1',
  'auditorium',
]);

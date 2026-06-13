import * as Speech from 'expo-speech';
import { RouteData } from '@/types';
import type { LanguageCode } from '@/store/userStore';

const LOCALE_MAP: Record<LanguageCode, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  pa: 'pa-IN',
};

export function speak(text: string, language: LanguageCode = 'en'): void {
  Speech.stop();
  Speech.speak(text, {
    language: LOCALE_MAP[language] ?? 'en-US',
    rate: 0.95,
    pitch: 1.0,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

/** Builds a natural spoken summary of a route from its steps. */
export function routeToSpeech(route: RouteData): string {
  const intro = `Route to ${route.to_building.name}. About ${route.total_walk_time_minutes} minutes, ${route.total_distance_meters} meters.`;
  const steps = route.steps.join('. ');
  const note = route.accessibility_notes ? ` ${route.accessibility_notes}` : '';
  return `${intro} ${steps}.${note}`;
}

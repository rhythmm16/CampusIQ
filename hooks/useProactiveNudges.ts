import { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import { BUILDINGS, SAMPLE_EVENTS } from '@/constants/campus';
import { CAMPUS_PULSE } from '@/constants/campusFeatures';
import { scheduleNudge, cancelAllNudges } from '@/services/notifications';
import { isBadWeather, getWeatherDescription, refreshWeather } from '@/services/weather';
import { useUserStore } from '@/store';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function minutesUntilClose(buildingId: string): number | null {
  const b = BUILDINGS.find((x) => x.building_id === buildingId);
  if (!b) return null;
  const day = DAYS[new Date().getDay()];
  const hours = b.operating_hours[day];
  if (!hours || hours.is_closed) return null;
  const [ch, cm] = hours.close.split(':').map(Number);
  const closeMin = ch * 60 + cm;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const diff = closeMin - nowMin;
  return diff > 0 && diff <= 30 ? diff : null;
}

/**
 * Proactive push intelligence: event alerts, closing-soon warnings,
 * live pulse heads-ups, and weather nudges.
 */
export function useProactiveNudges(enabled: boolean = true) {
  const language = useUserStore((s) => s.language);
  const sentRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let cancelled = false;

    const run = async () => {
      await refreshWeather();
      if (cancelled) return;

      const nudges: { id: string; title: string; body: string; delay: number }[] = [];

      // Navigation-affecting events
      for (const event of SAMPLE_EVENTS.filter((e) => e.is_active && e.affects_navigation)) {
        if (event.alternate_route_note) {
          nudges.push({
            id: `event-${event.event_id}`,
            title: event.title,
            body: event.alternate_route_note,
            delay: 8,
          });
        }
      }

      // Building closing soon (e.g. "Building B closes in 15 mins")
      for (const b of BUILDINGS) {
        const mins = minutesUntilClose(b.building_id);
        if (mins !== null) {
          nudges.push({
            id: `close-${b.building_id}`,
            title: `${b.short_name} closes soon`,
            body: `${b.short_name} closes in ${mins} minutes. Plan to leave if you're heading there.`,
            delay: 12,
          });
        }
      }

      // Live pulse — cafeteria queue, parking, library seats
      for (const pulse of CAMPUS_PULSE.filter((p) => p.status === 'busy' || p.status === 'full')) {
        if (pulse.detail) {
          nudges.push({
            id: `pulse-${pulse.building_id}`,
            title: `Live: ${pulse.label}`,
            body: pulse.detail,
            delay: 18,
          });
        }
      }

      // Weather nudge
      if (isBadWeather()) {
        nudges.push({
          id: 'weather',
          title: 'Weather alert',
          body: `${getWeatherDescription()}. Ask for a weather-shielded route.`,
          delay: 25,
        });
      }

      for (const n of nudges) {
        if (sentRef.current.has(n.id)) continue;
        sentRef.current.add(n.id);
        await scheduleNudge(n.title, n.body, n.delay);
      }
    };

    run();
    const interval = setInterval(run, 5 * 60 * 1000);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
    };
  }, [enabled, language]);
}

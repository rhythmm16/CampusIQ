import { useCallback, useEffect, useRef, useState } from 'react';
import { RouteData } from '@/types';
import { speak, stopSpeaking } from '@/services/speech';
import type { LanguageCode } from '@/store/userStore';

/**
 * Speaks route steps one at a time — demo-friendly turn-by-turn voice guidance.
 */
export function useTurnByTurnSpeech(language: LanguageCode = 'en') {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const routeRef = useRef<RouteData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const stop = useCallback(() => {
    clearTimer();
    stopSpeaking();
    setActive(false);
    setStepIndex(0);
    routeRef.current = null;
  }, []);

  const speakStep = useCallback(
    (route: RouteData, index: number) => {
      const step = route.steps[index];
      if (!step) {
        stop();
        return;
      }
      setStepIndex(index);
      speak(step, language);
      const delayMs = Math.max(3500, step.length * 55);
      timerRef.current = setTimeout(() => {
        if (index + 1 < route.steps.length) {
          speakStep(route, index + 1);
        } else {
          setActive(false);
        }
      }, delayMs);
    },
    [language, stop]
  );

  const start = useCallback(
    (route: RouteData) => {
      stop();
      routeRef.current = route;
      setActive(true);
      const intro = `Navigation to ${route.to_building.short_name}. ${route.total_walk_time_minutes} minutes, ${route.total_distance_meters} meters.`;
      speak(intro, language);
      timerRef.current = setTimeout(() => speakStep(route, 0), 2800);
    },
    [language, speakStep, stop]
  );

  useEffect(() => () => {
    clearTimer();
    stopSpeaking();
  }, []);

  return { active, stepIndex, start, stop, totalSteps: routeRef.current?.steps.length ?? 0 };
}

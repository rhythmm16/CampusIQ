/** Weather context for weather-shielded routing (Open-Meteo, no API key). */
import { CAMPUS_CENTER } from '@/constants/campus';

export interface WeatherSnapshot {
  isBad: boolean;
  description: string;
  temperatureC: number;
  isRaining: boolean;
  isHot: boolean;
  fetchedAt: number;
}

let cache: WeatherSnapshot | null = null;
const CACHE_MS = 15 * 60 * 1000;

export function isBadWeather(): boolean {
  return cache?.isBad ?? false;
}

export function getWeatherDescription(): string {
  return cache?.description ?? 'Weather data unavailable';
}

export function getCachedWeather(): WeatherSnapshot | null {
  return cache;
}

export async function refreshWeather(): Promise<WeatherSnapshot> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache;
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${CAMPUS_CENTER.lat}` +
      `&longitude=${CAMPUS_CENTER.lng}&current=temperature_2m,precipitation,weather_code`;

    const res = await fetch(url);
    const data = await res.json();
    const temp = data.current?.temperature_2m ?? 28;
    const precip = data.current?.precipitation ?? 0;
    const code = data.current?.weather_code ?? 0;

    const isRaining = precip > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);
    const isHot = temp >= 38;
    const isBad = isRaining || isHot;

    let description = `Clear, ${Math.round(temp)}°C`;
    if (isRaining) description = `Rain expected (${Math.round(temp)}°C) — use covered routes`;
    else if (isHot) description = `Hot (${Math.round(temp)}°C) — prefer shaded/covered paths`;

    cache = {
      isBad,
      description,
      temperatureC: temp,
      isRaining,
      isHot,
      fetchedAt: Date.now(),
    };
    return cache;
  } catch {
    cache = {
      isBad: false,
      description: 'Weather unavailable',
      temperatureC: 28,
      isRaining: false,
      isHot: false,
      fetchedAt: Date.now(),
    };
    return cache;
  }
}

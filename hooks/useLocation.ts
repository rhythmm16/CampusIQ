import { useState, useEffect, useCallback } from 'react';
import { LocationState } from '@/types';

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: 30.5135,
    longitude: 76.6575,
    hasPermission: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      // Dynamic import for expo-location (may not be available on web)
      const Location = await import('expo-location').catch(() => null);

      if (!Location) {
        // Use default campus location on web
        setLocation({
          latitude: 30.5135,
          longitude: 76.6575,
          hasPermission: false,
        });
        setIsLoading(false);
        return true;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        setIsLoading(false);
        return false;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        hasPermission: true,
      });
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Could not get location');
      setIsLoading(false);
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    if (!location.hasPermission) {
      return await requestPermission();
    }

    try {
      const Location = await import('expo-location').catch(() => null);
      if (!Location) return true;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        hasPermission: true,
      });

      return true;
    } catch (error) {
      console.error('Error refreshing location:', error);
      return false;
    }
  }, [location.hasPermission, requestPermission]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {
    location,
    isLoading,
    errorMsg,
    requestPermission,
    getCurrentLocation,
  };
}

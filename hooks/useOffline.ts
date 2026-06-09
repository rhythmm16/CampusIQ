import { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '@/store';
import { offlineCache } from '@/services/offlineCache';
import { BUILDINGS, SAMPLE_EVENTS } from '@/constants/campus';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { setConnected } = useChatStore();

  const checkNetworkStatus = useCallback(async () => {
    try {
      // Try to use expo-network if available, otherwise use navigator.onLine for web
      const Network = await import('expo-network').catch(() => null);

      if (Network) {
        const status = await Network.getNetworkStateAsync();
        const offline = status.type === Network.NetworkStateType.UNKNOWN ||
          status.type === Network.NetworkStateType.NONE ||
          status.isInternetReachable === false;

        setIsOffline(offline);
        setConnected(!offline);
        return !offline;
      } else {
        // Web fallback using navigator.onLine
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        setIsOffline(!online);
        setConnected(online);
        return online;
      }
    } catch (error) {
      console.error('Error checking network status:', error);
      // Default to online if we can't determine status
      setIsOffline(false);
      setConnected(true);
      return true;
    } finally {
      setIsChecking(false);
    }
  }, [setConnected]);

  useEffect(() => {
    checkNetworkStatus();

    // Poll for network status changes
    const interval = setInterval(checkNetworkStatus, 10000);

    // Listen for online/offline events (web)
    const handleOnline = () => {
      setIsOffline(false);
      setConnected(true);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setConnected(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [checkNetworkStatus, setConnected]);

  const preloadData = useCallback(async () => {
    try {
      await offlineCache.cacheBuildings(BUILDINGS);
      await offlineCache.cacheEvents(SAMPLE_EVENTS);
      await offlineCache.preCachePopularRoutes();
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  }, []);

  return {
    isOffline,
    isChecking,
    checkNetworkStatus,
    preloadData,
  };
}

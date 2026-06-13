import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let configured = false;

function configure() {
  if (configured || Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  configured = true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  configure();
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

/** Schedules a proactive local nudge a number of seconds from now. */
export async function scheduleNudge(
  title: string,
  body: string,
  secondsFromNow: number
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  configure();
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger:
      secondsFromNow > 0
        ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsFromNow }
        : null,
  });
}

export async function cancelAllNudges(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

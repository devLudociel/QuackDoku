import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { track } from './telemetry';

const DAILY_REMINDER_ID = 'quackdoku-daily-reminder';

async function loadNotifications() {
  try {
    return await import('expo-notifications');
  } catch (error) {
    if (__DEV__) console.warn('[notifications] module unavailable', error);
    return null;
  }
}

export async function configureNotificationHandler(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  const current = await Notifications.getPermissionsAsync();
  const finalStatus = current.status === 'granted'
    ? current.status
    : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted') {
    track('push_permission_denied');
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    track('push_token_registered');
    return token.data;
  } catch (error) {
    if (__DEV__) console.warn('[notifications] token failed', error);
    return null;
  }
}

export async function scheduleDailyReminder(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Notifications = await loadNotifications();
  if (!Notifications) return false;

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'QuackDoku',
      body: 'Tu caso diario ya esta listo.',
      data: { route: '/daily' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
  track('push_daily_reminder_enabled');
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => undefined);
  track('push_daily_reminder_disabled');
}

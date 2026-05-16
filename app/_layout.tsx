import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { InteractionManager, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { unloadAllSfx } from '../lib/sound';
import { flushTelemetry, identifyUser, initTelemetry, track } from '../lib/telemetry';
import { configureNotificationHandler } from '../lib/notifications';
import { initRevenueCat, refreshRevenueCatEntitlements } from '../lib/revenueCat';
import { useUserStore } from '../stores/userStore';
import ErrorBoundary from '../components/ErrorBoundary';
// Once SFX files exist under assets/sfx (see assets/sfx/README.md),
// import { registerSfx } from '../lib/sound'; and uncomment below.
// import { registerSfx } from '../lib/sound';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST;
const APP_ENV = process.env.EXPO_PUBLIC_ENV ?? 'development';

export default function RootLayout() {
  if (__DEV__) console.log('[layout] RootLayout render');

  useEffect(() => {
    if (__DEV__) console.log('[layout] RootLayout mounted');

    // SFX registration — uncomment when assets/sfx/*.mp3 files exist.
    // registerSfx('place', require('../assets/sfx/place.mp3'));
    // registerSfx('error', require('../assets/sfx/error.mp3'));
    // registerSfx('victory', require('../assets/sfx/victory.mp3'));
    // registerSfx('hint', require('../assets/sfx/hint.mp3'));
    // registerSfx('undo', require('../assets/sfx/undo.mp3'));
    // registerSfx('select', require('../assets/sfx/select.mp3'));
    // registerSfx('tick', require('../assets/sfx/tick.mp3'));

    let bootTimer: ReturnType<typeof setTimeout> | null = null;
    const bootTask = InteractionManager.runAfterInteractions(() => {
      bootTimer = setTimeout(() => {
        void (async () => {
          await initTelemetry({
            posthogApiKey: POSTHOG_API_KEY,
            posthogHost: POSTHOG_HOST,
            environment: APP_ENV,
            debug: __DEV__,
          });

          const user = useUserStore.getState();
          identifyUser(user.username || 'anon', {
            level: user.level,
            cases_completed: user.casesCompleted,
            streak: user.streakDays,
            has_league_pass: user.hasLeaguePass,
          });
          void configureNotificationHandler();
          void initRevenueCat(user.username || 'anon').then((ready) => {
            if (ready) void refreshRevenueCatEntitlements();
          });
          track('app_open', {
            platform: Platform.OS,
          });
          void flushTelemetry();
        })();
      }, 500);
    });

    return () => {
      bootTask.cancel();
      if (bootTimer) clearTimeout(bootTimer);
      try { flushTelemetry(); } catch {}
      try { unloadAllSfx(); } catch {}
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={Colors.background} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="daily/index" />
          <Stack.Screen name="daily/result" />
          <Stack.Screen name="game/[caseId]" />
          <Stack.Screen name="case/[caseId]" options={{ headerShown: true, title: 'Detalle del Caso' }} />
        </Stack>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

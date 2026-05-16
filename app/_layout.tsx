import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Colors } from '../constants/theme';
import { unloadAllSfx } from '../lib/sound';
import { initTelemetry, track, flushTelemetry, identifyUser } from '../lib/telemetry';
import ErrorBoundary from '../components/ErrorBoundary';
import { useUserStore } from '../stores/userStore';
// Once SFX files exist under assets/sfx (see assets/sfx/README.md),
// import { registerSfx } from '../lib/sound'; and uncomment below.
// import { registerSfx } from '../lib/sound';

function readEnv(key: string): string | undefined {
  const fromProcess = (process.env as Record<string, string | undefined>)[key];
  if (fromProcess) return fromProcess;
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const val = extra[key];
  return typeof val === 'string' ? val : undefined;
}

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

    let cancelled = false;
    const timer = setTimeout(() => {
      (async () => {
        try {
          await initTelemetry({
            posthogApiKey: readEnv('EXPO_PUBLIC_POSTHOG_API_KEY'),
            posthogHost: readEnv('EXPO_PUBLIC_POSTHOG_HOST'),
            sentryDsn: readEnv('EXPO_PUBLIC_SENTRY_DSN'),
            environment: readEnv('EXPO_PUBLIC_ENV') ?? 'development',
            release: Constants.expoConfig?.version,
            debug: __DEV__,
          });
          if (cancelled) return;

          const user = useUserStore.getState();
          identifyUser(user.username || 'anon', {
            level: user.level,
            cases_completed: user.casesCompleted,
            streak: user.streakDays,
            has_league_pass: user.hasLeaguePass,
          });
          track('app_open', {
            platform: Constants.platform?.ios ? 'ios' : Constants.platform?.android ? 'android' : 'web',
            version: Constants.expoConfig?.version,
          });
        } catch (err) {
          if (__DEV__) console.warn('[layout] telemetry boot failed', err);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
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

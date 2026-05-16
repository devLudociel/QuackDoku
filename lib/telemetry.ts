import { Platform } from 'react-native';
import PostHog from 'posthog-react-native';
import * as Sentry from '@sentry/react-native';

// Telemetry abstraction. Two backends:
//   - PostHog for product analytics (Expo Go safe, JS only).
//   - Sentry for crash reporting + perf (needs dev build / EAS; not Expo Go).
// Both initialize behind try/catch so missing env or native modules never
// crash the app. Calls before init() are queued only for PostHog (its SDK
// buffers internally); for Sentry they no-op silently.

export type TelemetryEvent =
  | 'app_open'
  | 'tutorial_started'
  | 'tutorial_completed'
  | 'tutorial_skipped'
  | 'case_started'
  | 'case_completed'
  | 'case_failed'
  | 'hint_used'
  | 'hint_denied'
  | 'life_lost'
  | 'duck_placed'
  | 'accusation_submitted'
  | 'daily_started'
  | 'daily_completed'
  | 'daily_shared'
  | 'shop_opened'
  | 'iap_intent'
  | 'iap_purchased'
  | 'rewarded_ad_requested'
  | 'rewarded_ad_completed'
  | 'screen_view'
  | 'error_boundary';

interface TelemetryConfig {
  posthogApiKey?: string;
  posthogHost?: string;
  sentryDsn?: string;
  environment?: string;
  release?: string;
  debug?: boolean;
}

let posthogClient: PostHog | null = null;
let sentryReady = false;
let initialized = false;

export async function initTelemetry(config: TelemetryConfig = {}): Promise<void> {
  if (initialized) return;
  initialized = true;

  // PostHog
  try {
    if (config.posthogApiKey) {
      posthogClient = new PostHog(config.posthogApiKey, {
        host: config.posthogHost ?? 'https://eu.i.posthog.com',
        flushAt: 20,
        flushInterval: 20_000,
        captureAppLifecycleEvents: false,
      });
    }
  } catch (err) {
    if (config.debug) console.warn('[telemetry] PostHog init failed', err);
    posthogClient = null;
  }

  // Sentry — wrapped, will silently no-op under Expo Go (missing native).
  try {
    if (config.sentryDsn && Platform.OS !== 'web') {
      Sentry.init({
        dsn: config.sentryDsn,
        environment: config.environment ?? 'production',
        release: config.release,
        tracesSampleRate: 0.2,
        enableAutoSessionTracking: true,
        debug: !!config.debug,
      });
      sentryReady = true;
    }
  } catch (err) {
    if (config.debug) console.warn('[telemetry] Sentry init failed', err);
    sentryReady = false;
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  try {
    posthogClient?.identify(userId, traits as Record<string, any>);
  } catch {
    // ignore
  }
  try {
    if (sentryReady) Sentry.setUser({ id: userId, ...(traits ?? {}) });
  } catch {
    // ignore
  }
}

export function setUserContext(traits: Record<string, unknown>): void {
  try {
    posthogClient?.register(traits as Record<string, any>);
  } catch {
    // ignore
  }
}

export function track(event: TelemetryEvent, properties?: Record<string, unknown>): void {
  try {
    posthogClient?.capture(event, properties as Record<string, any>);
  } catch {
    // ignore
  }
  try {
    if (sentryReady) {
      Sentry.addBreadcrumb({
        category: 'event',
        message: event,
        data: properties as Record<string, any>,
        level: 'info',
      });
    }
  } catch {
    // ignore
  }
}

export function trackScreen(name: string, properties?: Record<string, unknown>): void {
  track('screen_view', { screen: name, ...properties });
  try {
    posthogClient?.screen(name, properties as Record<string, any>);
  } catch {
    // ignore
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  try {
    if (sentryReady) {
      if (context) Sentry.setContext('extra', context as Record<string, any>);
      Sentry.captureException(error);
    }
  } catch {
    // ignore
  }
  try {
    const props: Record<string, any> = {
      message: error instanceof Error ? error.message : String(error),
      ...context,
    };
    if (error instanceof Error && error.stack) props.stack = error.stack;
    posthogClient?.capture('exception', props);
  } catch {
    // ignore
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  try {
    if (sentryReady) Sentry.captureMessage(message, level);
  } catch {
    // ignore
  }
}

export async function flushTelemetry(): Promise<void> {
  try {
    await posthogClient?.flush();
  } catch {
    // ignore
  }
  try {
    if (sentryReady) await Sentry.flush();
  } catch {
    // ignore
  }
}

export function isTelemetryReady(): boolean {
  return initialized && (posthogClient !== null || sentryReady);
}

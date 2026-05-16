// Telemetry — stub no-op edition.
//
// posthog-react-native v4 and @sentry/react-native v7 both ship modern ESM
// using `import.meta`, which Hermes (the RN engine bundled with Expo Go)
// rejects at parse time. Loading either package from JS breaks the entire
// bundle even when the require() is wrapped in try/catch — Metro still
// inlines the source, and Hermes refuses to evaluate it.
//
// Workaround: keep the public API (`track`, `identifyUser`, `captureException`,
// etc.) as no-ops here. Once we move from Expo Go to an EAS dev build with
// a Babel pipeline that transforms `import.meta`, swap this file for the
// real implementation in `lib/telemetry.real.ts` (to be added) or revert
// from git history (commit e8e3d1a).

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

let initialized = false;

export async function initTelemetry(config: TelemetryConfig = {}): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (config.debug) {
    console.log('[telemetry] stub init (no-op until EAS dev build)', {
      hasPosthogKey: !!config.posthogApiKey,
      hasSentryDsn: !!config.sentryDsn,
      environment: config.environment,
    });
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (__DEV__) console.log('[telemetry/stub] identify', userId, traits);
}

export function setUserContext(traits: Record<string, unknown>): void {
  if (__DEV__) console.log('[telemetry/stub] context', traits);
}

export function track(event: TelemetryEvent, properties?: Record<string, unknown>): void {
  if (__DEV__) console.log('[telemetry/stub] track', event, properties);
}

export function trackScreen(name: string, properties?: Record<string, unknown>): void {
  if (__DEV__) console.log('[telemetry/stub] screen', name, properties);
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) console.warn('[telemetry/stub] exception', error, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (__DEV__) console.log('[telemetry/stub] message', level, message);
}

export async function flushTelemetry(): Promise<void> {
  // no-op
}

export function isTelemetryReady(): boolean {
  return initialized;
}

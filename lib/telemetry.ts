// Lightweight telemetry for Expo Go.
//
// Do not import the PostHog/Sentry React Native SDKs here. Some SDK builds pull
// in modern ESM/native startup paths that can break Expo Go before Home mounts.
// This file talks to PostHog's ingestion API directly and stays dependency-free.

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
  | 'characters_opened'
  | 'shop_opened'
  | 'profile_opened'
  | 'iap_intent'
  | 'iap_purchased'
  | 'rewarded_ad_requested'
  | 'rewarded_ad_completed'
  | 'push_permission_denied'
  | 'push_token_registered'
  | 'push_daily_reminder_enabled'
  | 'push_daily_reminder_disabled'
  | 'iap_revenuecat_ready'
  | 'iap_entitlements_refreshed'
  | 'screen_view'
  | 'error_boundary'
  | '$screen'
  | '$identify'
  | '$exception'
  | '$log';

interface TelemetryConfig {
  posthogApiKey?: string;
  posthogHost?: string;
  sentryDsn?: string;
  environment?: string;
  release?: string;
  debug?: boolean;
}

interface QueuedEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
}

let initialized = false;
let debugMode = false;
let posthogApiKey: string | null = null;
let posthogHost = 'https://eu.i.posthog.com';
let environment = 'development';
let release: string | undefined;
let distinctId = `anon_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
let superProperties: Record<string, unknown> = {};
const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

const FLUSH_DELAY_MS = 2_000;
const FLUSH_AT = 8;

function isUsableKey(value?: string): value is string {
  return !!value && value.startsWith('phc_') && !value.includes('replace_me');
}

function normalizeHost(host?: string): string {
  const value = host?.trim() || posthogHost;
  return value.replace(/\/+$/, '');
}

function scheduleFlush(): void {
  if (!posthogApiKey || flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushTelemetry();
  }, FLUSH_DELAY_MS);
}

export async function initTelemetry(config: TelemetryConfig = {}): Promise<void> {
  if (initialized) return;
  initialized = true;
  debugMode = !!config.debug;
  posthogHost = normalizeHost(config.posthogHost);
  environment = config.environment ?? environment;
  release = config.release;

  if (isUsableKey(config.posthogApiKey)) {
    posthogApiKey = config.posthogApiKey;
  }

  superProperties = {
    environment,
    release,
    app: 'quackdoku',
  };

  if (debugMode) {
    console.log('[telemetry] init', {
      enabled: !!posthogApiKey,
      host: posthogHost,
      environment,
    });
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (!userId) return;
  distinctId = userId;
  track('$identify', {
    $set: traits ?? {},
  });
}

export function setUserContext(traits: Record<string, unknown>): void {
  superProperties = { ...superProperties, ...traits };
}

export function track(event: TelemetryEvent, properties?: Record<string, unknown>): void {
  if (!posthogApiKey) {
    if (debugMode) console.log('[telemetry] skipped', event);
    return;
  }

  queue.push({
    event,
    properties: {
      ...superProperties,
      ...(properties ?? {}),
    },
    timestamp: new Date().toISOString(),
  });

  if (debugMode) console.log('[telemetry] queued', event);

  if (queue.length >= FLUSH_AT) {
    void flushTelemetry();
  } else {
    scheduleFlush();
  }
}

export function trackScreen(name: string, properties?: Record<string, unknown>): void {
  track('$screen', { $screen_name: name, screen: name, ...properties });
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  track('$exception', {
    ...(context ?? {}),
    $exception_message: message,
    $exception_stack_trace: stack,
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  track('$log', { message, level });
}

export async function flushTelemetry(): Promise<void> {
  if (!posthogApiKey || flushing || queue.length === 0) return;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  flushing = true;
  const batch = queue.splice(0, queue.length);

  try {
    const responses = await Promise.all(
      batch.map((item) =>
        fetch(`${posthogHost}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: posthogApiKey,
            event: item.event,
            distinct_id: distinctId,
            properties: {
              distinct_id: distinctId,
              ...item.properties,
            },
            timestamp: item.timestamp,
          }),
        })
      )
    );
    if (debugMode) {
      const failed = responses.filter((response) => !response.ok);
      if (failed.length > 0) {
        console.warn('[telemetry] PostHog rejected events', failed.map((response) => response.status));
      }
    }
    if (debugMode) console.log('[telemetry] flushed', batch.length);
  } catch (error) {
    queue.unshift(...batch);
    if (debugMode) console.warn('[telemetry] flush failed', error);
    scheduleFlush();
  } finally {
    flushing = false;
  }
}

export function isTelemetryReady(): boolean {
  return !!posthogApiKey;
}

import Constants from 'expo-constants';
import type { DailyCompletion, DailyLeaderboardEntry } from '../stores/dailyStore';
import { getDailyCaseForDate } from './daily';

interface DailyApiConfig {
  apiUrl?: string;
}

interface RemoteDailyResponse {
  date: string;
  dayNumber: number;
  caseId: string;
  title: string;
  boardSeed: number;
}

type CompleteDailyPayload = DailyCompletion & {
  installId: string;
  username: string;
};

function getApiUrl(config: DailyApiConfig = {}): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const fromExpo = Constants.expoConfig?.extra?.apiUrl;
  const value = config.apiUrl ?? fromEnv ?? (typeof fromExpo === 'string' ? fromExpo : undefined);
  if (!value || value.includes('replace_me')) return null;
  return value.replace(/\/+$/, '');
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    if (__DEV__) console.warn('[daily-api] request failed', path, error);
    return null;
  }
}

export async function fetchRemoteDaily(date = getDailyCaseForDate().date): Promise<RemoteDailyResponse | null> {
  return requestJson<RemoteDailyResponse>(`/cases/daily?date=${encodeURIComponent(date)}`);
}

export async function fetchRemoteDailyLeaderboard(date: string): Promise<DailyLeaderboardEntry[] | null> {
  const result = await requestJson<{ leaderboard: DailyLeaderboardEntry[] }>(
    `/cases/daily/leaderboard?date=${encodeURIComponent(date)}`
  );
  return result?.leaderboard ?? null;
}

export async function submitRemoteDailyCompletion(payload: CompleteDailyPayload): Promise<boolean> {
  const result = await requestJson<{ ok: boolean }>('/cases/daily/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return !!result?.ok;
}

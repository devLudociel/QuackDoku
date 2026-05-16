import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export interface DailyResultRecord {
  installId: string;
  username: string;
  date: string;
  caseId: string;
  caseName: string;
  dayNumber: number;
  stars: number;
  timeSeconds: number;
  errors: number;
  completedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  stars: number;
  timeSeconds: number;
  isUser?: boolean;
}

const DATA_FILE = resolve(process.env.DATA_FILE ?? './data/daily-results.json');

async function readResults(): Promise<DailyResultRecord[]> {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw) as DailyResultRecord[];
  } catch {
    return [];
  }
}

async function writeResults(results: DailyResultRecord[]): Promise<void> {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
}

export async function upsertDailyResult(record: DailyResultRecord): Promise<DailyResultRecord> {
  const results = await readResults();
  const index = results.findIndex((item) => item.date === record.date && item.installId === record.installId);

  if (index >= 0) {
    const existing = results[index];
    const isBetter =
      record.stars > existing.stars ||
      (record.stars === existing.stars && record.timeSeconds < existing.timeSeconds);
    if (!isBetter) return existing;
    results[index] = record;
  } else {
    results.push(record);
  }

  await writeResults(results);
  return record;
}

export async function getDailyLeaderboard(date: string): Promise<LeaderboardEntry[]> {
  const results = (await readResults()).filter((item) => item.date === date);
  return results
    .sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      if (a.timeSeconds !== b.timeSeconds) return a.timeSeconds - b.timeSeconds;
      return a.errors - b.errors;
    })
    .slice(0, 50)
    .map((item, index) => ({
      rank: index + 1,
      username: item.username || 'Detective',
      stars: item.stars,
      timeSeconds: item.timeSeconds,
    }));
}

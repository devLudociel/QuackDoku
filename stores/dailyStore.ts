import { create } from 'zustand';
import { generateDailySeed } from '../lib/daily';

export interface DailyCompletion {
  date: string;
  caseId: string;
  caseName: string;
  dayNumber: number;
  stars: number;
  timeSeconds: number;
  errors: number;
  shareGrid: string[][];
  completedAt: string;
}

export interface DailyLeaderboardEntry {
  rank: number;
  username: string;
  stars: number;
  timeSeconds: number;
  isUser?: boolean;
}

interface CompleteDailyInput {
  date: string;
  caseId: string;
  caseName: string;
  dayNumber: number;
  stars: number;
  timeSeconds: number;
  errors: number;
  shareGrid: string[][];
}

interface DailyStore {
  resultsByDate: Record<string, DailyCompletion>;
  completeDailyCase: (input: CompleteDailyInput) => DailyCompletion;
  getResultForDate: (date: string) => DailyCompletion | null;
  getLeaderboardForDate: (date: string) => DailyLeaderboardEntry[];
}

const DETECTIVE_NAMES = [
  'Pato Noir',
  'Billington',
  'Quack Holmes',
  'Dama Lima',
  'Sheriff Plumas',
  'Agente Mallard',
  'Cisne Gris',
  'Lady Feather',
  'Detective Sol',
  'Capitan Quack',
  'Inspector Lago',
  'Chef Gusto',
];

function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function buildMockLeaderboard(date: string): DailyLeaderboardEntry[] {
  const random = seededRandom(generateDailySeed(date));

  return DETECTIVE_NAMES.map((username, index) => ({
    rank: index + 1,
    username,
    stars: random() > 0.22 ? 3 : 2,
    timeSeconds: 210 + Math.floor(random() * 520),
  }));
}

function rankEntries(entries: Omit<DailyLeaderboardEntry, 'rank'>[]): DailyLeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return a.timeSeconds - b.timeSeconds;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export const useDailyStore = create<DailyStore>((set, get) => ({
  resultsByDate: {},

  completeDailyCase: (input) => {
    const existing = get().resultsByDate[input.date];
    if (existing) return existing;

    const completion: DailyCompletion = {
      ...input,
      completedAt: new Date().toISOString(),
    };

    set((state) => ({
      resultsByDate: {
        ...state.resultsByDate,
        [input.date]: completion,
      },
    }));

    return completion;
  },

  getResultForDate: (date) => get().resultsByDate[date] ?? null,

  getLeaderboardForDate: (date) => {
    const result = get().resultsByDate[date];
    const generated = buildMockLeaderboard(date);
    const entries: Omit<DailyLeaderboardEntry, 'rank'>[] = generated.map(({ rank: _rank, ...entry }) => entry);

    if (result) {
      entries.push({
        username: 'Detective',
        stars: result.stars,
        timeSeconds: result.timeSeconds,
        isUser: true,
      });
    }

    return rankEntries(entries).slice(0, 20);
  },
}));

import { create } from 'zustand';

export interface UserStore {
  username: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  gems: number;
  clues: number;
  streakDays: number;
  lastStreakDate: string | null;
  favoriteDuck: string;
  casesCompleted: number;
  totalPoints: number;
  perfectCases: number;
  bestTime: number | null;
  hasLeaguePass: boolean;

  // Actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addXp: (amount: number) => void;
  addClues: (amount: number) => void;
  useClue: () => boolean;
  completeCaseReward: (coins: number, xp: number, clues: number, isPerfect: boolean, timeSeconds: number) => void;
  setFavoriteDuck: (duckId: string) => void;
  setLeaguePassOwned: (owned: boolean) => void;
  checkStreak: () => void;
}

const XP_PER_LEVEL = [0, 100, 300, 650, 1150, 1850, 2850, 4350, 6350, 9350, 13350];

export function getLevelMinXp(level: number): number {
  if (level <= 1) return 0;
  if (level - 1 < XP_PER_LEVEL.length) {
    return XP_PER_LEVEL[level - 1];
  }

  const extraLevels = level - XP_PER_LEVEL.length;
  return XP_PER_LEVEL[XP_PER_LEVEL.length - 1] + extraLevels * 3000;
}

function getXpToNextLevel(level: number): number {
  return getLevelMinXp(level + 1) - getLevelMinXp(level);
}

export function getLevelProgress(level: number, xp: number) {
  const levelMinXp = getLevelMinXp(level);
  const xpToNextLevel = getXpToNextLevel(level);
  const xpInLevel = Math.max(0, xp - levelMinXp);

  return {
    xpInLevel,
    xpToNextLevel,
    percent: Math.min((xpInLevel / xpToNextLevel) * 100, 100),
  };
}

export const useUserStore = create<UserStore>((set, get) => ({
  username: 'Detective',
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  coins: 100,
  gems: 0,
  clues: 5,
  streakDays: 0,
  lastStreakDate: null,
  favoriteDuck: 'duck_tophat',
  casesCompleted: 0,
  totalPoints: 0,
  perfectCases: 0,
  bestTime: null,
  hasLeaguePass: false,

  addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),

  spendCoins: (amount) => {
    const { coins } = get();
    if (coins < amount) return false;
    set((s) => ({ coins: s.coins - amount }));
    return true;
  },

  addXp: (amount) => {
    const { xp, level } = get();
    const newXp = xp + amount;
    let newLevel = level;

    while (newXp >= getLevelMinXp(newLevel + 1)) {
      newLevel++;
    }

    set({
      xp: newXp,
      level: newLevel,
      xpToNextLevel: getXpToNextLevel(newLevel),
    });
  },

  addClues: (amount) => set((s) => ({ clues: s.clues + amount })),

  useClue: () => {
    const { clues } = get();
    if (clues <= 0) return false;
    set((s) => ({ clues: s.clues - 1 }));
    return true;
  },

  completeCaseReward: (coins, xp, clues, isPerfect, timeSeconds) => {
    const { bestTime, casesCompleted, perfectCases } = get();
    set({
      coins: get().coins + coins,
      clues: get().clues + clues,
      casesCompleted: casesCompleted + 1,
      perfectCases: isPerfect ? perfectCases + 1 : perfectCases,
      bestTime: bestTime === null || timeSeconds < bestTime ? timeSeconds : bestTime,
    });
    get().addXp(xp);
  },

  setFavoriteDuck: (duckId) => set({ favoriteDuck: duckId }),

  setLeaguePassOwned: (owned) => set({ hasLeaguePass: owned }),

  checkStreak: () => {
    const today = new Date().toDateString();
    const { lastStreakDate, streakDays } = get();

    if (lastStreakDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastStreakDate === yesterday.toDateString()) {
      set({ streakDays: streakDays + 1, lastStreakDate: today });
    } else {
      set({ streakDays: 1, lastStreakDate: today });
    }
  },
}));

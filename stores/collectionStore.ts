import { create } from 'zustand';
import { DEFAULT_DUCKS } from '../constants/ducks';

interface CollectionStore {
  unlockedDucks: string[];
  favoriteDuck: string;

  unlockDuck: (duckId: string, source: string) => void;
  hasDuck: (duckId: string) => boolean;
  setFavorite: (duckId: string) => void;
  getUnlockedCount: () => number;
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  unlockedDucks: [...DEFAULT_DUCKS],
  favoriteDuck: 'duck_tophat',

  unlockDuck: (duckId, _source) => {
    const { unlockedDucks } = get();
    if (!unlockedDucks.includes(duckId)) {
      set({ unlockedDucks: [...unlockedDucks, duckId] });
    }
  },

  hasDuck: (duckId) => get().unlockedDucks.includes(duckId),

  setFavorite: (duckId) => {
    if (get().hasDuck(duckId)) {
      set({ favoriteDuck: duckId });
    }
  },

  getUnlockedCount: () => get().unlockedDucks.length,
}));

import { create } from 'zustand';

import { StorageKeys, storageGet } from '@utils';

interface RatingState {
  hasRatedApp: boolean;
  isLoading: boolean;
  ratingValue: number | null;
  hasSuccessfulDownload: boolean;

  // Actions
  setHasRatedApp: (hasRated: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setRatingValue: (value: number | null) => void;
  setHasSuccessfulDownload: (hasDownload: boolean) => void;
  loadRatingFromStorage: () => void;
  reset: () => void;
}

export const useRatingStore = create<RatingState>((set) => ({
  // Initial state
  hasRatedApp: false,
  isLoading: false,
  ratingValue: null,
  hasSuccessfulDownload: false,

  // Actions
  setHasRatedApp: (hasRated) => set({ hasRatedApp: hasRated }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setRatingValue: (value) => set({ ratingValue: value }),

  setHasSuccessfulDownload: (hasDownload) => set({ hasSuccessfulDownload: hasDownload }),

  loadRatingFromStorage: () => {
    set({ isLoading: true });

    storageGet(StorageKeys.RATING_SCORE, (val) => {
      if (val) {
        const rating = +val;
        set({
          ratingValue: rating,
          hasRatedApp: rating > 0,
          isLoading: false,
        });
      } else {
        set({
          ratingValue: null,
          hasRatedApp: false,
          isLoading: false,
        });
      }
    });
  },

  reset: () =>
    set({
      hasRatedApp: false,
      isLoading: false,
      ratingValue: null,
      hasSuccessfulDownload: false,
    }),
}));

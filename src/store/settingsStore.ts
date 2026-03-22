import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_OPTIONS, StorageKeys } from '@utils/constants';
import { isChromeExtension } from '@utils/utils';

import { fallbackStorage } from './fallbackStorage';
import { SettingsState } from './types';

/**
 * Keys that are persisted to storage (i.e. not actions).
 * `partialize` uses this to select which fields to persist,
 * and `refreshSettings` / `onChanged` reuse it to pick only data fields.
 */
const PERSISTED_KEYS: readonly (keyof SettingsState)[] = [
  'defaultGridView',
  'showDownloadNotifications',
  'folderName',
  'renamePattern',
  'convertFrom',
  'convertTo',
  'createZipArchive',
  'organizeByDomain',
  'openInSidePanel',
  'showOnboardingNextTime',
  'maxOgFetches',
  'maxBgImages',
] as const;

/** Picks only the persisted data fields from an object. */
function pickPersistedFields(source: Record<string, unknown>): Partial<SettingsState> {
  const result: Record<string, unknown> = {};
  for (const key of PERSISTED_KEYS) {
    if (key in source) {
      result[key] = source[key];
    }
  }
  return result as Partial<SettingsState>;
}

// Use persist middleware to store settings in chrome.storage.local or localStorage
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial settings
      defaultGridView: true,
      showDownloadNotifications: true,

      // Initialize all download options from constants
      ...DEFAULT_OPTIONS,

      // Onboarding
      showOnboardingNextTime: false,

      // Settings actions
      setDefaultGridView: (defaultGridView) => set({ defaultGridView }),
      setShowOnboardingNextTime: (showOnboardingNextTime) => set({ showOnboardingNextTime }),
      setShowDownloadNotifications: (showDownloadNotifications) =>
        set({ showDownloadNotifications }),

      // Download options actions
      setFolderName: (folderName) => set({ folderName }),
      setRenamePattern: (renamePattern) => set({ renamePattern }),
      setConvertFrom: (convertFrom) => set({ convertFrom }),
      setConvertTo: (convertTo) => set({ convertTo }),
      setCreateZipArchive: (createZipArchive) => set({ createZipArchive }),
      setOrganizeByDomain: (organizeByDomain) => set({ organizeByDomain }),
      setOpenInSidePanel: (openInSidePanel) => set({ openInSidePanel }),
      setMaxOgFetches: (maxOgFetches) => set({ maxOgFetches }),
      setMaxBgImages: (maxBgImages) => set({ maxBgImages }),
      resetDownloadOptions: () => set(DEFAULT_OPTIONS),

      // Force refresh settings from storage
      refreshSettings: async () => {
        try {
          const stored = await fallbackStorage.getItem(StorageKeys.SETTINGS_STORE_KEY);
          if (stored) {
            const parsedData = JSON.parse(stored);
            const settingsData = parsedData.state || parsedData;
            set(pickPersistedFields(settingsData));
          }
        } catch (error) {
          throw new Error(JSON.stringify(error));
        }
      },
    }),
    {
      name: StorageKeys.SETTINGS_STORE_KEY,
      storage: createJSONStorage(() => fallbackStorage),
      partialize: (state) => pickPersistedFields(state as unknown as Record<string, unknown>),
    },
  ),
);

// Sync settings across extension contexts (e.g. Options page → Page app).
// Compares old/new to avoid a setState→persist→onChanged loop.
if (isChromeExtension() && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const entry = changes[StorageKeys.SETTINGS_STORE_KEY];
    if (!entry?.newValue || JSON.stringify(entry.newValue) === JSON.stringify(entry.oldValue))
      return;

    try {
      const parsed =
        typeof entry.newValue === 'string' ? JSON.parse(entry.newValue) : entry.newValue;
      const data = parsed.state ?? parsed;

      useSettingsStore.setState(pickPersistedFields(data));
    } catch {
      // Ignore malformed storage data
    }
  });
}

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_DOWNLOAD_OPTIONS, StorageKeys } from '@utils/constants';
import { isChromeExtension } from '@utils/utils';

import { fallbackStorage } from './fallbackStorage';
import { SettingsState } from './types';

// Use persist middleware to store settings in chrome.storage.local or localStorage
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial settings
      defaultGridView: true,
      showDownloadNotifications: true,

      // Initialize all download options from constants
      ...DEFAULT_DOWNLOAD_OPTIONS,

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
      resetDownloadOptions: () => set(DEFAULT_DOWNLOAD_OPTIONS),

      // Force refresh settings from storage
      refreshSettings: async () => {
        try {
          const stored = await fallbackStorage.getItem(StorageKeys.SETTINGS_STORE_KEY);
          if (stored) {
            const parsedData = JSON.parse(stored);

            // Zustand persist stores data in format: { state: {...}, version: 0 }
            const settingsData = parsedData.state || parsedData;

            // Update only the settings part, not the actions
            const {
              defaultGridView,
              showDownloadNotifications,
              folderName,
              renamePattern,
              convertFrom,
              convertTo,
              createZipArchive,
              organizeByDomain,
              showOnboardingNextTime,
            } = settingsData;

            set({
              defaultGridView,
              showDownloadNotifications,
              folderName,
              renamePattern,
              convertFrom,
              convertTo,
              createZipArchive,
              organizeByDomain,
              showOnboardingNextTime,
            });
          }
        } catch (error) {
          throw new Error(JSON.stringify(error));
        }
      },
    }),
    {
      name: StorageKeys.SETTINGS_STORE_KEY,
      storage: createJSONStorage(() => fallbackStorage),
      partialize: (state) => ({
        defaultGridView: state.defaultGridView,
        showDownloadNotifications: state.showDownloadNotifications,

        // All download options
        folderName: state.folderName,
        renamePattern: state.renamePattern,
        convertFrom: state.convertFrom,
        convertTo: state.convertTo,
        createZipArchive: state.createZipArchive,
        organizeByDomain: state.organizeByDomain,
        showOnboardingNextTime: state.showOnboardingNextTime,
      }),
    },
  ),
);

// Sync settings across extension contexts (e.g. Options page → Page app).
// Compares old/new to avoid a setState→persist→onChanged loop.
if (isChromeExtension() && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const entry = changes[StorageKeys.SETTINGS_STORE_KEY];
    if (!entry?.newValue || JSON.stringify(entry.newValue) === JSON.stringify(entry.oldValue)) return;

    try {
      const parsed = typeof entry.newValue === 'string'
        ? JSON.parse(entry.newValue)
        : entry.newValue;
      const data = parsed.state ?? parsed;

      useSettingsStore.setState({
        defaultGridView: data.defaultGridView,
        showDownloadNotifications: data.showDownloadNotifications,
        folderName: data.folderName,
        renamePattern: data.renamePattern,
        convertFrom: data.convertFrom,
        convertTo: data.convertTo,
        createZipArchive: data.createZipArchive,
        organizeByDomain: data.organizeByDomain,
        showOnboardingNextTime: data.showOnboardingNextTime,
      });
    } catch {
      // Ignore malformed storage data
    }
  });
}

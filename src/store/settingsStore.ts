import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_DOWNLOAD_OPTIONS } from '@utils/constants';

import { fallbackStorage } from './fallbackStorage';
import { SettingsState } from './types';

// Use persist middleware to store settings in chrome.storage.local or localStorage
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial settings
      defaultGridView: true,
      downloadFolderName: 'images',
      showDownloadNotifications: true,

      // Initial download options
      ...DEFAULT_DOWNLOAD_OPTIONS,

      // Settings actions
      setDefaultGridView: (defaultGridView) => set({ defaultGridView }),
      setDownloadFolderName: (downloadFolderName) => set({ downloadFolderName }),
      setShowDownloadNotifications: (showDownloadNotifications) =>
        set({ showDownloadNotifications }),

      // Download options actions
      setSubfolderName: (subfolderName) => set({ subfolderName }),
      setRenamePattern: (renamePattern) => set({ renamePattern }),
      setConvertFrom: (convertFrom) => set({ convertFrom }),
      setConvertTo: (convertTo) => set({ convertTo }),
      resetDownloadOptions: () => set(DEFAULT_DOWNLOAD_OPTIONS),
    }),
    {
      name: 'image-downloader-settings',
      storage: createJSONStorage(() => fallbackStorage),
      partialize: (state) => ({
        defaultGridView: state.defaultGridView,
        downloadFolderName: state.downloadFolderName,
        showDownloadNotifications: state.showDownloadNotifications,
        subfolderName: state.subfolderName,
        renamePattern: state.renamePattern,
        convertFrom: state.convertFrom,
        convertTo: state.convertTo,
      }),
    },
  ),
);

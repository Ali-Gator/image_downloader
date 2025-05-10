import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { fallbackStorage } from './fallbackStorage';

interface SettingsState {
  // Display settings
  defaultGridView: boolean;
  downloadFolderName: string;
  showDownloadNotifications: boolean;

  // Actions
  setDefaultGridView: (isGridView: boolean) => void;
  setDownloadFolderName: (name: string) => void;
  setShowDownloadNotifications: (show: boolean) => void;
}

// Use persist middleware to store settings in chrome.storage.local or localStorage
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial settings
      defaultGridView: true,
      downloadFolderName: 'images',
      showDownloadNotifications: true,

      // Settings actions
      setDefaultGridView: (defaultGridView) => set({ defaultGridView }),
      setDownloadFolderName: (downloadFolderName) => set({ downloadFolderName }),
      setShowDownloadNotifications: (showDownloadNotifications) =>
        set({ showDownloadNotifications }),
    }),
    {
      name: 'image-downloader-settings',
      storage: createJSONStorage(() => fallbackStorage),
      partialize: (state) => ({
        defaultGridView: state.defaultGridView,
        downloadFolderName: state.downloadFolderName,
        showDownloadNotifications: state.showDownloadNotifications,
      }),
    },
  ),
);

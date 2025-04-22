import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { SettingsState } from '@types';

// Use persist middleware to store settings in localStorage
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
      partialize: (state) => ({
        defaultGridView: state.defaultGridView,
        downloadFolderName: state.downloadFolderName,
        showDownloadNotifications: state.showDownloadNotifications,
      }),
    },
  ),
);

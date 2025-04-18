import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Display settings
  defaultGridView: boolean;
  downloadFolderName: string;
  showDownloadNotifications: boolean;
  usePDFPreview: boolean;

  // User preferences
  language: string;
  theme: 'light' | 'dark' | 'system';

  // Actions
  setDefaultGridView: (isGridView: boolean) => void;
  setDownloadFolderName: (name: string) => void;
  setShowDownloadNotifications: (show: boolean) => void;
  setUsePDFPreview: (use: boolean) => void;
  setLanguage: (lang: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Use persist middleware to store settings in localStorage
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial settings
      defaultGridView: true,
      downloadFolderName: 'ImageDownloader',
      showDownloadNotifications: true,
      usePDFPreview: false,
      language: 'en',
      theme: 'system',

      // Settings actions
      setDefaultGridView: (defaultGridView) => set({ defaultGridView }),
      setDownloadFolderName: (downloadFolderName) => set({ downloadFolderName }),
      setShowDownloadNotifications: (showDownloadNotifications) =>
        set({ showDownloadNotifications }),
      setUsePDFPreview: (usePDFPreview) => set({ usePDFPreview }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'image-downloader-settings',
      partialize: (state) => ({
        defaultGridView: state.defaultGridView,
        downloadFolderName: state.downloadFolderName,
        showDownloadNotifications: state.showDownloadNotifications,
        usePDFPreview: state.usePDFPreview,
        language: state.language,
        theme: state.theme,
      }),
    },
  ),
);

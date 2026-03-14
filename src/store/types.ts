import { CustomSizeFilter, ImageData } from '../types';
import { QualityLevel, SortOption } from '../utils';

/**
 * State for settings store - manages user preferences and download options
 */
export interface SettingsState {
  // Display settings
  defaultGridView: boolean;
  showDownloadNotifications: boolean;

  // Download options
  folderName: string;
  renamePattern: string;
  convertFrom: string;
  convertTo: string;
  createZipArchive: boolean;

  // Onboarding
  showOnboardingNextTime: boolean;

  // Actions
  setDefaultGridView: (isGridView: boolean) => void;
  setShowDownloadNotifications: (show: boolean) => void;
  setShowOnboardingNextTime: (show: boolean) => void;

  // Download options actions
  setFolderName: (name: string) => void;
  setRenamePattern: (pattern: string) => void;
  setConvertFrom: (option: string) => void;
  setConvertTo: (format: string) => void;
  setCreateZipArchive: (createZip: boolean) => void;
  resetDownloadOptions: () => void;
  refreshSettings: () => Promise<void>;
}

/**
 * State for image store - manages image collections, filtering and UI state
 */
export interface ImageState {
  // Image collections
  images: ImageData[];
  filteredImages: ImageData[];
  selectedImages: ImageData[];

  // Source page URL (where images were collected)
  pageUrl: string | null;

  // Tab ID of the page where images were collected (for rescan)
  sourceTabId: number | null;

  // UI state
  isLoading: boolean;
  isGridView: boolean;

  // Filter state
  filterText: string;
  qualityFilters: QualityLevel[];
  customSizeFilter: CustomSizeFilter;
  sortOption: SortOption;

  // Actions
  setImages: (images: ImageData[]) => void;
  setFilteredImages: (images: ImageData[]) => void;
  setSelectedImages: (images: ImageData[]) => void;
  setPageUrl: (pageUrl: string | null) => void;
  setSourceTabId: (tabId: number | null) => void;
  toggleSelectImage: (image: ImageData) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsGridView: (isGridView: boolean) => void;
  setFilterText: (text: string) => void;
  setQualityFilters: (filters: QualityLevel[]) => void;
  toggleQualityFilter: (filter: QualityLevel) => void;
  setCustomSizeFilter: (filter: CustomSizeFilter) => void;
  setSortOption: (option: SortOption) => void;
  applyFilters: () => void;
}

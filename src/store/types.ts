import { CustomSizeFilter, ImageData } from '@types';
import { SizeFilter, SortOption } from '@utils';

/**
 * State for settings store - manages user preferences and download options
 */
export interface SettingsState {
  // Display settings
  defaultGridView: boolean;
  downloadFolderName: string;
  showDownloadNotifications: boolean;

  // Download options
  subfolderName: string;
  renamePattern: string;
  convertFrom: string;
  convertTo: string;

  // Actions
  setDefaultGridView: (isGridView: boolean) => void;
  setDownloadFolderName: (name: string) => void;
  setShowDownloadNotifications: (show: boolean) => void;

  // Download options actions
  setSubfolderName: (name: string) => void;
  setRenamePattern: (pattern: string) => void;
  setConvertFrom: (option: string) => void;
  setConvertTo: (format: string) => void;
  resetDownloadOptions: () => void;
}

/**
 * State for image store - manages image collections, filtering and UI state
 */
export interface ImageState {
  // Image collections
  images: ImageData[];
  filteredImages: ImageData[];
  selectedImages: ImageData[];

  // UI state
  isLoading: boolean;
  isGridView: boolean;

  // Filter state
  filterText: string;
  sizeFilters: SizeFilter[];
  customSizeFilter: CustomSizeFilter;
  sortOption: SortOption;

  // Actions
  setImages: (images: ImageData[]) => void;
  setFilteredImages: (images: ImageData[]) => void;
  setSelectedImages: (images: ImageData[]) => void;
  toggleSelectImage: (image: ImageData) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsGridView: (isGridView: boolean) => void;
  setFilterText: (text: string) => void;
  setSizeFilters: (filters: SizeFilter[]) => void;
  toggleSizeFilter: (filter: SizeFilter) => void;
  setCustomSizeFilter: (filter: CustomSizeFilter) => void;
  setSortOption: (option: SortOption) => void;
  applyFilters: () => void;
}

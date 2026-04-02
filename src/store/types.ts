import { CustomSizeFilter, ImageData } from '../types';
import { CardSize, QualityLevel, SortOption } from '../utils';

/**
 * State for settings store - manages user preferences and download options
 */
export interface SettingsState {
  // Display settings
  defaultGridView: boolean;
  showDownloadNotifications: boolean;
  cardSize: CardSize;

  // Download options
  folderName: string;
  renamePattern: string;
  convertFrom: string;
  convertTo: string;
  createZipArchive: boolean;
  organizeByDomain: boolean;

  // Behavior
  openInSidePanel: boolean;

  // Advanced
  maxOgFetches: number;
  maxBgImages: number;

  // Onboarding
  showOnboardingNextTime: boolean;

  // Actions
  setDefaultGridView: (isGridView: boolean) => void;
  setShowDownloadNotifications: (show: boolean) => void;
  setShowOnboardingNextTime: (show: boolean) => void;
  setCardSize: (size: CardSize) => void;

  // Download options actions
  setFolderName: (name: string) => void;
  setRenamePattern: (pattern: string) => void;
  setConvertFrom: (option: string) => void;
  setConvertTo: (format: string) => void;
  setCreateZipArchive: (createZip: boolean) => void;
  setOrganizeByDomain: (organize: boolean) => void;
  setOpenInSidePanel: (open: boolean) => void;
  setMaxOgFetches: (value: number) => void;
  setMaxBgImages: (value: number) => void;
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
  isEnhancing: boolean;

  // Lightbox state
  lightboxImageId: string | null;

  // Resolution toggle (per-image override for enhanced images)
  imageSourceOverrides: Record<string, 'original' | 'enhanced'>;

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
  setIsEnhancing: (isEnhancing: boolean) => void;
  setLightboxImageId: (id: string | null) => void;
  toggleImageSource: (imageId: string) => void;
  getEffectiveImage: (image: ImageData) => ImageData;
  updateImages: (updated: ImageData[]) => void;
  setFilterText: (text: string) => void;
  setQualityFilters: (filters: QualityLevel[]) => void;
  toggleQualityFilter: (filter: QualityLevel) => void;
  setCustomSizeFilter: (filter: CustomSizeFilter) => void;
  setSortOption: (option: SortOption) => void;
  applyFilters: () => void;
}

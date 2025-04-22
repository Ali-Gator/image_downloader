import React, { ReactNode } from 'react';

import { SizeFilter, SortOption } from '@utils';

/**
 * Notification types for UI display and status notifications
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface ImageData {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: number;
  filename: string;
  fileSize: number;
}

/**
 * Custom size filter type for min width/height
 */
export interface CustomSizeFilter {
  minWidth?: number;
  minHeight?: number;
}

// View modes for image display
export enum ViewMode {
  List = 'list',
  Grid = 'grid',
}

/**
 * Props for the ImageCard component
 */
export interface ImageCardProps {
  image: ImageData;
}

/**
 * Props for the ImageInfo component
 */
export interface ImageInfoProps {
  imageId: string;
}

/**
 * Props for action buttons
 */
export interface ActionButtonProps {
  tooltip: string;
  onClick: () => void;
  'aria-label'?: string;
  children: React.ReactNode;
}

/**
 * Props for checkbox buttons
 */
export interface CheckboxButtonProps {
  checked: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * Props for the ImageThumbnail component
 */
export interface ImageThumbnailProps {
  image: ImageData;
  mode?: 'grid' | 'list';
}

/**
 * Props for the MetadataBadge component
 */
export interface MetadataBadgeProps {
  children: React.ReactNode;
  emphasis?: boolean;
}

/**
 * Props for the ImageUrl component
 */
export interface ImageUrlProps {
  image: ImageData;
}

/**
 * Props for the CopyButton component
 */
export interface CopyButtonProps {
  url: string;
  onCopyClick: () => void;
}

/**
 * Props for the DownloadButton component
 */
export interface DownloadButtonProps {
  url: string;
  onDownloadClick: () => void;
}

/**
 * Props for the ImageActions component
 */
export interface ImageActionsProps {
  image: ImageData;
  orientation?: 'horizontal' | 'vertical';
  showCopy?: boolean;
  showDownload?: boolean;
}

/**
 * Props for styling view buttons
 */
export interface ViewButtonProps {
  active: boolean;
}

/**
 * Props for the Popup Header component
 */
export interface PopupHeaderProps {
  title: string;
}

/**
 * Props for the Popup DownloadButton component
 */
export interface PopupDownloadButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

/**
 * Props for the HelpText component
 */
export interface HelpTextProps {
  text: string;
}

/**
 * ImageObject interface for image downloads
 */
export interface ImageObject {
  src: string;
  alt?: string;
}

/**
 * DownloadOptions interface for configuring downloads
 */
export interface DownloadOptions {
  customName?: string;
  saveAs?: boolean;
  filename?: string;
  foldername?: string;
  url?: string;
}

/**
 * Store interfaces
 */

/**
 * Image store state interface
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

/**
 * Settings store state interface
 */
export interface SettingsState {
  // Display settings
  defaultGridView: boolean;
  downloadFolderName: string;
  showDownloadNotifications: boolean;

  // Actions
  setDefaultGridView: (isGridView: boolean) => void;
  setDownloadFolderName: (name: string) => void;
  setShowDownloadNotifications: (show: boolean) => void;
}

/**
 * Component interfaces
 */

/**
 * ErrorBoundary props interface
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ErrorBoundary state interface
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

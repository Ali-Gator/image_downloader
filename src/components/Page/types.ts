import React from 'react';

import { ImageData } from '@types';
import { SizeFilter, SortOption } from '@utils';

/**
 * Props for the ImageGrid component
 */
export interface ImageGridProps {
  images: ImageData[];
  selectedImages: ImageData[];
  setSelectedImages: (images: ImageData[]) => void;
  isGridView: boolean;
}

/**
 * Props for the ImageCard component
 */
export interface ImageCardProps {
  image: ImageData;
  isSelected: boolean;
  onSelect: (imageId: string) => void;
  viewMode?: ViewMode;
}

/**
 * Props for the ImageInfo component
 */
export interface ImageInfoProps {
  fileName: string;
  width?: number;
  height?: number;
  src: string;
  isListMode: boolean;
}

/**
 * Props for the Toolbar component
 */
export interface ToolbarProps {
  filterText: string;
  setFilterText: (text: string) => void;
  sizeFilter: SizeFilter;
  setSizeFilter: (size: SizeFilter) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  isGridView: boolean;
  setIsGridView: (isGrid: boolean) => void;
  selectedCount: number;
  totalCount: number;
}

/**
 * Props for the Header component
 */
export interface HeaderProps {
  title: string;
  selectedCount: number;
  totalCount: number;
  onSelectAll: (select: boolean) => void;
  onDownload: () => void;
}

export enum ViewMode {
  List = 'list',
  Grid = 'grid',
}

export interface ActionButtonProps {
  tooltip: string;
  onClick: (event: React.MouseEvent) => void;
  'aria-label'?: string;
  children: React.ReactNode;
}

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
 * Props for the ImageMetadata component
 */
export interface ImageMetadataProps {
  image: ImageData;
  isListMode?: boolean;
  compact?: boolean;
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
  onCopyClick: (url: string) => void;
}

/**
 * Props for the DownloadButton component
 */
export interface DownloadButtonProps {
  url: string;
  onDownloadClick: (url: string) => void;
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

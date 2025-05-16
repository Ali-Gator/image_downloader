import React from 'react';

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

// Download options for background script
export interface DownloadOptions {
  filename?: string;
  foldername?: string;
}

// Props for the ErrorBoundary component
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// State for the ErrorBoundary component
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Конфигурация для сайтов с CORS-защитой
export interface CorsSiteConfig {
  patterns: string[];
  referrer: string;
  origin: string;
  userAgent?: string;
}

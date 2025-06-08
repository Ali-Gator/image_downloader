import React from 'react';

// Message action types
export enum MessageActionType {
  REGISTER_FILENAME = 'registerFilename',
  FETCH_IMAGE = 'fetchImage',
  GRAB_IMAGES = 'grabImages',
  FETCH_IMAGE_AS_DATA_URL = 'fetchImageAsDataUrl',
}

/**
 * Interface for the registerFilename message
 * Used for communication between content script and background script
 * to maintain the original filename for downloads
 */
export interface RegisterFilenameMessage {
  action: MessageActionType.REGISTER_FILENAME;
  downloadId: number;
  filename: string;
}

/**
 * Interface for the fetchImage message
 * Used for proxying image data through the background script
 * to bypass CORS restrictions
 */
export interface FetchImageMessage {
  msg: MessageActionType.FETCH_IMAGE;
  url: string;
  referrer?: string;
}

/**
 * Interface for the grabImages message
 * Used to request content script to collect images from the page
 */
export interface GrabImagesMessage {
  action: MessageActionType.GRAB_IMAGES;
}

/**
 * Response from image fetch operations
 */
export interface ImageFetchResponse {
  dataUrl?: string;
  error?: boolean;
}

/**
 * Response from content script image fetch
 */
export interface ContentScriptImageResponse {
  dataUrl?: string;
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
 * Props for the ImageActions component
 */
export interface ImageActionsProps {
  image: ImageData;
  orientation?: 'horizontal' | 'vertical';
  showCopy?: boolean;
  showDownload?: boolean;
}

/**
 * Props for the SafeImage component
 */
export interface SafeImageProps {
  src: string;
  alt?: string;
  className?: string;
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
  fileName: string;
  folderName: string;
  renamePattern: string;
  convertFrom: string;
  convertTo: string;
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

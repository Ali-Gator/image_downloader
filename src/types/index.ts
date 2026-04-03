import React from 'react';

// Message action types
export enum MessageActionType {
  REGISTER_FILENAME = 'registerFilename',
  FETCH_IMAGE = 'fetchImage',
  GRAB_IMAGES = 'grabImages',
  FETCH_IMAGE_AS_DATA_URL = 'fetchImageAsDataUrl',
  CONVERT_IMAGE_ELEMENT = 'convertImageElement',
  RESCAN_IMAGES = 'rescanImages',
  HEALTH_CHECK = 'healthCheck',
  ENHANCE_IMAGES = 'enhanceImages',
  FETCH_PAGE_META = 'fetchPageMeta',
  VALIDATE_IMAGE_URL = 'validateImageUrl',
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
  pageUrl?: string;
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
 * Interface for the fetchImageAsDataUrl message
 * Used to request content script to fetch image data URL
 */
export interface FetchImageAsDataUrlMessage {
  action: MessageActionType.FETCH_IMAGE_AS_DATA_URL;
  url: string;
}

/**
 * Interface for the convertImageElement message
 * Used to request content script to convert image element from DOM
 */
export interface ConvertImageElementMessage {
  action: MessageActionType.CONVERT_IMAGE_ELEMENT;
  imageUrl: string;
  filename: string;
  convertFrom: string;
  convertTo: string;
}

/**
 * Interface for the rescanImages message
 * Used to request content script to rescan the page for new images
 */
export interface RescanImagesMessage {
  action: MessageActionType.RESCAN_IMAGES;
}

/**
 * Interface for the health check message
 * Used to check if content script is available
 */
export interface HealthCheckMessage {
  action: MessageActionType.HEALTH_CHECK;
}

/**
 * Interface for the enhance images message
 * Used to trigger Strategy D (OG meta extraction) for images with linkedPageUrl
 */
export interface EnhanceImagesMessage {
  action: MessageActionType.ENHANCE_IMAGES;
  images: ImageData[];
}

/**
 * Interface for the fetch page meta message
 * Used by background script to fetch HTML and extract OG image meta tags
 */
export interface FetchPageMetaMessage {
  msg: MessageActionType.FETCH_PAGE_META;
  url: string;
  referrer?: string;
}

/**
 * Interface for the validate image URL message
 * Used by background script to HEAD-check a candidate URL
 */
export interface ValidateImageUrlMessage {
  msg: MessageActionType.VALIDATE_IMAGE_URL;
  url: string;
}

/**
 * Response from validate image URL
 */
export interface ValidateImageUrlResponse {
  exists: boolean;
  contentType: string;
  contentLength?: number;
}

/**
 * Union type for all possible messages to content script
 */
export type ContentScriptMessage =
  | GrabImagesMessage
  | RescanImagesMessage
  | FetchImageAsDataUrlMessage
  | ConvertImageElementMessage
  | HealthCheckMessage
  | EnhanceImagesMessage;

/**
 * Result of a download attempt
 */
export interface DownloadResult {
  success: boolean;
  downloadId?: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Result of a bulk download operation
 */
export interface BulkDownloadResult {
  successCount: number;
  failCount: number;
  totalCount: number;
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

/**
 * Response from content script when grabbing images
 */
export interface GrabImagesResponse {
  images?: ImageData[];
  pageUrl?: string;
  error?: string;
  details?: string;
}

/**
 * Payload sent from popup to `page.html` tab.
 */
export interface PageImagesPayload {
  images: ImageData[];
  pageUrl: string;
  sourceTabId: number;
  selectedImages?: ImageData[];
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
  originalSrc?: string;
  originalWidth?: number;
  originalHeight?: number;
  enhanced?: boolean;
  linkedPageUrl?: string;
}

/**
 * Extended image data type for internal processing in content script
 * Contains temporary quality score for sorting before conversion to ImageData
 */
export interface ImageCandidate extends ImageData {
  qualityScore: number;
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

// Download options for background script
export interface DownloadOptions {
  fileName: string;
  folderName: string;
  renamePattern: string;
  convertFrom: string;
  convertTo: string;
  createZipArchive: boolean;
  organizeByDomain: boolean;
  openInSidePanel: boolean;
  maxOgFetches: number;
  maxBgImages: number;
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

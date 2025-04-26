/**
 * Message Actions used for communication between components and content scripts
 */
export enum MessageAction {
  GRAB_IMAGES = 'grabImages',
  SET_DOWNLOAD_OPTIONS = 'setDownloadOptions',
}

/**
 * Standard responses for inter-component communication
 */
export enum MessageResponse {
  OK = 'OK',
}

/**
 * Image size filter options
 */
export enum SizeFilter {
  ALL = 'all',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

/**
 * Image sort options
 */
export enum SortOption {
  DEFAULT = 'default',
  NAME_ASC = 'name-asc',
  NAME_DESC = 'name-desc',
  SIZE_ASC = 'size-asc',
  SIZE_DESC = 'size-desc',
}

/**
 * Common image formats and patterns to filter out in image detection
 */
export const PlaceholderImages = {
  /**
   * Common 1px spacer GIF used as layout placeholders
   */
  SPACER_GIF: 'spacer.gif',
  /**
   * Data URL prefix for GIF images (often used for tiny placeholders)
   */
  DATA_GIF: 'data:image/gif;base64',
  /**
   * Minimum size in pixels for images to be considered valid (not icons)
   */
  MIN_SIZE_PX: 10,
};

/**
 * Download related constants
 */
export const DownloadConstants = {
  /**
   * Maximum number of attempts to find an available folder name
   */
  MAX_FOLDER_ATTEMPTS: 100,

  /**
   * Regex to remove unsafe characters from filenames
   */
  UNSAFE_FILENAME_CHARS_REGEX: /[\\?%*:|"<>]/g,

  /**
   * Time threshold in milliseconds (12 hours) after which downloads are considered outdated
   */
  DOWNLOAD_HISTORY_THRESHOLD: 12 * 60 * 60 * 1000,

  /**
   * URL to open on install
   */
  INSTALL_URL: 'https://blockdev.app/image-downloader/installed',

  /**
   * URL to open on uninstall
   */
  UNINSTALL_URL: 'https://blockdev.app/image-downloader/uninstalled',
};

/**
 * Notification types for snackbars and user feedback
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Notification durations in milliseconds
 */
export const NOTIFICATION_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 4000,
};

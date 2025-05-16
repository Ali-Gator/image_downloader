/**
 * Message Actions used for communication between components and content scripts
 */
export enum MessageAction {
  GRAB_IMAGES = 'grabImages',
  SET_DOWNLOAD_OPTIONS = 'setDownloadOptions',
  FETCH_IMAGE = 'fetchImage',
}

/**
 * Connection names for runtime communication
 */
export enum ConnectionName {
  POPUP = 'popup',
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
};

/**
 * Default values for download options in settings
 */
export const DEFAULT_DOWNLOAD_OPTIONS = {
  folderName: 'images',
  renamePattern: '',
  convertFrom: 'all',
  convertTo: 'jpeg',
};

/**
 * Storage keys for persistent data
 */
export const StorageKeys = {
  /**
   * Key for storing user's rating score
   */
  RATING_SCORE: 'app_rating_score',
};

/**
 * Application links for user feedback and bug reports
 */
export const ApplicationLinks = {
  /**
   * Link to the bug report form
   */
  BUG_REPORT_FORM:
    'https://docs.google.com/forms/d/e/1FAIpQLSfyYcMDHEErXKvqA4xl6ymsC3Ovqdoy8Qzmq27UNYyDtEuXsw/viewform',

  /**
   * Link to the feedback form for ratings below 4 stars
   */
  FEEDBACK_FORM:
    'https://docs.google.com/forms/d/e/1FAIpQLSddP70MjDfrfa4N6B8RHf-InYNWMatUfx3Wwy8EC9HZFMv1xg/viewform',

  /**
   * Link to the Chrome Web Store review page
   */
  GOOD_REVIEW:
    'https://chromewebstore.google.com/detail/image-downloader/hohnpmioogigogdedhigjpjjjonkojbk/reviews',

  /**
   * URL to open on extension install
   */
  INSTALL_URL: 'https://blockdev.app/image-downloader/installed',

  /**
   * URL to open on extension uninstall
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

/**
 * Configuration for sites that need special handling due to CORS restrictions
 * Each site has:
 * - patterns: URL patterns to match
 * - referrer: Which referrer to use when fetching
 * - origin: Which origin to set in requests
 */
export const CORS_SITE_CONFIG: {
  [key: string]: {
    patterns: string[];
    referrer: string;
    origin: string;
    userAgent?: string;
  };
} = {
  instagram: {
    patterns: ['instagram.', '.fbcdn.net', 'cdninstagram', 'fbinstagram'],
    referrer: 'https://www.instagram.com',
    origin: 'https://www.instagram.com',
  },
  pinterest: {
    patterns: ['pinimg.com', 'pinterest.com'],
    referrer: 'https://www.pinterest.com',
    origin: 'https://www.pinterest.com',
  },
  twitter: {
    patterns: ['twimg.com', 'twitter.com', 'x.com'],
    referrer: 'https://twitter.com',
    origin: 'https://twitter.com',
  },
  facebook: {
    patterns: ['facebook.com', 'fbcdn.net'],
    referrer: 'https://www.facebook.com',
    origin: 'https://www.facebook.com',
  },
  reddit: {
    patterns: ['redd.it', 'reddit.com'],
    referrer: 'https://www.reddit.com',
    origin: 'https://www.reddit.com',
  },
  tumblr: {
    patterns: ['tumblr.com'],
    referrer: 'https://www.tumblr.com',
    origin: 'https://www.tumblr.com',
  },
  tiktok: {
    patterns: ['tiktok.com', 'tiktokcdn.com'],
    referrer: 'https://www.tiktok.com',
    origin: 'https://www.tiktok.com',
  },
  // Можно добавить другие сайты по мере необходимости
};

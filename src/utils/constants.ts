import { DownloadOptions } from '@types';

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
 * Image quality filter options
 */
export enum QualityLevel {
  ALL = 'all',
  LOW = 'low',
  MEDIUM = 'medium',
  HD = 'hd',
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
   * Comprehensive regex to remove or replace unsafe characters from filenames
   * Includes:
   * - Standard illegal filename chars (\ / : * ? " < > | )
   * - Angle quotes (« »)
   * - Apostrophes and other punctuation
   * - Control characters
   * - Trademark and copyright symbols
   * - Parentheses and brackets
   * - Special Unicode characters
   * Note: + is excluded as it's commonly used in MIME types (e.g., svg+xml)
   */
  UNSAFE_FILENAME_CHARS_REGEX: /[\\/:*?"<>|«»'`~!@#$%^&=;,{}[\]()™©®°±§]/g,

  /**
   * Time threshold in milliseconds (12 hours) after which downloads are considered outdated
   */
  DOWNLOAD_HISTORY_THRESHOLD: 12 * 60 * 60 * 1000,
};

/**
 * Default values for download options in settings
 */
export const DEFAULT_DOWNLOAD_OPTIONS: DownloadOptions = {
  folderName: 'images',
  fileName: '',
  renamePattern: '',
  convertFrom: 'none',
  convertTo: 'jpeg',
  createZipArchive: false,
};

/**
 * Storage keys for persistent data
 */
export const StorageKeys = {
  /**
   * Key for storing user's individual rating score (1-5 stars)
   */
  RATING_SCORE: 'app_rating_score',
  /**
   * Key for storing download settings (folder name, conversion options, etc.)
   */
  SETTINGS_STORE_KEY: 'image-downloader-settings',
  /**
   * Key for storing rating system state (reminders, shown status, etc.)
   */
  RATING_STORE_KEY: 'image-downloader-rating',
  /**
   * Key for storing simple reminder date flag
   */
  REMINDER_DATE_FLAG: 'image-downloader-reminder-date',
} as const;

/**
 * Rating system configuration
 */
export const RatingConstants = {
  /**
   * Number of days after installation when reminder should be shown
   * Users get one reminder after this period to rate the app
   */
  REMINDER_INTERVAL_DAYS: 10,

  /**
   * Threshold for considering a rating as "positive"
   * Ratings above this value redirect to Chrome Web Store
   * Ratings at or below redirect to feedback form
   */
  POSITIVE_RATING_THRESHOLD: 3,
} as const;

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
 * Timeouts for image fetching operations
 */
export const IMAGE_FETCH_TIMEOUTS = {
  CONTENT_SCRIPT: 2000, // 2 seconds
  CANVAS_TIMEOUT: 5000, // 5 seconds
  BACKGROUND_FETCH: 30000, // 30 seconds
};

/**
 * Content script related constants
 */
export const ContentScriptConstants = {
  /**
   * Context identifiers for Sentry error tracking
   */
  CONTEXT: {
    INJECTION: 'content_script_injection',
    DIAGNOSIS: 'content_script_diagnosis',
    REINJECT_FAILED: 'content_script_reinject_failed',
    MESSAGE_HANDLER: 'content_script_message_handler',
  },

  /**
   * Delay before running content script diagnostics (ms)
   */
  DIAGNOSIS_DELAY: 1000,
};

export const SENTRY_FILTER_ERRORS = [
  'cannot access',
  'extensions gallery',
  'frame with id 0',
  'no tab with id:',
  'the browser is shutting down',
];

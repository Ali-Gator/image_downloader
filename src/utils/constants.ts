/**
 * Message Actions used for communication between components and content scripts
 */
export enum MessageAction {
  GRAB_IMAGES = 'grabImages',
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

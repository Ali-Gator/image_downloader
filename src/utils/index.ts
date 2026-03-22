// Re-export constants
export * from './constants';

// Re-export messaging utilities
export * from './messaging';

// Re-export error handlers
export * from './errorHandlers';

// Re-export translation hook
export * from './useTranslation';

// Re-export Sentry utilities
export * from './sentryCapturer';

// Re-export localStorage utilities
export * from './localStorage';

// Re-export file utilities
export * from './fileUtils';

// Re-export image utilities
export * from './imageUtils';

// Re-export download helpers
export * from './downloadHelpers';

// Re-export download with conversion utilities
export * from './downloadWithConversion';

// Re-export image conversion utilities
export * from './imageConverter';
export * from './imageFormats';

// Re-export DOM image utilities
export * from './domImageUtils';

// Re-export general utilities
export * from './utils';

// Re-export rating utilities
export * from './ratingUtils';

export * from './imageOperations';

// Re-export image preview utilities
export * from './imagePreview';

// Re-export content script utilities
export * from './contentScriptUtils';

// Side panel utilities and autoGrabImages are NOT re-exported from barrel
// to avoid pulling `window`-dependent code into the service worker context.
// Import directly: import { ... } from '@utils/sidePanelUtils'
// Import directly: import { ... } from '@utils/autoGrabImages'

// Re-export Monetize helpers
export * from './monetization';

// Re-export ZIP archive utilities
export * from './zipArchive';

// Note: zip.js is not exported as it doesn't contain exports
// It's a script that runs gulp tasks directly

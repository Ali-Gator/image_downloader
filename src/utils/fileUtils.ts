import { ImageData } from '@types';

import { DownloadConstants } from './constants';
import { handleError } from './errorHandlers';
import { getFileExtension } from './imageUtils';

/**
 * Extracts a filename from a URL
 * @param url - The URL to extract the filename from
 * @returns The extracted filename or a fallback
 */
export const getFileNameFromUrl = (url: string): string => {
  try {
    // For data:URL use generic name
    if (url.startsWith('data:')) {
      return 'image';
    }

    // Try to create a URL object to parse the URL
    const urlObj = new URL(url);

    // Get the pathname
    const pathname = urlObj.pathname;

    // Remove query parameters if present
    const pathWithoutQuery = pathname.split('?')[0];

    // Extract the filename from the path
    const segments = pathWithoutQuery.split('/');
    let lastSegment = segments[segments.length - 1];

    // If the last segment is empty, use the second-to-last (for URLs ending with /)
    if (!lastSegment && segments.length > 1) {
      lastSegment = segments[segments.length - 2];
    }

    // Remove parameters after the filename (if there's an = in the name)
    if (lastSegment.includes('=')) {
      lastSegment = lastSegment.split('=')[0];
    }

    // Return the filename if it exists, or a fallback
    if (lastSegment && lastSegment.length > 0) {
      // Decode URI components to handle encoded characters
      let decodedSegment;
      try {
        decodedSegment = decodeURIComponent(lastSegment);
      } catch (e) {
        // If decoding fails, use as is
        decodedSegment = lastSegment;
      }

      // Remove any problematic characters that could affect filenames
      return decodedSegment.replace(DownloadConstants.UNSAFE_FILENAME_CHARS_REGEX, '_');
    }

    // If no filename found, generate a name based on hostname
    return `image_from_${urlObj.hostname.replace(/\./g, '_')}`;
  } catch (e) {
    // Silent error handling - without notifying the user
    handleError(e);
    // If the URL is invalid, return a generic name
    return 'image';
  }
};

/**
 * Safely processes the alt text to create a valid filename
 * @param alt Alt text to process
 * @returns Safe filename string
 */
const processSafeAltText = (alt: string): string => {
  // Alt text is already verified to be non-empty by the caller
  let processed = alt.trim();

  // Use the centralized regex from constants
  processed = processed
    .replace(DownloadConstants.UNSAFE_FILENAME_CHARS_REGEX, '_') // Replace unsafe chars with underscore
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '_') // Control characters
    .replace(/\uFFFD/g, '_') // Replace broken/invalid Unicode chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with a single one
    .replace(/^_+|_+$/g, ''); // Trim leading/trailing underscores

  // Limit length to be safe for most filesystems
  processed = processed.substring(0, 50);

  // Make sure we have at least one valid character after processing
  if (!processed || processed.length === 0) {
    return 'image';
  }

  // Ensure it doesn't start with a dot (which could make the file hidden)
  if (processed.startsWith('.')) {
    processed = 'img_' + processed;
  }

  return processed;
};

/**
 * Gets a smart file name based on image data
 * This function should only be used at image creation time in content-script.ts
 * After that, the UI components directly access 'image.filename' from the store
 * @param image The image data object
 * @returns A meaningful file name
 */
export const getSmartFileName = (image: ImageData): string => {
  const { src, alt } = image;

  // Get base filename from URL
  const defaultName = getFileNameFromUrl(src);

  // Determine extension based on image source
  const extension = `.${getFileExtension(src).toLowerCase()}`;

  // If alt text contains meaningful information, use it
  if (alt && alt.trim() && !src.includes(alt)) {
    // Process alt text to create a valid filename
    const safeAlt = processSafeAltText(alt);

    if (safeAlt) {
      return `${safeAlt}${extension}`;
    }
  }

  // Check if the filename already contains an extension
  if (defaultName.includes('.')) {
    const dotIndex = defaultName.lastIndexOf('.');
    if (dotIndex > 0) {
      const nameWithoutExt = defaultName.substring(0, dotIndex);
      const currentExt = defaultName.substring(dotIndex).toLowerCase();

      // Check if the current extension is valid
      if (/^\.[a-z0-9]+$/i.test(currentExt)) {
        // If the extension in the name matches the one determined from URL/content-type, use it
        if (currentExt === extension) {
          return defaultName;
        }

        // If they differ, replace with the correct extension
        return nameWithoutExt + extension;
      }

      // If the current extension is invalid, add the correct one
      return defaultName + extension;
    }
  }

  // If no good name found yet, use a timestamp-based name
  if (!defaultName || defaultName === 'image' || defaultName.length < 3) {
    return `image_${Date.now()}${extension}`;
  }

  // If the filename doesn't contain an extension, add it
  return defaultName + extension;
};

/**
 * Formats file size in human-readable format
 * @param bytes Number of bytes
 * @returns Formatted string (e.g. "1.5 KB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

/**
 * Helper functions for downloading images
 */

import { DownloadConstants } from './constants';

/**
 * Sanitizes a path component by replacing unsafe characters with '_'.
 * Handles quotes, tildes, colons, apostrophes, emojis and other special characters
 */
export const sanitizePath = (path: string): string => {
  if (!path) return '';

  // Use the centralized regex from constants
  let sanitized = path.replace(DownloadConstants.UNSAFE_FILENAME_CHARS_REGEX, '_');

  // Replace multiple consecutive underscores with a single one
  sanitized = sanitized.replace(/_+/g, '_');

  // Trim leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');

  // Replace invalid Unicode characters (including broken emoji)
  sanitized = sanitized.replace(/\uFFFD/g, '_');

  // Limit filename length, being careful with emoji (which can be multi-byte)
  if (sanitized.length > 150) {
    const extension = sanitized.includes('.')
      ? sanitized.substring(sanitized.lastIndexOf('.'))
      : '';
    const basename = sanitized.includes('.')
      ? sanitized.substring(0, sanitized.lastIndexOf('.'))
      : sanitized;

    // UTF-8 aware substring to better handle emojis
    try {
      sanitized = basename.substring(0, 145) + extension;
    } catch (e) {
      // Fallback for very problematic characters
      sanitized = `image_${Date.now()}${extension}`;
    }
  }

  return sanitized;
};

/**
 * Applies the rename pattern to a filename
 * @param originalName Original filename
 * @param pattern Rename pattern
 * @returns Renamed filename
 */
export const applyRenamePattern = (originalName: string, pattern: string): string => {
  if (!pattern) return originalName;

  // Get extension to preserve it
  let extension = '';
  let nameWithoutExt = originalName;

  if (originalName.includes('.')) {
    extension = originalName.substring(originalName.lastIndexOf('.'));
    nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
  }

  // Replace name placeholder only
  let result = pattern.replace('{name}', nameWithoutExt);

  // Always preserve the original extension
  if (!result.includes('.')) {
    result += extension;
  }

  return result;
};

/**
 * Extract file extension from a URL
 * @param url URL to extract extension from
 * @returns Extension without dot
 */
export const getExtensionFromUrl = (url: string): string => {
  try {
    // Try to extract extension from url path
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extensionMatch = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);

    if (extensionMatch && extensionMatch[1]) {
      return extensionMatch[1].toLowerCase();
    }

    // Check for format in query params
    if (urlObj.searchParams.has('format')) {
      const format = urlObj.searchParams.get('format');
      if (format && /^[a-z0-9]+$/i.test(format)) {
        return format.toLowerCase();
      }
    }

    return 'jpg';
  } catch (e) {
    // Simple regex fallback
    const simpleMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (simpleMatch && simpleMatch[1]) {
      return simpleMatch[1].toLowerCase();
    }
    return 'jpg';
  }
};

/**
 * Ensures the filename has a valid extension
 * @param filename Original filename
 * @param imageUrl URL of the image for fallback extension
 * @returns Filename with valid extension
 */
export const ensureValidExtension = (filename: string, imageUrl: string): string => {
  if (!filename) return `image_${Date.now()}.${getExtensionFromUrl(imageUrl)}`;

  // Сначала санитизируем имя файла
  const sanitizedName = sanitizePath(filename);

  // If filename doesn't have an extension, add one based on the URL
  if (!sanitizedName.includes('.')) {
    const extension = getExtensionFromUrl(imageUrl);
    return `${sanitizedName}.${extension}`;
  }

  return sanitizedName;
};

/**
 * Get a clean filename from a URL or data URI
 * @param filename Original filename
 * @param imageUrl URL of the image for fallback
 * @returns Clean filename
 */
export const getCleanFilename = (filename: string, imageUrl: string): string => {
  // This function is only used as a fallback when no clean filename is available
  // Most filenames should be handled by getSmartFileName in fileUtils.ts

  // If filename is already valid (not a URL or data URI), just ensure it has an extension
  if (filename && !filename.startsWith('http') && !filename.startsWith('data:')) {
    return ensureValidExtension(filename, imageUrl);
  }

  // If filename is a URL, try to extract a meaningful name from it
  if (filename.startsWith('http')) {
    try {
      const url = new URL(filename);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        // Clean up any query parameters
        const cleanSegment = lastSegment.split('?')[0];
        return ensureValidExtension(cleanSegment, imageUrl);
      }
    } catch (e) {
      /* ignore */
    }
  }

  // Generate a generic timestamp-based filename as last resort
  const extension = getExtensionFromUrl(imageUrl);
  return `image_${Date.now()}.${extension}`;
};

/**
 * Downloads an image with the specified filename
 * @param image Image object with src and filename
 * @returns Promise that resolves when the download completes
 */
export const downloadImage = (image: { src: string; filename: string }): Promise<void> => {
  if (!image.src || !image.filename) {
    return Promise.reject(new Error('Invalid image source or filename'));
  }

  // Use sanitizePath to ensure filename is properly formatted
  const originalFilename = sanitizePath(image.filename);

  return new Promise<void>((resolve, reject) => {
    // Check Chrome availability
    if (typeof chrome === 'undefined' || !chrome.downloads || !chrome.downloads.download) {
      // Fallback for non-Chrome browsers or environments
      try {
        const a = document.createElement('a');
        a.href = image.src;
        a.download = originalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve();
      } catch (error) {
        reject(error);
      }
      return;
    }

    // Let Chrome extension API handle the download
    chrome.downloads.download(
      {
        url: image.src,
        filename: originalFilename,
        conflictAction: 'uniquify' as chrome.downloads.FilenameConflictAction,
        saveAs: false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Download failed: ${chrome.runtime.lastError.message}`));
          return;
        }

        if (!downloadId) {
          reject(new Error('Download failed - no ID returned'));
          return;
        }

        // Register the mapping between download ID and original filename
        try {
          chrome.runtime.sendMessage(
            {
              action: 'registerFilename',
              downloadId,
              filename: originalFilename,
            },
            () => {
              if (chrome.runtime.lastError) {
                // Continue even if registration fails
              }
            },
          );
        } catch (error) {
          // Continue with download even if registration fails
        }

        resolve();
      },
    );
  });
};

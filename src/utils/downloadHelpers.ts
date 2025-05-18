/**
 * Helper functions for downloading images
 */

import { DownloadConstants } from './constants';

/**
 * Sanitizes a path component by replacing unsafe characters with '_'.
 */
export const sanitizePath = (path: string): string => {
  return path ? path.replace(DownloadConstants.UNSAFE_FILENAME_CHARS_REGEX, '_') : '';
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
 * Get a clean filename from a URL or data URI
 * @param filename Original filename
 * @param imageUrl URL of the image for fallback
 * @returns Clean filename
 */
export const getCleanFilename = (filename: string, imageUrl: string): string => {
  // If filename looks like a URL or data URI, extract a better name
  if (filename.startsWith('http') || filename.startsWith('data:')) {
    try {
      if (filename.startsWith('http')) {
        const url = new URL(filename);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          return pathSegments[pathSegments.length - 1];
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Generate filename with timestamp
    const extension = getExtensionFromUrl(imageUrl);
    return `image_${Date.now()}.${extension}`;
  }

  return filename;
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

  // We do minimal processing here - just get a basic filename
  // All actual filename processing (renaming, folder paths) happens in the background script
  const originalFilename = image.filename;

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
    // The background script will handle renaming and folder paths via onDeterminingFilename
    chrome.downloads.download(
      {
        url: image.src,
        filename: originalFilename, // This will be processed by onDeterminingFilename
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

        resolve();
      },
    );
  });
};

/**
 * Helper functions for downloading images
 */

import { MessageActionType } from '../types';
import { DownloadConstants } from './constants';

/**
 * Sanitizes a filename by replacing unsafe characters with underscores and handling special cases
 * @param filename The filename to sanitize
 * @param maxLength Optional maximum length (defaults to 150)
 * @returns Sanitized filename
 */
export const sanitizeFileName = (filename: string, maxLength = 150): string => {
  if (!filename) return '';

  // First, remove invisible and formatting characters
  let sanitized = filename
    // Remove zero-width joiners, zero-width spaces, and other invisible formatting chars
    .replace(/[\u200B-\u200F\u2028-\u202E\u2060-\u2064\u200C-\u200D\uFEFF]/g, '')
    // Remove variation selectors used with emojis (VS15, VS16)
    .replace(/[\uFE00-\uFE0F]/g, '');

  // Use the centralized regex from constants
  sanitized = sanitized.replace(DownloadConstants.UNSAFE_FILENAME_CHARS_REGEX, '_');
  
  // Remove or replace emojis - they can cause issues with some filesystems
  // This uses ranges that cover most emoji code points
  sanitized = sanitized.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1FFFF}]/gu, '_');

  // Replace multiple consecutive underscores with a single one
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Replace multiple consecutive spaces with a single one
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim leading/trailing spaces and underscores
  sanitized = sanitized.trim().replace(/^_+|_+$/g, '');

  // Replace control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

  // Replace invalid Unicode characters (including broken emoji)
  sanitized = sanitized.replace(/\uFFFD/g, '_');
  
  // If after sanitization nothing useful is left, use a timestamp
  if (!sanitized || sanitized.trim() === '' || sanitized === '.') {
    return `image_${Date.now()}`;
  }

  // Limit filename length, being careful with emoji (which can be multi-byte)
  if (sanitized.length > maxLength) {
    const extension = sanitized.includes('.')
      ? sanitized.substring(sanitized.lastIndexOf('.'))
      : '';
    const basename = sanitized.includes('.')
      ? sanitized.substring(0, sanitized.lastIndexOf('.'))
      : sanitized;

    // UTF-8 aware substring to better handle emojis
    try {
      sanitized = basename.substring(0, maxLength - extension.length) + extension;
    } catch (e) {
      // Fallback for very problematic characters
      sanitized = `image_${Date.now()}${extension}`;
    }
  }

  // Make sure it doesn't start with a dot (which could make files hidden)
  if (sanitized.startsWith('.')) {
    sanitized = `img_${sanitized}`;
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

  // Sanitize the filename first
  const sanitizedName = sanitizeFileName(filename);

  // If filename doesn't have an extension, add one based on the URL
  if (!sanitizedName.includes('.')) {
    const extension = getExtensionFromUrl(imageUrl);
    return `${sanitizedName}.${extension}`;
  }

  return sanitizedName;
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

  // Sanitize the filename to ensure it's properly formatted
  const originalFilename = sanitizeFileName(image.filename);

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
              action: MessageActionType.REGISTER_FILENAME,
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

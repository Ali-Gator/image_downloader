/**
 * Helper functions for downloading images
 */

import { DownloadConstants, MessageAction } from './constants';
import { getFileExtension } from './imageUtils';

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

  // Get extension, handle cases where originalName might not have one
  if (originalName.includes('.')) {
    const extension = getFileExtension(originalName);
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));

    // Replace placeholders in pattern
    let result = pattern.replace('{name}', nameWithoutExt).replace('{ext}', extension);

    // Add extension if not included in pattern
    if (!result.includes('.')) {
      result += `.${extension}`;
    }

    return result;
  } else {
    // No extension in original name, just use the whole name
    return pattern.replace('{name}', originalName).replace('{ext}', '');
  }
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
const getCleanFilename = (filename: string, imageUrl: string): string => {
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
 * Downloads an image with the specified filename to the specified folder
 * @param image Image object with src and filename
 * @param options Download options from settings
 * @returns Promise that resolves when the download completes
 */
export const downloadImage = (
  image: { src: string; filename: string },
  options: {
    folderName: string;
    renamePattern: string;
  },
): Promise<void> => {
  if (!image.src || !image.filename) {
    return Promise.reject(new Error('Invalid image source or filename'));
  }

  // Get clean filename
  let finalFilename = getCleanFilename(image.filename, image.src);

  // Apply rename pattern if needed
  if (options.renamePattern) {
    finalFilename = applyRenamePattern(finalFilename, options.renamePattern);
  }

  // Sanitize filename
  finalFilename = sanitizePath(finalFilename);

  // Add extension if missing
  if (!finalFilename.includes('.')) {
    const extension = getExtensionFromUrl(image.src);
    finalFilename += `.${extension}`;
  }

  return new Promise<void>((resolve, reject) => {
    // Check Chrome availability
    if (typeof chrome === 'undefined' || !chrome.downloads || !chrome.downloads.download) {
      // Fallback to standard download
      try {
        const a = document.createElement('a');
        a.href = image.src;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve();
      } catch (error) {
        reject(error);
      }
      return;
    }

    // Notify background script about download options
    const sendOptionsToBackground = () => {
      return new Promise<void>((resolveMsg, rejectMsg) => {
        try {
          chrome.runtime.sendMessage(
            {
              msg: MessageAction.SET_DOWNLOAD_OPTIONS,
              downloadOptions: {
                foldername: options.folderName || '',
                filename: finalFilename,
              },
            },
            (_) => {
              if (chrome.runtime.lastError) {
                rejectMsg(chrome.runtime.lastError);
                return;
              }

              // Brief delay to ensure background has processed the setting
              setTimeout(() => resolveMsg(), 50);
            },
          );
        } catch (error) {
          rejectMsg(error);
        }
      });
    };

    // Start download with Chrome API
    const startDownload = () => {
      chrome.downloads.download(
        {
          url: image.src,
          filename: finalFilename,
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
    };

    // Execute the download process
    sendOptionsToBackground()
      .then(startDownload)
      .catch(() => {
        // Even if message fails, try to download
        startDownload();
      });
  });
};

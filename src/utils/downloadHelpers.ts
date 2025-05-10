/**
 * Helper functions for downloading images
 */

import { DownloadConstants } from './constants';
import { getFileExtension } from './imageUtils';

/**
 * Sanitizes a path component by replacing unsafe characters with '_'.
 * Used for full path segments (not just removing, but replacing).
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

  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));

  // Replace placeholders in pattern
  let result = pattern.replace('{name}', nameWithoutExt).replace('{ext}', extension);

  // Add extension if not included in pattern
  if (!result.includes('.')) {
    result += `.${extension}`;
  }

  return result;
};

/**
 * Builds the full path for a file download based on settings
 * @param filename Original filename
 * @param options Download options from settings
 * @returns Full path including folders and renamed file
 */
export const buildDownloadPath = (
  filename: string,
  options: {
    folderName: string;
    renamePattern: string;
  },
): string => {
  const { folderName, renamePattern } = options;

  // Apply rename pattern if specified
  const finalFilename = renamePattern ? applyRenamePattern(filename, renamePattern) : filename;

  // Sanitize all path components
  const sanitizedFolder = sanitizePath(folderName);
  const sanitizedFilename = sanitizePath(finalFilename);

  // Build the full path
  return `${sanitizedFolder}/${sanitizedFilename}`;
};

/**
 * Tries to convert an image to data URL using canvas
 */
const convertImageViaCanvas = (
  image: { src: string; filename: string },
  fullPath: string,
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const imgElement = new Image();
    imgElement.crossOrigin = 'Anonymous';

    imgElement.onload = () => {
      try {
        // Create a canvas and draw the image on it
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        canvas.getContext('2d')?.drawImage(imgElement, 0, 0);

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg');

        // Download the data URL
        chrome.downloads.download(
          {
            url: dataUrl,
            filename: fullPath,
            saveAs: false,
            conflictAction: 'uniquify',
          },
          (_) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve();
            }
          },
        );
      } catch (canvasError) {
        reject(canvasError);
      }
    };

    imgElement.onerror = () => {
      reject(new Error('Failed to load image for canvas conversion'));
    };

    imgElement.src = image.src;
  });
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

  // Get the full path based on settings
  const fullPath = buildDownloadPath(image.filename, options);

  return new Promise<void>((resolve, reject) => {
    // Use chrome.downloads API for download
    if (chrome.downloads && chrome.downloads.download) {
      const downloadOptions = {
        url: image.src,
        filename: fullPath, // Important: this is a relative path from the downloads folder
        saveAs: false,
        conflictAction: 'uniquify' as chrome.downloads.FilenameConflictAction,
      };

      chrome.downloads.download(downloadOptions, (downloadId) => {
        if (chrome.runtime.lastError) {
          // If the error is related to an invalid URL, try to convert the image through canvas
          if (image.src.startsWith('http')) {
            convertImageViaCanvas(image, fullPath).then(resolve).catch(reject);
          } else {
            reject(new Error(chrome.runtime.lastError.message));
          }
        } else if (!downloadId) {
          reject(new Error('Download failed - no ID returned'));
        } else {
          resolve();
        }
      });
    } else {
      // Fallback for development outside Chrome
      try {
        const a = document.createElement('a');
        a.href = image.src;
        a.download = image.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve();
      } catch (error) {
        reject(error);
      }
    }
  });
};

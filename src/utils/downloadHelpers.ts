/**
 * Helper functions for downloading images
 */

import { DOWNLOAD_CONSTANTS } from './constants';
import { sendDownloadOptions } from './messaging';
import { DownloadOptions, ImageObject } from '../types';

/**
 * Sanitizes a filename or folder name by removing unsafe characters
 */
export const sanitizePathPart = (part: string): string => {
  if (!part) return '';
  return part.replace(DOWNLOAD_CONSTANTS.UNSAFE_FILENAME_CHARS_REGEX, '_').trim();
};

/**
 * Checks folder existence and adds an index if needed
 * @param baseFolder Base folder name
 * @returns Validated folder name
 */
export const getFolderName = (baseFolderName: string): string => {
  if (!baseFolderName) return '';

  const sanitized = sanitizePathPart(baseFolderName);

  // Check if the folder already exists in the store
  const existingFolders = localStorage.getItem('downloadFolders');
  const folders = existingFolders ? JSON.parse(existingFolders) : {};

  // If folder exists, increment number
  let folderName = sanitized;
  let attempt = 1;

  // Prevent infinite loops by limiting attempts
  while (folders[folderName] && attempt <= DOWNLOAD_CONSTANTS.MAX_FOLDER_ATTEMPTS) {
    folderName = `${sanitized} (${attempt})`;
    attempt++;
  }

  // Add folder to the store
  folders[folderName] = Date.now();

  // Clean up old folders (older than threshold)
  const threshold = Date.now() - DOWNLOAD_CONSTANTS.DOWNLOAD_HISTORY_THRESHOLD;
  Object.keys(folders).forEach((key) => {
    if (folders[key] < threshold) {
      delete folders[key];
    }
  });

  // Save updated folders
  localStorage.setItem('downloadFolders', JSON.stringify(folders));

  return folderName;
};

/**
 * Tries to convert an image to data URL using canvas
 */
const convertImageViaCanvas = async (
  imageUrl: string,
  fileName?: string,
  folderName?: string,
): Promise<boolean> => {
  try {
    return new Promise<boolean>((resolve, reject) => {
      const imgElement = new Image();
      imgElement.crossOrigin = 'Anonymous';

      imgElement.onload = () => {
        try {
          // Create canvas and draw the image
          const canvas = document.createElement('canvas');
          canvas.width = imgElement.naturalWidth;
          canvas.height = imgElement.naturalHeight;
          canvas.getContext('2d')?.drawImage(imgElement, 0, 0);

          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/jpeg');

          // Create a safe filename if not provided
          const safeFileName = fileName || `image_${Date.now()}.jpg`;
          const fullPath = folderName ? `${folderName}/${safeFileName}` : safeFileName;

          // Download data URL
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
                resolve(true);
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

      imgElement.src = imageUrl;
    });
  } catch (error) {
    console.error('Canvas conversion failed:', error);
    return false;
  }
};

/**
 * Generates a filename based on image information
 */
export const generateFileName = (image: ImageObject): string => {
  // Extract filename from URL if possible
  const urlFilename = image.src.split('/').pop()?.split('?')[0] || '';
  // Prioritize the actual filename from URL rather than alt text
  return urlFilename || image.alt || `image_${Date.now()}.jpg`;
};

/**
 * Downloads an image. If direct download fails, falls back to canvas conversion
 */
export const downloadImage = async (
  image: ImageObject,
  folderName?: string,
  options?: DownloadOptions,
): Promise<boolean> => {
  try {
    const fileName = options?.customName || generateFileName(image);
    const fullPath = folderName ? `${folderName}/${fileName}` : fileName;

    console.log("Download helper - URL:", image.src);
    console.log("Download helper - Path:", fullPath);
    
    // First, send options to background script for path management
    await sendDownloadOptions({
      url: image.src,
      filename: fullPath,
      saveAs: options?.saveAs || false,
    });
    
    // Then perform the download directly
    if (chrome.downloads && chrome.downloads.download) {
      return new Promise<boolean>((resolve) => {
        chrome.downloads.download(
          {
            url: image.src,
            filename: fullPath,
            saveAs: options?.saveAs || false,
            conflictAction: 'uniquify',
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error("Direct download failed:", chrome.runtime.lastError);
              console.error("For URL:", image.src);
              // Fall back to canvas conversion
              convertImageViaCanvas(image.src, fileName, folderName)
                .then(success => resolve(success))
                .catch((error) => {
                  console.error("Canvas conversion also failed:", error);
                  console.error("For URL:", image.src);
                  resolve(false);
                });
            } else if (!downloadId) {
              console.error("Download failed with no ID returned");
              console.error("For URL:", image.src);
              // Try canvas conversion as last resort
              convertImageViaCanvas(image.src, fileName, folderName)
                .then(success => resolve(success))
                .catch(() => resolve(false));
            } else {
              console.log("Download started with ID:", downloadId);
              resolve(true);
            }
          }
        );
      });
    }
    
    return true;
  } catch (error) {
    console.error('Direct download failed:', error);
    console.error("For URL:", image.src);
    
    // Try canvas conversion as fallback
    try {
      const generatedFileName = options?.customName || generateFileName(image);
      return await convertImageViaCanvas(image.src, generatedFileName, folderName);
    } catch (canvasError) {
      console.error('Canvas fallback failed:', canvasError);
      console.error("For URL:", image.src);
      return false;
    }
  }
};

/**
 * Helper function to download an image and return success status
 * @param image Image object to download
 * @param folderName Optional folder name for download
 * @returns Promise<boolean> that resolves to true if download was successful, false otherwise
 */
export const downloadImageHelper = async (image: ImageObject, folderName?: string): Promise<boolean> => {
  try {
    await downloadImage(image, folderName);
    return true;
  } catch (error) {
    console.error(`Failed to download image ${image.src}:`, error);
    return false;
  }
};

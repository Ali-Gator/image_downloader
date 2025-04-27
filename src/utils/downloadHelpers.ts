/**
 * Helper functions for downloading images
 */

import { DownloadConstants } from './constants';

/**
 * Sanitizes a path component by replacing unsafe characters with '_'.
 * Used for full path segments (not just removing, but replacing).
 */
export const sanitizePath = (path: string): string => {
  return path ? path.replace(DownloadConstants.UNSAFE_FILENAME_CHARS_REGEX, '_') : '';
};

/**
 * Checks if downloads in a folder are recent (not older than the threshold)
 * @param downloads List of downloads
 * @returns true if there are recent downloads, false if all downloads are outdated or none exist
 */
// const hasRecentDownloads = (downloads: chrome.downloads.DownloadItem[]): boolean => {
//   if (downloads.length === 0) return false;
//
//   const now = Date.now();
//   // Check if there are recent downloads
//   return downloads.some((download) => {
//     // If no startTime, consider the download recent (safeguard)
//     if (!download.startTime) return true;
//
//     const startTimeMs = new Date(download.startTime).getTime();
//     return now - startTimeMs < DownloadConstants.DOWNLOAD_HISTORY_THRESHOLD;
//   });
// };

/**
 * Checks if a folder exists and adds an index if necessary
 * @param baseFolder Base folder name
 * @returns Verified folder name
 */
export const getFolderName = async (baseFolder: string): Promise<string> => {
  // if (!chrome.downloads || !chrome.downloads.search) {
  return baseFolder; // If API is unavailable, just return the original name
  // }
  //
  // // Try to create a folder with an index (1 = no index, 2+ = with index)
  // for (let i = 0; i <= DownloadConstants.MAX_FOLDER_ATTEMPTS; i++) {
  //   const folderName = i === 0 ? baseFolder : `${baseFolder} (${i})`;
  //
  //   try {
  //     // Check if the folder exists by path with a trailing "/"
  //     const searchPath = folderName + '/';
  //
  //     const downloads = await new Promise<chrome.downloads.DownloadItem[]>((resolve) => {
  //       chrome.downloads.search({ query: [searchPath] }, resolve);
  //     });
  //
  //     // If the folder has no files or no recent downloads, use it
  //     if (!hasRecentDownloads(downloads)) {
  //       return folderName;
  //     }
  //   } catch (e) {
  //     return folderName; // In case of an error, just return the current name
  //   }
  // }
  //
  // // If all attempts are exhausted, return the last name with an index
  // return `${baseFolder} (${DownloadConstants.MAX_FOLDER_ATTEMPTS})`;
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
 * @param folderName Folder name for download
 * @returns Promise that resolves when the download completes
 */
export const downloadImage = (
  image: { src: string; filename: string },
  folderName: string,
): Promise<void> => {
  if (!image.src || !image.filename) {
    return Promise.reject(new Error('Invalid image source or filename'));
  }

  // Sanitize the folder and filename
  const sanitizedFolder = sanitizePath(folderName);
  const sanitizedFilename = sanitizePath(image.filename);

  // Build the full path
  const fullPath = sanitizedFolder ? `${sanitizedFolder}/${sanitizedFilename}` : sanitizedFilename;

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
        a.download = sanitizedFilename;
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

/**
 * Helper functions for downloading images
 */

import { DownloadConstants, MessageAction } from './constants';
import { getFileExtension } from './imageUtils';

/**
 * Sanitizes a path component by replacing unsafe characters with '_'.
 * Used for full path segments (not just removing, but replacing).
 */
export const sanitizePath = (path: string): string => {
  console.log(`[SANITIZE] Sanitizing path: "${path}"`);
  const result = path ? path.replace(DownloadConstants.UNSAFE_FILENAME_CHARS_REGEX, '_') : '';
  console.log(`[SANITIZE] Result: "${result}"`);
  return result;
};

/**
 * Applies the rename pattern to a filename
 * @param originalName Original filename
 * @param pattern Rename pattern
 * @returns Renamed filename
 */
export const applyRenamePattern = (originalName: string, pattern: string): string => {
  console.log(`[PATTERN] Applying pattern "${pattern}" to "${originalName}"`);
  if (!pattern) return originalName;

  // Get extension, handle cases where originalName might not have one
  let extension = '';
  if (originalName.includes('.')) {
    extension = getFileExtension(originalName);
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    // Replace placeholders in pattern
    let result = pattern.replace('{name}', nameWithoutExt).replace('{ext}', extension);
    
    // Add extension if not included in pattern
    if (!result.includes('.')) {
      result += `.${extension}`;
    }
    
    console.log(`[PATTERN] Result: "${result}"`);
    return result;
  } else {
    // No extension in original name, just use the whole name
    let result = pattern.replace('{name}', originalName).replace('{ext}', '');
    console.log(`[PATTERN] Result (no extension): "${result}"`);
    return result;
  }
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
  console.log(`[PATH BUILD] Started with filename: "${filename}"`);
  console.log(`[PATH BUILD] Options:`, JSON.stringify(options));
  
  const { folderName, renamePattern } = options;

  // Apply rename pattern if specified
  const finalFilename = renamePattern ? applyRenamePattern(filename, renamePattern) : filename;
  console.log(`[PATH BUILD] After rename pattern: "${finalFilename}"`);

  // Sanitize all path components
  const sanitizedFilename = sanitizePath(finalFilename);
  console.log(`[PATH BUILD] Sanitized filename: "${sanitizedFilename}"`);
  
  // If folder name is empty, just return the filename
  if (!folderName) {
    console.log(`[PATH BUILD] No folder name, returning just filename: "${sanitizedFilename}"`);
    return sanitizedFilename;
  }
  
  // Otherwise, build the full path with folder
  const sanitizedFolder = sanitizePath(folderName);
  console.log(`[PATH BUILD] Sanitized folder name: "${sanitizedFolder}"`);
  const fullPath = `${sanitizedFolder}/${sanitizedFilename}`;
  console.log(`[PATH BUILD] Final path with folder: "${fullPath}"`);
  return fullPath;
};

/**
 * Downloads an image using a data URL created via canvas
 * This method is used as a fallback when direct downloading fails
 */
const downloadWithCanvas = (
  image: { src: string; filename: string },
  downloadPath: string
): Promise<void> => {
  console.log(`[CANVAS] Starting canvas download for "${image.filename}" to path "${downloadPath}"`);
  return new Promise<void>((resolve, reject) => {
    const imgElement = new Image();
    imgElement.crossOrigin = 'Anonymous';

    imgElement.onload = () => {
      try {
        console.log(`[CANVAS] Image loaded successfully, dimensions: ${imgElement.naturalWidth}x${imgElement.naturalHeight}`);
        // Create a canvas and draw the image on it
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        canvas.getContext('2d')?.drawImage(imgElement, 0, 0);

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/jpeg');
        console.log(`[CANVAS] Converted to data URL (length: ${dataUrl.length})`);

        // Download the data URL
        console.log(`[CANVAS] Initiating download with path: "${downloadPath}"`);
        chrome.downloads.download(
          {
            url: dataUrl,
            filename: downloadPath,
            saveAs: false,
            conflictAction: 'uniquify',
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              const errorMsg = chrome.runtime.lastError.message;
              console.error(`[CANVAS] Download error: ${errorMsg}`);
              reject(new Error(errorMsg));
            } else if (!downloadId) {
              console.error(`[CANVAS] No download ID returned`);
              reject(new Error('Canvas download failed - no ID returned'));
            } else {
              console.log(`[CANVAS] Download successful, ID: ${downloadId}`);
              resolve();
            }
          },
        );
      } catch (canvasError) {
        console.error(`[CANVAS] Error in canvas process:`, canvasError);
        reject(canvasError);
      }
    };

    imgElement.onerror = () => {
      console.error(`[CANVAS] Failed to load image: ${image.src}`);
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
  console.log(`[DOWNLOAD] Starting download for:`, image.filename);
  console.log(`[DOWNLOAD] Options:`, JSON.stringify(options));
  
  if (!image.src || !image.filename) {
    console.error('[DOWNLOAD] Invalid image source or filename');
    return Promise.reject(new Error('Invalid image source or filename'));
  }

  // Make sure the image has a reasonable filename
  let originalFilename = image.filename;
  
  // If filename looks like a URL or data URI, extract a better name
  if (originalFilename.startsWith('http') || originalFilename.startsWith('data:')) {
    console.log(`[DOWNLOAD] Extracting better filename from URL-like name: "${originalFilename}"`);
    // Try to extract name from URL path
    try {
      if (originalFilename.startsWith('http')) {
        const url = new URL(originalFilename);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          originalFilename = pathSegments[pathSegments.length - 1];
          console.log(`[DOWNLOAD] Extracted filename from URL: "${originalFilename}"`);
        }
      }
    } catch (e) {
      console.error('[DOWNLOAD] Failed to parse URL for filename extraction:', e);
    }
    
    // If we still have a problematic filename, generate one with timestamp
    if (originalFilename.startsWith('http') || originalFilename.startsWith('data:') || originalFilename.length > 100) {
      const extension = getExtensionFromUrl(image.src);
      originalFilename = `image_${Date.now()}.${extension}`;
      console.log(`[DOWNLOAD] Generated reasonable filename: "${originalFilename}"`);
    }
  }

  // Process filename (apply rename pattern if needed)
  let finalFilename = options.renamePattern 
    ? applyRenamePattern(originalFilename, options.renamePattern) 
    : originalFilename;
    
  // Sanitize filename
  finalFilename = sanitizePath(finalFilename);
  console.log(`[DOWNLOAD] Final filename (sanitized): "${finalFilename}"`);
  
  // First check if finalFilename already has extension
  if (!finalFilename.includes('.')) {
    // Try to extract extension from the src URL
    const extension = getExtensionFromUrl(image.src);
    finalFilename += `.${extension}`;
    console.log(`[DOWNLOAD] Added extension from URL: "${finalFilename}"`);
  }
  
  return new Promise<void>((resolve, reject) => {
    // Check Chrome availability
    if (typeof chrome === 'undefined' || !chrome.downloads || !chrome.downloads.download) {
      console.log('[DOWNLOAD] Chrome API not available, using fallback');
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

    // Send folder information to background script first
    if (options.folderName) {
      console.log(`[DOWNLOAD] Sending folder info to background: "${options.folderName}" with filename: "${finalFilename}"`);
      try {
        chrome.runtime.sendMessage({
          msg: MessageAction.SET_DOWNLOAD_OPTIONS,
          downloadOptions: {
            foldername: options.folderName,
            filename: finalFilename
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[DOWNLOAD] Error sending folder to background:', chrome.runtime.lastError);
            // Continue with download even if message fails
            startDownload();
            return;
          }
          
          if (response && response.success) {
            console.log('[DOWNLOAD] Background script successfully updated settings:', JSON.stringify(response));
          } else {
            console.warn('[DOWNLOAD] Background script response was unsuccessful:', JSON.stringify(response));
          }
          
          // Wait a brief moment to ensure background has processed the setting
          setTimeout(() => {
            startDownload();
          }, 100);
        });
      } catch (error) {
        console.error('[DOWNLOAD] Error sending message to background:', error);
        startDownload();
      }
    } else {
      // No folder to set, but we still need to notify background of the filename
      try {
        chrome.runtime.sendMessage({
          msg: MessageAction.SET_DOWNLOAD_OPTIONS,
          downloadOptions: {
            filename: finalFilename
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[DOWNLOAD] Error sending filename to background:', chrome.runtime.lastError);
            startDownload();
            return;
          }
          
          console.log('[DOWNLOAD] Background script notified of filename:', JSON.stringify(response));
          setTimeout(() => {
            startDownload();
          }, 50);
        });
      } catch (error) {
        console.error('[DOWNLOAD] Error sending message to background:', error);
        startDownload();
      }
    }
    
    // Function to start the actual download
    function startDownload() {
      // Create download options - we don't need to include the folder here
      // The background script will add it via onDeterminingFilename
      const downloadOptions = {
        url: image.src,
        filename: finalFilename,  // Just the filename, folder will be added by background
        conflictAction: 'uniquify' as chrome.downloads.FilenameConflictAction,
        saveAs: false
      };
      
      console.log('[DOWNLOAD] Calling chrome.downloads.download with options:', 
        JSON.stringify({...downloadOptions, url: '(url truncated)'}));
  
      // Start download
      chrome.downloads.download(downloadOptions, (downloadId) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          console.error(`[DOWNLOAD] Chrome download error: ${error}`);
          reject(new Error(`Download failed: ${error}`));
          return;
        }
        
        if (!downloadId) {
          console.error('[DOWNLOAD] No download ID returned');
          reject(new Error('Download failed - no ID returned'));
          return;
        }
        
        // Log success
        console.log(`[DOWNLOAD] Download started with ID: ${downloadId}`);
        
        // Log final download path
        chrome.downloads.search({id: downloadId}, (results) => {
          if (results && results.length > 0) {
            console.log(`[DOWNLOAD] Chrome saved file as: "${results[0].filename}"`);
          }
        });
        
        resolve();
      });
    }
  });
};

/**
 * Test download to diagnose Chrome download API behavior
 * @param options Download options to test
 */
export const testDirectDownload = (options: {
  folderName: string;
  renamePattern: string;
}): Promise<void> => {
  console.log(`[TEST] Direct download test with options:`, JSON.stringify(options));
  
  return new Promise<void>((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.downloads || !chrome.downloads.download) {
      console.error('[TEST] Chrome download API not available');
      reject(new Error('Chrome download API not available'));
      return;
    }
    
    const testFileName = `test-image-${Date.now()}.jpg`;
    const downloadPath = options.folderName ? `${options.folderName}/${testFileName}` : testFileName;
    
    console.log(`[TEST] Using download path: "${downloadPath}"`);
    
    const downloadOptions = {
      url: 'https://via.placeholder.com/150',
      filename: downloadPath,
      conflictAction: 'uniquify' as chrome.downloads.FilenameConflictAction
    };
    
    console.log(`[TEST] Download options:`, JSON.stringify(downloadOptions));
    
    chrome.downloads.download(downloadOptions, (downloadId) => {
      console.log(`[TEST] Download started with ID: ${downloadId}`);
      
      if (chrome.runtime.lastError) {
        console.error(`[TEST] Error: ${chrome.runtime.lastError.message}`);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (!downloadId) {
        console.error(`[TEST] No download ID returned`);
        reject(new Error('No download ID returned'));
        return;
      }
      
      setTimeout(() => {
        chrome.downloads.search({id: downloadId}, (results) => {
          if (results && results.length > 0) {
            console.log(`[TEST] Download details:`, JSON.stringify({
              id: results[0].id,
              filename: results[0].filename,
              state: results[0].state,
              exists: results[0].exists
            }));
            resolve();
          } else {
            console.log(`[TEST] Download not found in search results`);
            resolve();
          }
        });
      }, 1000);
    });
  });
};

// Add a more robust function to get file extension
export const getExtensionFromUrl = (url: string): string => {
  try {
    // Try to extract extension from url path
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extensionMatch = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    
    // Return extension if found
    if (extensionMatch && extensionMatch[1]) {
      return extensionMatch[1].toLowerCase();
    }
    
    // Check for common content types in search params
    if (urlObj.searchParams.has('format')) {
      const format = urlObj.searchParams.get('format');
      if (format && /^[a-z0-9]+$/i.test(format)) {
        return format.toLowerCase();
      }
    }
    
    // Default to jpg if no extension found
    return 'jpg';
  } catch (e) {
    // If URL parsing fails, try a simple regex
    const simpleMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (simpleMatch && simpleMatch[1]) {
      return simpleMatch[1].toLowerCase();
    }
    return 'jpg';
  }
};

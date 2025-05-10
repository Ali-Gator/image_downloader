// don't change paths to aliases
import { DownloadOptions } from '../types';
import { ApplicationLinks, MessageAction } from '../utils/constants';
import { handleError } from '../utils/errorHandlers';
import { sanitizePath } from '../utils/downloadHelpers';

// Global variable for storing download options
let downloadOptions: DownloadOptions = {};

// Store last used folder for when options aren't explicitly set
let lastUsedFolder = '';

// Track download filename mappings (Chrome ID -> original filename)
const downloadFilenames: Record<number, string> = {};

// Queue of pending filenames (used when we get a filename before download is created)
const pendingFilenames: string[] = [];

// Debug: Check if Chrome downloads API is available
console.log('[BACKGROUND] Chrome download API available:', typeof chrome !== 'undefined' && !!chrome.downloads);

// Debug: Check for active listeners
if (typeof chrome !== 'undefined' && chrome.downloads) {
  chrome.downloads.onDeterminingFilename.hasListeners()
    ? console.log('[BACKGROUND] onDeterminingFilename has active listeners')
    : console.log('[BACKGROUND] onDeterminingFilename has NO active listeners');
     
  // Add an active listener that will enforce folder paths
  chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    console.log('[BACKGROUND] onDeterminingFilename fired:', JSON.stringify({
      filename: item.filename,
      byExtensionId: item.byExtensionId,
      originalUrl: item.url ? item.url.substring(0, 50) + '...' : 'N/A',
      id: item.id
    }));
    
    // If this is from our extension, apply folder setting
    if (item.byExtensionId === chrome.runtime.id) {
      console.log('[BACKGROUND] This download is from our extension');
      
      // Get folder from options or use last known folder
      const folderName = (downloadOptions && downloadOptions.foldername) || lastUsedFolder;
      console.log(`[BACKGROUND] Current folder setting: "${folderName}"`);
      
      // Check if we should override filename
      let finalFilename = item.filename;
      
      // Check if filename is default pattern like "download.ext", "unnamed.ext"
      const isDefaultFilename = item.filename.match(/^(download|unnamed)\.[a-z0-9]+$/i);
      
      // Try to find a better filename from:
      // 1. The download ID mapping
      // 2. The downloadOptions.filename (current pending filename)
      // 3. The queue of pending filenames
      if (isDefaultFilename) {
        console.log(`[BACKGROUND] Detected default filename pattern: ${item.filename}`);
        
        // Check if we have an original filename stored for this download ID
        if (item.id && downloadFilenames[item.id]) {
          console.log(`[BACKGROUND] Found filename for ID ${item.id}: "${downloadFilenames[item.id]}"`);
          finalFilename = downloadFilenames[item.id];
        }
        // Check if we have a pending filename
        else if (downloadOptions.filename) {
          console.log(`[BACKGROUND] Using current pending filename: "${downloadOptions.filename}"`);
          finalFilename = downloadOptions.filename;
          downloadOptions.filename = undefined; // clear it after use
        }
        // Check if we have queued filenames
        else if (pendingFilenames.length > 0) {
          finalFilename = pendingFilenames.shift() || finalFilename;
          console.log(`[BACKGROUND] Used queued filename: "${finalFilename}"`);
        }
      }
      
      // Apply folder to filename if needed
      if (folderName) {
        // Apply the folder to the filename
        const sanitizedFolder = sanitizePath(folderName);
        const newFilename = `${sanitizedFolder}/${finalFilename}`;
        console.log(`[BACKGROUND] Setting filename to: "${newFilename}"`);
        
        // Actively suggest the new filename with folder
        suggest({ filename: newFilename });
      } else {
        // No folder specified, just use the filename
        console.log(`[BACKGROUND] No folder specified, using filename: "${finalFilename}"`);
        suggest({ filename: finalFilename });
      }
    } else {
      // Not from our extension, don't modify
      suggest();
    }
    
    return false; // Handle synchronously
  });
  
  // Track created downloads to capture the original filename
  chrome.downloads.onCreated.addListener((downloadItem) => {
    console.log('[BACKGROUND] Download created:', JSON.stringify({
      id: downloadItem.id,
      filename: downloadItem.filename,
      byExtensionId: downloadItem.byExtensionId
    }));
    
    // If we have a filename property in downloadOptions, use it for this download
    if (downloadItem.byExtensionId === chrome.runtime.id) {
      if (downloadOptions.filename) {
        console.log(`[BACKGROUND] Storing current pending filename for ID ${downloadItem.id}: "${downloadOptions.filename}"`);
        downloadFilenames[downloadItem.id] = downloadOptions.filename;
        downloadOptions.filename = undefined; // Clear after using
      } else {
        console.log(`[BACKGROUND] No pending filename available for download ID ${downloadItem.id}`);
      }
    }
  });
}

/**
 * Listener for setting download options via message
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[BACKGROUND] Message received:', JSON.stringify(request));
  try {
    if (request.msg === MessageAction.SET_DOWNLOAD_OPTIONS) {
      downloadOptions = request.downloadOptions || {};
      
      // Store folder name for future use
      if (downloadOptions.foldername) {
        lastUsedFolder = downloadOptions.foldername;
        console.log(`[BACKGROUND] Updated download folder to: "${lastUsedFolder}"`);
      }
      
      // Store filename in queue for future downloads
      if (downloadOptions.filename) {
        // Add to queue in case download starts before we can use it
        pendingFilenames.push(downloadOptions.filename);
        console.log(`[BACKGROUND] Added filename to queue: "${downloadOptions.filename}"`);
        console.log(`[BACKGROUND] Queue now has ${pendingFilenames.length} pending filenames`);
      }
      
      console.log('[BACKGROUND] Download options updated:', JSON.stringify(downloadOptions));
      console.log(`[BACKGROUND] Last used folder: "${lastUsedFolder}"`);
      sendResponse({ success: true });
      return true; // Keep channel open for async response
    }
    // Default response for unhandled messages
    sendResponse({ success: false, error: 'Unknown message type' });
  } catch (error) {
    handleError(error);
    sendResponse({ success: false, error: String(error) });
  }
  return true; // Keep channel open for async response
});

// Wrap event handlers with try-catch to capture errors with Sentry
try {
  // Handle extension installation
  chrome.runtime.onInstalled.addListener((details) => {
    try {
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
          url: ApplicationLinks.INSTALL_URL,
        });
      } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        // When extension is updated
      } else if (details.reason === chrome.runtime.OnInstalledReason.CHROME_UPDATE) {
        // When browser is updated
      } else if (details.reason === chrome.runtime.OnInstalledReason.SHARED_MODULE_UPDATE) {
        // When a shared module is updated
      }
    } catch (error) {
      handleError(error);
    }
  });

  chrome.runtime.setUninstallURL(ApplicationLinks.UNINSTALL_URL);
} catch (error) {
  handleError(error);
}

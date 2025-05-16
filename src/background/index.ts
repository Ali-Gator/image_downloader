// don't change paths to aliases
import { DownloadOptions } from '../types';
import { ApplicationLinks, MessageAction } from '../utils/constants';
import { sanitizePath } from '../utils/downloadHelpers';
import { handleError } from '../utils/errorHandlers';

// Global state for download options
let downloadOptions: DownloadOptions = {};
let lastUsedFolder = '';
const pendingFilenames: string[] = [];
const downloadFilenames: Record<number, string> = {};

// Initialize downloads API listeners
if (typeof chrome !== 'undefined' && chrome.downloads) {
  // Handle filename determination
  chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    // If this is from our extension, apply folder and filename settings
    if (item.byExtensionId === chrome.runtime.id) {
      // Get folder from options or use last known folder
      const folderName = (downloadOptions && downloadOptions.foldername) || lastUsedFolder;

      // Handle default filenames like "download.ext" or "unnamed.ext"
      let finalFilename = item.filename;
      const isDefaultFilename = item.filename.match(/^(download|unnamed)\.[a-z0-9]+$/i);

      if (isDefaultFilename) {
        // Try to find a better filename from our stored options
        if (item.id && downloadFilenames[item.id]) {
          finalFilename = downloadFilenames[item.id];
        } else if (downloadOptions.filename) {
          finalFilename = downloadOptions.filename;
          downloadOptions.filename = undefined;
        } else if (pendingFilenames.length > 0) {
          finalFilename = pendingFilenames.shift() || finalFilename;
        }
      }

      // Apply folder to filename if needed
      if (folderName) {
        const sanitizedFolder = sanitizePath(folderName);
        const newFilename = `${sanitizedFolder}/${finalFilename}`;
        suggest({ filename: newFilename });
      } else {
        suggest({ filename: finalFilename });
      }
    } else {
      // Not from our extension, don't modify
      suggest();
    }

    return false; // Handle synchronously
  });

  // Track download creation
  chrome.downloads.onCreated.addListener((downloadItem) => {
    if (downloadItem.byExtensionId === chrome.runtime.id) {
      if (downloadOptions.filename) {
        downloadFilenames[downloadItem.id] = downloadOptions.filename;
        downloadOptions.filename = undefined;
      }
    }
  });
}

/**
 * Listener for setting download options via message
 */
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  try {
    if (request.msg === MessageAction.SET_DOWNLOAD_OPTIONS) {
      downloadOptions = request.downloadOptions || {};

      // Store folder name for future use
      if (downloadOptions.foldername) {
        lastUsedFolder = downloadOptions.foldername;
      }

      // Store filename in queue for future downloads
      if (downloadOptions.filename) {
        pendingFilenames.push(downloadOptions.filename);
      }

      sendResponse({ success: true });
      return true;
    }

    sendResponse({ success: false, error: 'Unknown message type' });
  } catch (error) {
    handleError(error);
    sendResponse({ success: false, error: String(error) });
  }
  return true;
});

// Extension installation handler
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

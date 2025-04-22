import { DownloadOptions } from '../types';
import { DOWNLOAD_CONSTANTS, MessageAction } from '../utils/constants';
import { handleError } from '../utils/errorHandlers';

// Constants
const INSTALL_URL = 'https://blockdev.app/image-downloader/installed';
const UNINSTALL_URL = 'https://blockdev.app/image-downloader/uninstalled';

// Global variable to store download options
let downloadOptions: DownloadOptions = {};

/**
 * Sanitizes a path component by removing unsafe characters
 */
const sanitizePath = (path: string): string => {
  return path ? path.replace(DOWNLOAD_CONSTANTS.UNSAFE_FILENAME_CHARS_REGEX, '_') : '';
};

/**
 * Message handler for setting download options
 */
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  try {
    if (request.msg === MessageAction.SET_DOWNLOAD_OPTIONS) {
      downloadOptions = request.downloadOptions || {};
      console.log("Background received download options:", downloadOptions);
      sendResponse({ success: true });
      return true;
    }
  } catch (error) {
    handleError(error);
    sendResponse({ success: false, error: String(error) });
  }
  return false;
});

/**
 * Handler for determining filename and folder during download
 */
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  try {
    // Check if download was initiated by our extension
    if (item.byExtensionId === chrome.runtime.id) {
      console.log("Processing download:", item.filename);
      console.log("Current download options:", downloadOptions);
      
      // Get filename and extension
      let filename = item.filename;
      const fileExtension = filename.split('.').pop() || '';
      
      // If custom filename is specified, use it
      if (downloadOptions.filename) {
        filename = sanitizePath(downloadOptions.filename);
        // Add extension back
        if (fileExtension && !filename.endsWith(`.${fileExtension}`)) {
          filename = `${filename}.${fileExtension}`;
        }
        console.log("Using custom filename:", filename);
      }
      
      // If folder is specified, add it to the path
      if (downloadOptions.foldername) {
        const sanitizedFolder = sanitizePath(downloadOptions.foldername);
        filename = `${sanitizedFolder}/${filename}`;
        console.log("Using folder path:", filename);
      }
      
      // Suggest new filename
      console.log("Final download path:", filename);
      suggest({ filename: filename });
    } else {
      // If download is not from our extension, don't change the path
      suggest();
    }
  } catch (error) {
    handleError(error);
    suggest(); // In case of error, use default behavior
  }
});

// Wrap event handlers with try-catch to capture errors with Sentry
try {
  // Handle extension installation
  chrome.runtime.onInstalled.addListener((details) => {
    try {
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
          url: INSTALL_URL,
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

  chrome.runtime.setUninstallURL(UNINSTALL_URL);
} catch (error) {
  handleError(error);
}

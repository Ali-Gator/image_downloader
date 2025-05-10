// don't change paths to aliases
import { DownloadOptions } from '../types';
import { ApplicationLinks, MessageAction } from '../utils/constants';
import { sanitizePath } from '../utils/downloadHelpers';
import { handleError } from '../utils/errorHandlers';
// Global variable for storing download options
let downloadOptions: DownloadOptions = {};

/**
 * Listener for setting download options via message
 */
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  try {
    if (request.msg === MessageAction.SET_DOWNLOAD_OPTIONS) {
      downloadOptions = request.downloadOptions || {};
      //TODO: should properly process response
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
 * Listener for determining filename and folder during download
 */
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  try {
    // Check if the download was initiated by our extension
    if (item.byExtensionId === chrome.runtime.id) {
      // Use provided filename if present, otherwise fallback to Chrome's default
      let filename = downloadOptions.filename
        ? sanitizePath(downloadOptions.filename)
        : item.filename;

      // If folder is specified, prepend it
      if (downloadOptions.foldername) {
        const sanitizedFolder = sanitizePath(downloadOptions.foldername);
        filename = `${sanitizedFolder}/${filename}`;
      }

      // Suggest the new filename
      suggest({ filename: filename });
    } else {
      // If the download is not from our extension, do not change the path
      suggest();
    }
  } catch (error) {
    handleError(error);
    suggest(); // Use default behavior in case of error
  }
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

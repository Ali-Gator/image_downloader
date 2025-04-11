import { handleError } from '../utils/errorHandlers';

// Wrap event handlers with try-catch to capture errors with Sentry
try {
  // Handle extension installation
  chrome.runtime.onInstalled.addListener((details) => {
    try {
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
          url: 'https://blockdev.app/image-downloader/installed',
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

  chrome.runtime.setUninstallURL('https://blockdev.app/image-downloader/uninstalled');
} catch (error) {
  handleError(error);
}

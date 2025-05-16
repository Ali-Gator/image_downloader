// don't change paths to aliases
import { CorsSiteConfig, DownloadOptions } from '../types';
import {
  ApplicationLinks,
  ConnectionName,
  CORS_SITE_CONFIG,
  MessageAction,
} from '../utils/constants';
import { sanitizePath } from '../utils/downloadHelpers';
import { handleError } from '../utils/errorHandlers';

// Global variable for storing download options
let downloadOptions: DownloadOptions = {};
let activeTabOrigin = '';
let lastUsedFolder = '';
const pendingFilenames: string[] = [];
const downloadFilenames: Record<number, string> = {};

// Clean up any existing rules when extension loads
removeReferrerRules().catch(handleError);

/**
 * Identifies which site config should be used for the given URL
 * @param url The URL to check against site patterns
 * @returns The site key and config, or null if no match
 */
function identifySiteConfig(url: string): { key: string; config: CorsSiteConfig } | null {
  if (!url) return null;

  for (const [key, config] of Object.entries(CORS_SITE_CONFIG)) {
    for (const pattern of config.patterns) {
      if (url.includes(pattern)) {
        return { key, config };
      }
    }
  }

  return null;
}

/**
 * Adds referrer rules for cross-origin image requests
 * This helps bypass CORS restrictions for certain image hosts
 */
async function addReferrerRules(origin?: string) {
  try {
    // First remove existing rules
    await removeReferrerRules();

    // If origin is provided, add a rule to set referrer header
    if (origin) {
      activeTabOrigin = origin;

      await chrome.declarativeNetRequest.updateSessionRules({
        addRules: [
          {
            id: 987654321,
            priority: 1,
            action: {
              type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              requestHeaders: [
                {
                  header: 'Referer',
                  operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                  value: origin,
                },
                {
                  header: 'Origin',
                  operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                  value: origin,
                },
              ],
            },
            condition: {
              urlFilter: '*',
              resourceTypes: [
                chrome.declarativeNetRequest.ResourceType.IMAGE,
                chrome.declarativeNetRequest.ResourceType.MEDIA,
              ],
            },
          },
        ],
      });
    }
  } catch (error) {
    handleError(error);
  }
}

/**
 * Removes any existing referrer rules
 */
async function removeReferrerRules() {
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [987654321],
    });
  } catch (error) {
    handleError(error);
  }
}

/**
 * Fetches an image using the fetch API as a fallback method
 */
async function fetchImageWithFetch(
  url: string,
  siteConfig?: CorsSiteConfig,
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'user-agent': navigator.userAgent,
    };

    // Add site-specific headers if available
    if (siteConfig) {
      headers['Referer'] = siteConfig.referrer;
      headers['Origin'] = siteConfig.origin;
      if (siteConfig.userAgent) {
        headers['user-agent'] = siteConfig.userAgent;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'omit',
      mode: 'no-cors',
    });

    // Note: With mode: 'no-cors', the response type will be 'opaque' and body may not be readable directly
    // We can try to convert it anyway
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
}


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

    // Handle image fetch request - proxy image data through background script to bypass CORS
    if (request.msg === MessageAction.FETCH_IMAGE) {
      // Identify the site for appropriate headers
      const siteInfo = identifySiteConfig(request.url);

      // Set the referrer to the original site for this request
      let appliedRules = false;
      if (siteInfo) {
        addReferrerRules(siteInfo.config.referrer);
        appliedRules = true;
      }

      // Use XMLHttpRequest which handles some CORS cases better than fetch
      const xhr = new XMLHttpRequest();
      xhr.open('GET', request.url, true);
      xhr.responseType = 'blob';
      xhr.timeout = 30000; // 30 second timeout

      // Set basic headers
      xhr.setRequestHeader('Accept', 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8');
      xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
      xhr.setRequestHeader('sec-fetch-dest', 'image');
      xhr.setRequestHeader('sec-fetch-mode', 'no-cors');
      xhr.setRequestHeader('sec-fetch-site', 'cross-site');

      // Set site-specific headers if available
      if (siteInfo) {
        xhr.setRequestHeader('Referer', siteInfo.config.referrer);
        xhr.setRequestHeader('Origin', siteInfo.config.origin);
        if (siteInfo.config.userAgent) {
          xhr.setRequestHeader('user-agent', siteInfo.config.userAgent);
        } else {
          xhr.setRequestHeader('user-agent', navigator.userAgent);
        }
      } else {
        // Default headers using active tab origin
        xhr.setRequestHeader('Referer', activeTabOrigin || request.referrer || '');
        xhr.setRequestHeader('Origin', activeTabOrigin || request.referrer || '');
        xhr.setRequestHeader('user-agent', navigator.userAgent);
      }

      // Clean up function to remove rules after request is done
      const cleanupRules = () => {
        if (appliedRules) {
          removeReferrerRules().catch(handleError);
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          const reader = new FileReader();
          reader.onloadend = function () {
            sendResponse({ dataUrl: reader.result });
            cleanupRules();
          };
          reader.readAsDataURL(xhr.response);
        } else {
          // Try fallback method
          fetchImageWithFetch(request.url, siteInfo?.config).then((dataUrl) => {
            if (dataUrl) {
              sendResponse({ dataUrl });
            } else {
              sendResponse({ error: true });
            }
            cleanupRules();
          });
        }
      };

      xhr.onerror = function () {
        // Try fallback method
        fetchImageWithFetch(request.url, siteInfo?.config).then((dataUrl) => {
          if (dataUrl) {
            sendResponse({ dataUrl });
          } else {
            sendResponse({ error: true });
          }
          cleanupRules();
        });
      };

      xhr.ontimeout = function () {
        sendResponse({ error: true });
        cleanupRules();
      };

      xhr.send();
      return true; // Required for async response
    }
    sendResponse({ success: false, error: 'Unknown message type' });
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

// Initialize tab origin tracking
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.url) {
    const url = new URL(tabs[0].url);
    activeTabOrigin = url.origin;

    // Remove automatic rule application on tab initialization
    // We'll only apply rules when the extension is actively used
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

      // Clean up any existing rules on install/update
      removeReferrerRules().catch(handleError);
    } catch (error) {
      handleError(error);
    }
  });

  // Clean up CORS rules when popup is closed to avoid interference with normal browsing
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === ConnectionName.POPUP) {
      port.onDisconnect.addListener(() => {
        // Remove CORS rules when popup is closed
        removeReferrerRules().catch(handleError);
      });
    }
  });

  // Clean up rules when tab changes
  chrome.tabs.onActivated.addListener(() => {
    // When user switches tabs, remove any active rules
    removeReferrerRules().catch(handleError);
  });

  chrome.runtime.setUninstallURL(ApplicationLinks.UNINSTALL_URL);
} catch (error) {
  handleError(error);
}

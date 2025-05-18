// don't change paths to aliases

import {
  CorsSiteConfig,
  DownloadOptions,
  FetchImageMessage,
  MessageActionType,
  RegisterFilenameMessage,
} from '../types';
import {
  ApplicationLinks,
  ConnectionName,
  CORS_SITE_CONFIG,
  DEFAULT_DOWNLOAD_OPTIONS,
  StorageKeys,
} from '../utils/constants';
import {
  applyRenamePattern,
  ensureValidExtension,
  sanitizeFileName,
} from '../utils/downloadHelpers';
import { handleError } from '../utils/errorHandlers';

// Global variable for storing download options
let activeTabOrigin = '';

// Словарь для хранения соответствий между ID загрузки и именами файлов
// Это позволит сохранить исходное имя при переименовании
const downloadFilenamesMap: Record<number, string> = {};

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

export async function getSettings(): Promise<DownloadOptions> {
  return new Promise((resolve) => {
    const storageKey = StorageKeys.SETTINGS_STORE_KEY;
    chrome.storage.local.get([storageKey], (result) => {
      try {
        if (result[storageKey]) {
          const parsedData = JSON.parse(result[storageKey]);
          // Zustand с persist middleware хранит данные в поле state
          if (parsedData && parsedData.state) {
            return resolve(parsedData.state);
          }
        }
        // Если данных нет или ошибка, возвращаем пустые настройки
        resolve(DEFAULT_DOWNLOAD_OPTIONS);
      } catch (error) {
        handleError(error);
        resolve(DEFAULT_DOWNLOAD_OPTIONS);
      }
    });
  });
}

// Слушаем сообщения для получения имени файла
chrome.runtime.onMessage.addListener((message: RegisterFilenameMessage, _, sendResponse) => {
  if (
    message.action === MessageActionType.REGISTER_FILENAME &&
    message.downloadId &&
    message.filename
  ) {
    // Store the filename in our map for later use
    downloadFilenamesMap[message.downloadId] = message.filename;

    // Send success response back to content script
    sendResponse({ success: true });
    return true;
  }
  return false;
});

// Initialize downloads API listeners
if (typeof chrome !== 'undefined' && chrome.downloads) {
  // Handle filename determination
  chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    if (item.byExtensionId !== chrome.runtime.id) {
      suggest();
      return false;
    }

    // Use a promise to ensure suggest is only called once
    const processSuggestion = async () => {
      try {
        const downloadOptions = await getSettings();

        const folderName = downloadOptions?.folderName;
        const renamePattern = downloadOptions?.renamePattern;

        // Check if we have a saved filename for this download ID
        let finalFilename = item.filename;
        if (item.id && downloadFilenamesMap[item.id]) {
          finalFilename = downloadFilenamesMap[item.id];

          // Clean up the mapping to prevent memory leaks
          setTimeout(() => {
            delete downloadFilenamesMap[item.id];
          }, 5000);
        }

        // Make sure it has a valid extension
        if (typeof ensureValidExtension !== 'function') {
          // Fallback
          if (!finalFilename.includes('.')) {
            finalFilename = `${finalFilename}.jpg`;
          }
        } else {
          finalFilename = ensureValidExtension(finalFilename, item.url);
        }

        // Apply rename pattern if specified
        if (renamePattern) {
          if (typeof applyRenamePattern === 'function') {
            finalFilename = applyRenamePattern(finalFilename, renamePattern);
            // Note: We need to sanitize after applying rename pattern as it could introduce invalid characters
            finalFilename = sanitizeFileName(finalFilename);
          }
        }

        // Apply folder to filename if needed
        if (folderName) {
          const sanitizedFolder = sanitizeFileName(folderName);
          return `${sanitizedFolder}/${finalFilename}`;
        } else {
          return finalFilename;
        }
      } catch (error) {
        handleError(error);
        return item.filename;
      }
    };

    // Process the suggestion and call suggest exactly once with the result
    processSuggestion()
      .then((filename) => {
        suggest({ filename });
      })
      .catch((error) => {
        handleError(error);
        suggest({ filename: item.filename });
      });

    return true; // Indicate we'll call suggest asynchronously
  });
}

/**
 * Listener for setting download options via message
 */
chrome.runtime.onMessage.addListener((request: FetchImageMessage, _, sendResponse) => {
  try {
    // Handle image fetch request - proxy image data through background script to bypass CORS
    if (request.msg === MessageActionType.FETCH_IMAGE) {
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

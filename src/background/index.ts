// don't change paths to aliases

import {
  DownloadOptions,
  FetchImageMessage,
  MessageActionType,
  RegisterFilenameMessage,
} from '../types';
import {
  ApplicationLinks,
  ConnectionName,
  DEFAULT_DOWNLOAD_OPTIONS,
  IMAGE_FETCH_TIMEOUTS,
  StorageKeys,
} from '../utils/constants';
import {
  applyRenamePattern,
  ensureValidExtension,
  sanitizeFileName,
} from '../utils/downloadHelpers';
import { ensureError, handleError } from '../utils/errorHandlers';
import { blobToDataUrl } from '../utils/imageUtils';

// Global variable for storing download options
let activeTabOrigin = '';
let currentOriginWithRules = '';

// Mutex to prevent race conditions when updating referrer rules
let isUpdatingRules = false;
let pendingRuleUpdate: Promise<void> | null = null;

// Unique ID for our referrer rule - using a more unique value to avoid conflicts
const REFERRER_RULE_ID = 842751963;

// Словарь для хранения соответствий между ID загрузки и именами файлов
// Это позволит сохранить исходное имя при переименовании
const downloadFilenamesMap: Record<number, string> = {};

/**
 * Injects content script into all existing tabs when extension is installed/updated
 */
async function injectContentScriptIntoAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;

      // Skip special pages
      const url = tab.url.toLowerCase();
      const unsupportedProtocols = [
        'chrome:',
        'chrome-extension:',
        'moz-extension:',
        'edge:',
        'file:',
        'about:',
        'data:',
      ];

      if (unsupportedProtocols.some((protocol) => url.startsWith(protocol))) {
        continue;
      }

      // Skip extension stores
      if (
        url.includes('chrome.google.com/webstore') ||
        url.includes('microsoftedge.microsoft.com/addons') ||
        url.includes('addons.mozilla.org')
      ) {
        continue;
      }

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js'],
        });
      } catch (error) {
        // Some tabs might not allow script injection, that's okay - silently ignore
      }
    }
  } catch (error) {
    handleError(error);
  }
}

// Clean up any existing rules when extension loads
// Enhanced cleanup with additional logging
(async () => {
  try {
    await removeReferrerRules();
  } catch (error) {
    const enhancedError = ensureError(error);
    Object.assign(enhancedError, {
      context: 'startup_cleanup',
      timestamp: new Date().toISOString(),
    });
    handleError(enhancedError);
  }
})();

/**
 * Adds referrer rules for cross-origin image requests
 * This helps bypass CORS restrictions for certain image hosts
 */
async function addReferrerRules(origin?: string) {
  // If another update is in progress, wait for it to complete
  if (isUpdatingRules && pendingRuleUpdate) {
    await pendingRuleUpdate;
  }

  // Skip if we already have rules for this origin after waiting
  if (origin && origin === currentOriginWithRules) {
    return;
  }

  // If still updating after wait, skip to avoid infinite loop
  if (isUpdatingRules) {
    return;
  }

  isUpdatingRules = true;

  // Create promise for other callers to wait on
  pendingRuleUpdate = (async () => {
    try {
      // First, aggressively clean up any existing rules to prevent conflicts
      try {
        // Try to remove all existing rules first
        const allExistingRules = await chrome.declarativeNetRequest.getSessionRules();
        if (allExistingRules.length > 0) {
          await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: allExistingRules.map((rule) => rule.id),
          });
          // Small delay to ensure rules are fully removed
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } catch (cleanupError) {
        // Failed to cleanup, continue with normal flow
      }

      // Now add the new rule if needed
      if (origin) {
        await chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: [REFERRER_RULE_ID], // Safety remove in case cleanup failed
          addRules: [
            {
              id: REFERRER_RULE_ID,
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
                  {
                    header: 'Sec-Fetch-Site',
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    value: 'same-origin',
                  },
                  {
                    header: 'Sec-Fetch-Mode',
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    value: 'cors',
                  },
                ],
              },
              condition: {
                urlFilter: '*',
                resourceTypes: [
                  chrome.declarativeNetRequest.ResourceType.IMAGE,
                  chrome.declarativeNetRequest.ResourceType.MEDIA,
                  chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
                  chrome.declarativeNetRequest.ResourceType.OTHER,
                  chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                  chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
                ],
              },
            },
          ],
        });
      } else {
        // Just remove existing rules if no origin provided
        await chrome.declarativeNetRequest.updateSessionRules({
          removeRuleIds: [REFERRER_RULE_ID],
          addRules: [],
        });
      }

      if (origin) {
        activeTabOrigin = origin;
        currentOriginWithRules = origin;
      }
    } catch (error) {
      // Create enhanced error with diagnostic info
      const enhancedError = ensureError(error);

      // Add diagnostic information to the error for Sentry
      Object.assign(enhancedError, {
        context: 'addReferrerRules',
        diagnosticInfo: {
          origin,
          currentOriginWithRules,
          activeTabOrigin,
          isUpdatingRules,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          chromeVersion: /Chrome\/([0-9.]+)/.exec(navigator.userAgent)?.[1] || 'unknown',
          errorMessage: enhancedError.message,
          errorStack: enhancedError.stack,
        },
      });

      // If this is the specific "unique ID" error, add even more context
      if (
        enhancedError.message.includes('unique ID') ||
        enhancedError.message.includes(String(REFERRER_RULE_ID)) ||
        enhancedError.message.includes('duplicate')
      ) {
        try {
          const currentRules = await chrome.declarativeNetRequest.getSessionRules();
          Object.assign(enhancedError, {
            ruleConflictInfo: {
              currentRulesCount: currentRules.length,
              conflictingRules: currentRules.filter((rule) => rule.id === REFERRER_RULE_ID),
              allRuleIds: currentRules.map((rule) => rule.id),
              allRules: currentRules, // Full rule objects for detailed analysis
            },
          });

          // Try to force cleanup the problematic rule
          try {
            await chrome.declarativeNetRequest.updateSessionRules({
              removeRuleIds: [REFERRER_RULE_ID],
              addRules: [],
            });
            // Successfully cleaned up conflicting rule
          } catch (forceCleanupError) {
            Object.assign(enhancedError, {
              forceCleanupError: String(forceCleanupError),
            });
          }
        } catch (getRulesError) {
          Object.assign(enhancedError, {
            getRulesError: String(getRulesError),
          });
        }
      }

      handleError(enhancedError);
    } finally {
      isUpdatingRules = false;
      pendingRuleUpdate = null;
    }
  })();

  await pendingRuleUpdate;
}

/**
 * Removes any existing referrer rules
 */
async function removeReferrerRules() {
  try {
    // Remove all session rules to avoid conflicts
    const existingRules = await chrome.declarativeNetRequest.getSessionRules();
    const idsToRemove = existingRules.map((rule) => rule.id);

    if (idsToRemove.length > 0) {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: idsToRemove,
      });
    }

    // Reset the current origin with rules
    currentOriginWithRules = '';
  } catch (error) {
    // Enhanced error reporting for rule removal failures
    const enhancedError = ensureError(error);
    Object.assign(enhancedError, {
      context: 'removeReferrerRules',
      diagnosticInfo: {
        currentOriginWithRules,
        activeTabOrigin,
        timestamp: new Date().toISOString(),
        errorMessage: enhancedError.message,
      },
    });

    // Only log significant errors, not permission denials
    if (
      !enhancedError.message.includes('permissions') &&
      !enhancedError.message.includes('denied')
    ) {
      handleError(enhancedError);
    }
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
  // Handle image fetch request - proxy image data through background script to bypass CORS
  if (request.msg === MessageActionType.FETCH_IMAGE) {
    // Use async IIFE to handle async operations
    (async () => {
      try {
        // Get current active tab to use as referrer (but exclude extension URLs)
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        let tabOrigin = '';
        if (activeTab?.url && !activeTab.url.startsWith('chrome-extension://')) {
          try {
            tabOrigin = new URL(activeTab.url).origin;
          } catch (e) {
            // Invalid URL, ignore
          }
        }

        // If no valid tab origin, try to extract from the image URL
        if (!tabOrigin) {
          try {
            const imageUrl = new URL(request.url);
            tabOrigin = imageUrl.origin;
          } catch (e) {
            // Invalid URL, ignore
          }
        }

        // Set the referrer rules using the detected tab origin
        let appliedRules = false;
        const referrerOrigin = tabOrigin;

        if (referrerOrigin) {
          await addReferrerRules(referrerOrigin);
          appliedRules = currentOriginWithRules === referrerOrigin;
          // Wait a bit for rules to be applied (only if they were actually added)
          if (appliedRules) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        // Use fetch API which is available in service workers
        const headers = new Headers({
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'sec-fetch-dest': 'image',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'sec-ch-ua': '"Google Chrome";v="121", "Not A(Brand";v="99", "Chromium";v="121"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-ch-ua-platform-version': '"14.0.0"',
          'upgrade-insecure-requests': '1',
          dnt: '1',
          connection: 'keep-alive',
        });

        // Set headers using detected tab origin with fallbacks
        const referrerHeader = tabOrigin || activeTabOrigin || request.referrer || '';
        const originHeader = tabOrigin || activeTabOrigin || request.referrer || '';

        if (referrerHeader) {
          headers.set('Referer', referrerHeader);
        }
        if (originHeader) {
          headers.set('Origin', originHeader);
        }

        // Set user agent
        headers.set('user-agent', navigator.userAgent);

        // Clean up function to remove rules after request is done
        const cleanupRules = () => {
          if (appliedRules) {
            removeReferrerRules().catch(handleError);
          }
        };

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          IMAGE_FETCH_TIMEOUTS.BACKGROUND_FETCH,
        );

        try {
          // First try with CORS mode
          const response = await fetch(request.url, {
            method: 'GET',
            headers,
            signal: controller.signal,
            credentials: 'omit',
            mode: 'cors',
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const blob = await response.blob();
            const dataUrl = await blobToDataUrl(blob);
            sendResponse({ dataUrl });
            cleanupRules();
            return;
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          // If CORS failed, try no-cors mode
          try {
            const noCorsController = new AbortController();
            const noCorsTimeoutId = setTimeout(
              () => noCorsController.abort(),
              IMAGE_FETCH_TIMEOUTS.BACKGROUND_FETCH,
            );

            const noCorsResponse = await fetch(request.url, {
              method: 'GET',
              headers,
              signal: noCorsController.signal,
              credentials: 'omit',
              mode: 'no-cors',
            });

            clearTimeout(noCorsTimeoutId);

            // With no-cors, we can't check status, but if we got here it likely worked
            const blob = await noCorsResponse.blob();
            if (blob && blob.size > 0) {
              const dataUrl = await blobToDataUrl(blob);
              sendResponse({ dataUrl });
              cleanupRules();
              return;
            }
          } catch (noCorsError) {
            // Silent failure for no-cors
          }

          clearTimeout(timeoutId);

          // If both CORS and no-cors failed, return error
          sendResponse({ error: true });
          cleanupRules();
        }
      } catch (error) {
        handleError(error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    return true; // Required for async response
  }

  sendResponse({ success: false, error: 'Unknown message type' });
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
        injectContentScriptIntoAllTabs();
      } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        // When extension is updated
        injectContentScriptIntoAllTabs();
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

  // Handle extension startup (browser restart)
  chrome.runtime.onStartup.addListener(() => {
    try {
      injectContentScriptIntoAllTabs();
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

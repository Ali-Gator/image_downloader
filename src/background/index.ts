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
  ContentScriptConstants,
  DEFAULT_DOWNLOAD_OPTIONS,
  IMAGE_FETCH_TIMEOUTS,
  RatingConstants,
  StorageKeys,
} from '../utils/constants';
import {
  applyRenamePattern,
  ensureValidExtension,
  extractDomain,
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

// Per-download metadata: original filename and source page URL (for domain subfolders)
interface DownloadMeta {
  filename: string;
  domainSegment: string;
}
const downloadMetaMap: Record<number, DownloadMeta> = {};

/**
 * Monetize (Paywall) external messaging support (as required by Monetize).
 */
const connectedPorts = new Set<chrome.runtime.Port>();

chrome.runtime.onConnectExternal.addListener((port) => {
  if (port.sender?.url && port.sender.url.includes('appbox.space')) {
    connectedPorts.add(port);

    port.onDisconnect.addListener(() => {
      connectedPorts.delete(port);
    });
  } else {
    console.warn('Connection attempt from unauthorized domain:', port.sender?.url);
    port.disconnect();
  }
});

function trackEvent(eventName: string, additionalData = {}) {
  getUserId((userId: string) => {
    fetch('https://appbox.space/api/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        wallId: 711,
        extensionId: chrome.runtime.id,
        userId: userId,
        ...additionalData,
      }),
    });
  });
}

function notifyConnectedClients(notification: unknown) {
  connectedPorts.forEach((port) => {
    try {
      port.postMessage(notification);
    } catch (error) {
      console.error('Error sending notification to port:', error);
      connectedPorts.delete(port);
    }
  });
}

function getUserId(callback: (userId: string) => void) {
  chrome.storage.sync.get(['user_id'], (result) => {
    if (result.user_id) {
      callback(result.user_id);
    } else {
      const userId = crypto.randomUUID();
      chrome.storage.sync.set({ user_id: userId, ['pw-711-visitor-id']: userId }, () => {
        callback(userId);
      });
    }
  });
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (sender.url && sender.url.includes('appbox.space')) {
    if (message.source === 'supabase-auth-adapter') {
      switch (message.action) {
        case 'ping':
          sendResponse({ status: 'ok' });
          break;

        case 'getItem':
          try {
            const { key } = message.data;
            chrome.storage.sync.get(key, (result) => {
              if (chrome.runtime.lastError) {
                const errorMessage = chrome.runtime.lastError.message;
                console.error('Storage error:', errorMessage);
                sendResponse({ status: 'error', message: errorMessage });
              } else {
                sendResponse({ status: 'success', value: result[key] || null });
              }
            });
            return true;
          } catch (error) {
            console.error('Error in getItem:', error);
            sendResponse({ status: 'error', message: (error as Error)?.message });
          }
          break;

        case 'setItem':
          try {
            const { key, value } = message.data;
            chrome.storage.sync.set({ [key]: value }, () => {
              if (chrome.runtime.lastError) {
                const errorMessage = chrome.runtime.lastError.message;
                console.error('Storage error:', errorMessage);
                sendResponse({ status: 'error', message: errorMessage });
              } else {
                sendResponse({ status: 'success' });
                notifyConnectedClients({
                  type: 'storage_update',
                  action: 'set',
                  key,
                  value,
                  timestamp: Date.now(),
                });
              }
            });
            return true;
          } catch (error) {
            console.error('Error in setItem:', error);
            sendResponse({ status: 'error', message: (error as Error)?.message });
          }
          break;

        case 'removeItem':
          try {
            const { key } = message.data;
            chrome.storage.sync.remove(key, () => {
              if (chrome.runtime.lastError) {
                const errorMessage = chrome.runtime.lastError.message;
                console.error('Storage error:', errorMessage);
                sendResponse({ status: 'error', message: errorMessage });
              } else {
                notifyConnectedClients({
                  type: 'storage_update',
                  action: 'remove',
                  key,
                  timestamp: Date.now(),
                });
                sendResponse({ status: 'success' });
              }
            });
            return true;
          } catch (error) {
            console.error('Error in removeItem:', error);
            sendResponse({ status: 'error', message: (error as Error)?.message });
          }
          break;

        default:
          console.warn('Unknown action:', message.action);
          sendResponse({ status: 'error', message: 'Unknown action' });
          break;
      }
    } else if (message.type === 'broadcast') {
      notifyConnectedClients(message.data || message);

      sendResponse({
        status: 'success',
        message: 'Message broadcasted successfully',
        clientsCount: connectedPorts.size,
      });
    } else {
      console.warn('Message has neither source nor type');
      sendResponse({ status: 'error', message: 'Invalid message format' });
    }
  } else {
    console.warn('Message from unauthorized domain:', sender.url);
    sendResponse({ status: 'error', message: 'Unauthorized domain' });
  }

  return true;
});

/**
 * Gets the actual content script path from manifest
 */
function getContentScriptPath(): string {
  try {
    const manifest = chrome.runtime.getManifest();
    const contentScripts = manifest.content_scripts;
    if (contentScripts && contentScripts.length > 0 && contentScripts[0].js) {
      return contentScripts[0].js[0];
    }

    // Если content_scripts пуст или неправильный, логируем это
    const manifestError = new Error('Content scripts not found in manifest');
    Object.assign(manifestError, {
      context: ContentScriptConstants.CONTEXT.INJECTION,
      manifestInfo: {
        hasContentScripts: !!contentScripts,
        contentScriptsLength: contentScripts?.length || 0,
        manifest: manifest,
      },
      timestamp: new Date().toISOString(),
    });
    handleError(manifestError);

    throw manifestError;
  } catch (error) {
    // Логируем ошибку чтения manifest
    const readError = ensureError(error);
    Object.assign(readError, {
      context: ContentScriptConstants.CONTEXT.INJECTION,
      manifestReadError: true,
      timestamp: new Date().toISOString(),
    });
    handleError(readError);

    throw readError;
  }
}

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
        const contentScriptPath = getContentScriptPath();
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [contentScriptPath], // Динамический путь из manifest
        });
      } catch (error) {
        // Детальное логирование ошибок инъекции в Sentry
        const injectionError = ensureError(error);
        Object.assign(injectionError, {
          context: ContentScriptConstants.CONTEXT.INJECTION,
          tabInfo: {
            tabId: tab.id,
            url: tab.url,
            title: tab.title,
            status: tab.status,
            active: tab.active,
          },
          timestamp: new Date().toISOString(),
        });
        handleError(injectionError);
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
    // Pre-compute sanitized domain segment at registration time
    let domainSegment = '';
    if (message.pageUrl) {
      const domain = extractDomain(message.pageUrl);
      if (domain) {
        domainSegment = `${sanitizeFileName(domain)}/`;
      }
    }

    downloadMetaMap[message.downloadId] = {
      filename: message.filename,
      domainSegment,
    };

    // Backstop cleanup in case onDeterminingFilename never fires
    setTimeout(() => {
      delete downloadMetaMap[message.downloadId];
    }, 30_000);

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
        const organizeByDomain = downloadOptions?.organizeByDomain;

        // Check if we have saved metadata for this download ID
        const meta = item.id ? downloadMetaMap[item.id] : undefined;
        let finalFilename = meta?.filename || item.filename;

        if (meta) {
          // Clean up — backstop timer will also fire but delete on undefined is harmless
          setTimeout(() => {
            delete downloadMetaMap[item.id];
          }, 5000);
        }

        // Make sure it has a valid extension
        finalFilename = ensureValidExtension(finalFilename, item.url);

        // Apply rename pattern if specified
        if (renamePattern) {
          finalFilename = applyRenamePattern(finalFilename, renamePattern);
          finalFilename = sanitizeFileName(finalFilename);
        }

        // Domain subfolder segment (pre-computed at registration time)
        const domainSegment = organizeByDomain && meta?.domainSegment ? meta.domainSegment : '';

        // Apply folder to filename if needed
        if (folderName) {
          const sanitizedFolder = sanitizeFileName(folderName);
          return `${sanitizedFolder}/${domainSegment}${finalFilename}`;
        } else {
          return `${domainSegment}${finalFilename}`;
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
            const contentType = response.headers.get('content-type') || '';

            // Check if response is actually an image
            if (!contentType.startsWith('image/')) {
              // Try to read response as text to see what we got
              try {
                sendResponse({
                  error: true,
                  message: `Server returned ${contentType} instead of image`,
                });
                cleanupRules();
                return;
              } catch (textError) {
                throw new Error(JSON.stringify(textError));
              }
            }

            const blob = await response.blob();

            // Double-check blob type
            if (blob.type && !blob.type.startsWith('image/')) {
              sendResponse({ error: true, message: `Received ${blob.type} instead of image` });
              cleanupRules();
              return;
            }

            const dataUrl = await blobToDataUrl(blob);
            if (!dataUrl) {
              sendResponse({ error: true, message: 'Failed to convert image to data URL' });
              cleanupRules();
              return;
            }

            sendResponse({ dataUrl });
            cleanupRules();
            return;
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
  chrome.runtime.onInstalled.addListener(async (details) => {
    try {
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // Monetize: mark user as NEW (stored in sync so it is available across browsers/devices)
        await chrome.storage.sync.set({
          installDate: new Date().toISOString(),
        });

        trackEvent('install');

        await chrome.tabs.create({
          url: ApplicationLinks.INSTALL_URL,
        });
      } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        // When extension is updated
      } else if (details.reason === chrome.runtime.OnInstalledReason.CHROME_UPDATE) {
        // When browser is updated
      } else if (details.reason === chrome.runtime.OnInstalledReason.SHARED_MODULE_UPDATE) {
        // When a shared module is updated
      }

      // Устанавливаем флаг напоминания через 10 дней
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + RatingConstants.REMINDER_INTERVAL_DAYS);

      await chrome.storage.local.set({
        [StorageKeys.REMINDER_DATE_FLAG]: reminderDate.toISOString(),
      });

      await injectContentScriptIntoAllTabs();
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
    removeReferrerRules().catch(handleError);
  });

  chrome.runtime.setUninstallURL(ApplicationLinks.UNINSTALL_URL);
} catch (error) {
  handleError(error);
}

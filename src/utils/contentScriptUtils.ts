/**
 * Utility functions for content script management
 */

import { handleError } from './errorHandlers';

import type { ContentScriptMessage } from '../types';

/**
 * Checks if a URL supports content script injection
 */
export const isContentScriptSupported = (url: string): boolean => {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();
  const unsupportedProtocols = [
    'chrome:',
    'chrome-extension:',
    'moz-extension:',
    'edge:',
    'safari-extension:',
    'file:',
    'about:',
    'data:',
  ];

  // Check unsupported protocols
  if (unsupportedProtocols.some((protocol) => lowerUrl.startsWith(protocol))) {
    return false;
  }

  // Check extension stores
  if (
    lowerUrl.includes('chrome.google.com/webstore') ||
    lowerUrl.includes('microsoftedge.microsoft.com/addons') ||
    lowerUrl.includes('addons.mozilla.org')
  ) {
    return false;
  }

  return true;
};

/**
 * Injects content script into a tab
 */
const injectContentScript = async (tabId: number, tabUrl?: string): Promise<boolean> => {
  try {
    // Skip injection if URL is not supported for content scripts
    if (tabUrl && !isContentScriptSupported(tabUrl)) {
      return false;
    }
    const manifest = chrome.runtime.getManifest();
    const contentScriptPath = manifest.content_scripts?.[0]?.js?.[0];
    if (!contentScriptPath) {
      handleError(new Error('Content script path not found in manifest'));
      return false;
    }
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [contentScriptPath],
    });
    return true;
  } catch (error) {
    // enrich error with tabUrl
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    (error as unknown).tabUrl = tabUrl;
    handleError(error);
    return false;
  }
};

/**
 * Safe wrapper for sending messages to content script with automatic injection
 */
export const sendMessageToContentScript = async <T = never>(
  tabId: number,
  message: ContentScriptMessage,
  timeout?: number,
): Promise<T | null> => {
  const messageTimeout = timeout ?? 5000;
  // First attempt - try to send message directly
  const firstAttempt = await new Promise<T | null>((resolve) => {
    const timeoutId = setTimeout(() => resolve(null), messageTimeout);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      clearTimeout(timeoutId);

      if (chrome.runtime.lastError) {
        const errorMessage = chrome.runtime.lastError.message || '';
        if (
          errorMessage.includes('Could not establish connection') ||
          errorMessage.includes('Receiving end does not exist')
        ) {
          // Content script not loaded
          resolve(null);
        } else {
          handleError(new Error(`Content script message failed: ${errorMessage}`));
          resolve(null);
        }
      } else {
        resolve(response);
      }
    });
  });

  // If first attempt succeeded, return result
  if (firstAttempt !== null) {
    return firstAttempt;
  }

  // Получаем url вкладки для enrich
  let tabUrl: string | undefined = undefined;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tabUrl = tab?.url;
  } catch {
    /* empty */
  }

  // If the tab URL is not eligible for content scripts, do not attempt injection
  if (tabUrl && !isContentScriptSupported(tabUrl)) {
    return null;
  }

  // First attempt failed - try to inject content script and retry
  const injected = await injectContentScript(tabId, tabUrl);

  if (!injected) {
    return null;
  }

  // Wait a bit for content script to initialize
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Second attempt after injection
  return new Promise<T | null>((resolve) => {
    const timeoutId = setTimeout(() => resolve(null), messageTimeout);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      clearTimeout(timeoutId);

      if (chrome.runtime.lastError) {
        const error = new Error(
          `Content script message failed after injection: ${chrome.runtime.lastError.message}`,
        );
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        (error as unknown).tabUrl = tabUrl;
        handleError(error);
        resolve(null);
      } else {
        resolve(response);
      }
    });
  });
};

import { ImageData, PageImagesPayload } from '@types';

import { MessageResponse } from './constants';
import { handleError } from './errorHandlers';

/**
 * Sends image data to an active tab and handles the response
 * @param tabId The ID of the tab to send images to
 * @param payload Images payload to send (includes source page URL)
 * @param silent
 * @returns Promise that resolves to true if successful, false if there was an error
 */
export const sendImagesToTab = async (
  tabId: number,
  payload: PageImagesPayload,
  { silent = false }: { silent?: boolean } = {},
): Promise<boolean> => {
  try {
    const response = await chrome.tabs.sendMessage(tabId, payload);
    if (response === MessageResponse.OK) {
      await chrome.tabs.update(tabId, { active: true });
      return true;
    } else {
      if (!silent) handleError(new Error('Failed to confirm images received'));
      return false;
    }
  } catch (error) {
    if (!silent) handleError(error);
    return false;
  }
};

/**
 * Waits for a tab to reach 'complete' status.
 */
const waitForTabComplete = (tabId: number): Promise<void> =>
  new Promise<void>((resolve) => {
    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      resolve();
    };
    const timeoutId = setTimeout(cleanup, 10_000);
    const onUpdated = (id: number, info: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === 'complete') cleanup();
    };
    const onRemoved = (id: number) => {
      if (id === tabId) cleanup();
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    chrome.tabs
      .get(tabId)
      .then((t) => {
        if (t.status === 'complete') cleanup();
      })
      .catch(cleanup);
  });

/**
 * Creates a page.html tab, waits for it to load, and sends images to it with retry.
 */
export const openPageTabAndSendImages = async (payload: PageImagesPayload): Promise<void> => {
  const newTab = await chrome.tabs.create({ url: 'page.html', active: false });
  if (!newTab.id) return;

  const tabId = newTab.id;
  await waitForTabComplete(tabId);

  const MAX_ATTEMPTS = 10;
  const RETRY_DELAY_MS = 150;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const success = await sendImagesToTab(tabId, payload, { silent: i < MAX_ATTEMPTS - 1 });
    if (success) break;
    if (i < MAX_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
};

/**
 * Sets up a listener for image data from popup
 * @param setImages Function to set images in state
 * @param setIsLoading Function to set loading state
 * @param setPageUrl Function to set source page URL in state
 * @param setSourceTabId
 * @returns A cleanup function to remove the listener
 */
export const setupImageListener = (
  setImages: (images: ImageData[]) => void,
  setIsLoading: (isLoading: boolean) => void,
  setPageUrl: (pageUrl: string | null) => void,
  setSourceTabId?: (tabId: number | null) => void,
): (() => void) => {
  const listener = (
    payload: PageImagesPayload,
    _: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (payload && Array.isArray(payload.images) && payload.images.length > 0) {
      setImages(payload.images);
      setPageUrl(payload.pageUrl);
      if (setSourceTabId && payload.sourceTabId) {
        setSourceTabId(payload.sourceTabId);
      }
      setIsLoading(false);
      sendResponse(MessageResponse.OK);
      return true;
    }
    return false;
  };

  chrome.runtime.onMessage.addListener(listener);

  // Return cleanup function
  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
};

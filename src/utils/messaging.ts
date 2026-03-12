import { ImageData, PageImagesPayload } from '@types';
import { handleError, MessageResponse } from '@utils';

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

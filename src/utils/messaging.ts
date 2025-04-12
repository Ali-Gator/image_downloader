import { MessageResponse } from './constants';
import { handleError } from './errorHandlers';
import { ImageData } from '../types';

/**
 * Sends image data to an active tab and handles the response
 * @param tabId The ID of the tab to send images to
 * @param images Array of image data to send
 * @returns Promise that resolves to true if successful, false if there was an error
 */
export const sendImagesToTab = async (tabId: number, images: ImageData[]): Promise<boolean> => {
  try {
    const response = await chrome.tabs.sendMessage(tabId, images);
    if (response === MessageResponse.OK) {
      await chrome.tabs.update(tabId, { active: true });
      return true;
    } else {
      handleError(new Error('Failed to confirm images received'), true, 'Something went wrong');
      return false;
    }
  } catch (error) {
    handleError(error, true, 'Something went wrong');
    return false;
  }
};

/**
 * Sets up a listener for image data from popup
 * @param setImages Function to set images in state
 * @param setIsLoading Function to set loading state
 * @returns A cleanup function to remove the listener
 */
export const setupImageListener = (
  setImages: (images: ImageData[]) => void,
  setIsLoading: (isLoading: boolean) => void,
): (() => void) => {
  const listener = (
    images: ImageData[],
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (Array.isArray(images) && images.length > 0) {
      setImages(images);
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

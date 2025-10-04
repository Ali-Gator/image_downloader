import { useCallback, useEffect, useState } from 'react';

import { ContentScriptImageResponse, ImageFetchResponse, MessageActionType } from '@types';

import { IMAGE_FETCH_TIMEOUTS } from './constants';
import { isContentScriptSupported } from './contentScriptUtils';
import { handleError } from './errorHandlers';

/**
 * Try to fetch image by injecting script into page context
 */
const fetchImageViaInjectedScript = async (url: string): Promise<string | null> => {
  try {
    // Get all tabs and find the right one
    const tabs = await chrome.tabs.query({});

    // Find the tab with the target URL domain
    const targetDomain = new URL(url).hostname;
    let targetTab = tabs.find((tab) => tab.url?.includes(targetDomain));

    // Fallback to active tab in current window
    if (!targetTab) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      targetTab = activeTab;
    }

    if (!targetTab?.id || !targetTab.url) {
      return null;
    }

    // Only try if we're on a proper web page
    if (!targetTab.url.startsWith('http://') && !targetTab.url.startsWith('https://')) {
      return null;
    }

    // Skip if URL is not eligible for content scripts (web store, chrome://, etc.)
    if (!isContentScriptSupported(targetTab.url)) {
      return null;
    }

    // Try MAIN world first, fallback to ISOLATED if needed
    let result;
    try {
      [result] = await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        world: 'MAIN', // Execute in page context, not isolated world
        func: async (imageUrl: string) => {
          // Function will be serialized, so we need to redefine utilities inline

          // Try direct fetch first
          try {
            const response = await fetch(imageUrl, {
              method: 'GET',
              credentials: 'include',
              mode: 'cors',
              headers: {
                Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'sec-fetch-dest': 'image',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'upgrade-insecure-requests': '1',
              },
            });

            if (response.ok) {
              const blob = await response.blob();
              // Note: blobToDataUrl can't be used here because functions are serialized
              return new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
              });
            }
          } catch (fetchError) {
            // Fall back to canvas method
          }

          // Canvas fallback
          return new Promise<string | null>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  resolve(null);
                  return;
                }

                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0);

                resolve(canvas.toDataURL('image/png'));
              } catch (error) {
                resolve(null);
              }
            };

            img.onerror = () => resolve(null);
            img.src = imageUrl;

            setTimeout(() => resolve(null), 5000);
          });
        },
        args: [url],
      });
    } catch (mainWorldError) {
      // Try ISOLATED world as fallback
      try {
        [result] = await chrome.scripting.executeScript({
          target: { tabId: targetTab.id },
          // Default is ISOLATED world
          func: async (imageUrl: string) => {
            try {
              const response = await fetch(imageUrl, {
                method: 'GET',
                credentials: 'include',
                mode: 'cors',
              });

              if (response.ok) {
                const blob = await response.blob();
                // Note: blobToDataUrl can't be used here because functions are serialized
                return new Promise<string | null>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = () => resolve(null);
                  reader.readAsDataURL(blob);
                });
              }
            } catch (error) {
              // Silent failure
            }
            return null;
          },
          args: [url],
        });
      } catch (isolatedWorldError) {
        return null;
      }
    }

    return result?.result || null;
  } catch (error) {
    return null;
  }
};

/**
 * Try to fetch image through content script (which has access to page context)
 */
const fetchImageViaContentScript = async (url: string): Promise<string | null> => {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) return null;

    // Only try content script if we're on a proper web page
    if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
      return null;
    }

    // Send message to content script to fetch image with timeout
    const response = await new Promise<ContentScriptImageResponse | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), IMAGE_FETCH_TIMEOUTS.CONTENT_SCRIPT);

      chrome.tabs.sendMessage(
        tab.id!,
        {
          action: MessageActionType.FETCH_IMAGE_AS_DATA_URL,
          url: url,
        },
        (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            resolve(null);
          } else {
            resolve(response);
          }
        },
      );
    });

    return response?.dataUrl || null;
  } catch (error) {
    return null;
  }
};

/**
 * Try to fetch image through background script
 */
const fetchImageViaBackground = async (url: string): Promise<string | null> => {
  try {
    const response = await new Promise<ImageFetchResponse>((resolve) => {
      chrome.runtime.sendMessage({ msg: MessageActionType.FETCH_IMAGE, url }, resolve);
    });

    return response.dataUrl || null;
  } catch (error) {
    return null;
  }
};

/**
 * Hook for loading images with CORS fallback
 * If direct loading fails, uses content script first, then background script
 */
export const useImagePreview = (originalSrc: string) => {
  const [src, setSrc] = useState<string>(originalSrc);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Reset states when originalSrc changes
  useEffect(() => {
    setSrc(originalSrc);
    setIsLoading(false);
    setHasError(false);
  }, [originalSrc]);

  // Main fetch function that tries multiple methods
  const fetchImageWithFallback = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setHasError(false);

    try {
      // Try injected script first (works in page context, best for CORS)
      let dataUrl = await fetchImageViaInjectedScript(originalSrc);

      // If injected script failed, try content script
      if (!dataUrl) {
        dataUrl = await fetchImageViaContentScript(originalSrc);
      }

      // If content script failed, try background script
      if (!dataUrl) {
        dataUrl = await fetchImageViaBackground(originalSrc);
      }

      if (dataUrl) {
        setSrc(dataUrl);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } catch (error) {
      handleError(error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [originalSrc, isLoading]);

  // Handle image load error - fallback to fetch methods
  const handleImageError = useCallback(() => {
    if (src === originalSrc) {
      // Only try fallback if we haven't already tried it
      fetchImageWithFallback();
    } else {
      // If even the fallback failed, show error state
      setHasError(true);
    }
  }, [src, originalSrc, fetchImageWithFallback]);

  return {
    src,
    isLoading,
    hasError,
    onError: handleImageError,
  };
};

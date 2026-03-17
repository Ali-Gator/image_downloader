import { ImageCandidate, ImageData, MessageActionType, ValidateImageUrlResponse } from '../types';
import { ContentScriptConstants, handleError } from '../utils';
import { collectImages } from './collectImages';
import { debugLogger } from '../utils/debugLogger';
import { ensureError } from '../utils/errorHandlers';
import { extractOgImageFromHtml } from '../utils/fullSizeResolver';
import { blobToDataUrl } from '../utils/imageUtils';
import {
  isCanvasHeavyApp,
  observeNewPerformanceEntries,
  performanceUrlsToImageData,
  probeImageDimensions,
} from '../utils/performanceImageScanner';
import { captureMessage } from '../utils/sentryCapturer';

const ENHANCE_LOG_CONTEXT = 'fullSizeResolver';

/**
 * Simple fetch image as data URL (content script version)
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) return null;

    const blob = await response.blob();
    return blobToDataUrl(blob);
  } catch (error) {
    return null;
  }
}

// Module-level cache for images discovered by PerformanceObserver between scans
let perfObserverCache: ImageCandidate[] = [];
const perfObserverSeenUrls = new Set<string>();
let isCanvasApp = false;

// Defer DOM detection + observer setup until DOM is ready
function initPerfObserver() {
  isCanvasApp = isCanvasHeavyApp();

  observeNewPerformanceEntries(
    (newUrls) => {
      const unseen = newUrls.filter((url) => !perfObserverSeenUrls.has(url));
      if (unseen.length === 0) return;
      for (const url of unseen) perfObserverSeenUrls.add(url);
      performanceUrlsToImageData(unseen).then((newImages) => {
        perfObserverCache = [...perfObserverCache, ...newImages];
      });
    },
    { includeXhr: isCanvasApp },
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPerfObserver, { once: true });
} else {
  initPerfObserver();
}

/** Drains perfObserverCache and returns its contents. */
function drainPerfObserverCache(): ImageCandidate[] {
  const snapshot = perfObserverCache;
  perfObserverCache = [];
  return snapshot;
}

// Module-level cache
let cachedImages: ImageData[] = [];
let cacheTimestamp = 0;
const CACHE_MAX_AGE_MS = 30_000; // 30 seconds

/** Runs collectImages() and updates the cache. */
async function refreshCache(): Promise<{ images: ImageData[]; pageUrl: string }> {
  const result = await collectImages({
    includeXhrInPerf: isCanvasApp,
    drainPerfObserverCache,
  });
  cachedImages = result.images;
  cacheTimestamp = Date.now();
  return result;
}

// MutationObserver only invalidates cache — expensive scan is deferred to message handlers
const mutationObserver = new MutationObserver(() => {
  // Mark cache as stale so the next GRAB_IMAGES does a fresh scan
  cacheTimestamp = 0;
});

// Start observing after initial page load
const startMutationObserver = () => {
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'data-src', 'data-lazy', 'data-original'],
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(startMutationObserver, 800), {
    once: true,
  });
} else {
  setTimeout(startMutationObserver, 800);
}

/** Shared scan-and-respond for GRAB_IMAGES / RESCAN_IMAGES handlers. */
function scanAndRespond(sendResponse: (response: unknown) => void, messageAction: string): void {
  refreshCache()
    .then((result) => sendResponse(result))
    .catch((error) => {
      const err = ensureError(error);
      Object.assign(err, {
        context: ContentScriptConstants.CONTEXT.MESSAGE_HANDLER,
        messageAction,
      });
      handleError(err);
      sendResponse({
        error: 'An error occurred while processing the request',
        details: err.message,
      });
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  try {
    // Health check для проверки доступности content script
    if (message.action === MessageActionType.HEALTH_CHECK) {
      sendResponse({ available: true, timestamp: Date.now() });
      return true;
    }

    if (message.action === MessageActionType.FETCH_IMAGE_AS_DATA_URL) {
      // Handle image fetch request from popup/page
      fetchImageAsDataUrl(message.url)
        .then((dataUrl) => {
          sendResponse({ dataUrl });
        })
        .catch(() => {
          sendResponse({ dataUrl: null });
        });
      return true; // Indicate async response
    }

    if (message.action === MessageActionType.GRAB_IMAGES) {
      // Use cache when fresh
      const isCacheFresh =
        Date.now() - cacheTimestamp < CACHE_MAX_AGE_MS && cachedImages.length > 0;
      if (isCacheFresh) {
        sendResponse({ images: cachedImages, pageUrl: window.location.href });
        return true;
      }

      scanAndRespond(sendResponse, message.action);
      return true;
    }

    if (message.action === MessageActionType.RESCAN_IMAGES) {
      // Always bypass cache for rescan
      scanAndRespond(sendResponse, message.action);
      return true;
    }

    if (message.action === MessageActionType.ENHANCE_IMAGES) {
      enhanceImages(message.images)
        .then(({ images, upgradedCount }) => sendResponse({ images, upgradedCount }))
        .catch((error) => {
          const err = ensureError(error);
          Object.assign(err, {
            context: ContentScriptConstants.CONTEXT.MESSAGE_HANDLER,
            messageAction: message.action,
          });
          handleError(err);
          sendResponse({ error: 'Enhancement failed', details: err.message });
        });
      return true;
    }
  } catch (error) {
    // Отправляем ошибку в Sentry с подробным контекстом
    const contentScriptError = ensureError(error);
    Object.assign(contentScriptError, {
      context: ContentScriptConstants.CONTEXT.MESSAGE_HANDLER,
      messageAction: message.action,
      tabInfo: {
        url: window.location.href,
        domain: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent,
      },
      timestamp: new Date().toISOString(),
    });
    handleError(contentScriptError);
    // Send error response to avoid hanging the message port
    sendResponse({
      error: 'An error occurred while processing the request',
      details: contentScriptError.message,
    });
  }
  return true; // Нужно для асинхронных обработчиков
});

const MAX_OG_FETCHES = 50;

const DIMENSION_PROBE_TIMEOUT_MS = 10000;

/**
 * Strategy D: For images with linkedPageUrl, fetch the page HTML via background
 * script and extract og:image / twitter:image meta tags.
 */
async function enhanceImages(
  images: ImageData[],
): Promise<{ images: ImageData[]; upgradedCount: number }> {
  const candidates = images.filter((img) => img.linkedPageUrl);

  debugLogger.log(
    'info',
    ENHANCE_LOG_CONTEXT,
    `Enhancement triggered: ${candidates.length}/${images.length} candidates with linkedPageUrl`,
  );

  // Deduplicate by linkedPageUrl — fetch each unique page only once
  const uniqueUrls = [...new Set(candidates.map((img) => img.linkedPageUrl!))].slice(
    0,
    MAX_OG_FETCHES,
  );

  // Fetch OG images for each unique page URL
  const ogCache = new Map<string, string | null>();

  await Promise.allSettled(
    uniqueUrls.map(async (pageUrl) => {
      try {
        const metaResponse = await chrome.runtime.sendMessage({
          msg: MessageActionType.FETCH_PAGE_META,
          url: pageUrl,
          referrer: window.location.origin,
        });

        if (!metaResponse?.html) {
          debugLogger.log(
            'warn',
            ENHANCE_LOG_CONTEXT,
            `Strategy D fetch failed: ${pageUrl} -> no HTML returned`,
          );
          ogCache.set(pageUrl, null);
          return;
        }

        const ogImageUrl = extractOgImageFromHtml(metaResponse.html);
        if (!ogImageUrl) {
          ogCache.set(pageUrl, null);
          return;
        }

        // Validate the OG image URL
        const validation: ValidateImageUrlResponse = await chrome.runtime.sendMessage({
          msg: MessageActionType.VALIDATE_IMAGE_URL,
          url: ogImageUrl,
        });

        if (validation?.exists) {
          ogCache.set(pageUrl, ogImageUrl);
        } else {
          debugLogger.log(
            'warn',
            ENHANCE_LOG_CONTEXT,
            `Validation failed: ${ogImageUrl} -> not accessible`,
          );
          ogCache.set(pageUrl, null);
        }
      } catch (error) {
        debugLogger.log(
          'warn',
          ENHANCE_LOG_CONTEXT,
          `Strategy D fetch failed: ${pageUrl} -> ${ensureError(error).message}`,
        );
        captureMessage(`Strategy D fetch failed: ${pageUrl}`, 'warning');
        ogCache.set(pageUrl, null);
      }
    }),
  );

  // Apply resolved OG images to all candidates sharing the same linkedPageUrl
  const updated = new Map<string, ImageData>();
  for (const img of candidates) {
    const ogImageUrl = ogCache.get(img.linkedPageUrl!);
    if (ogImageUrl && ogImageUrl !== img.src) {
      debugLogger.log(
        'info',
        ENHANCE_LOG_CONTEXT,
        `Strategy D: ${img.src} -> ${ogImageUrl} (OG meta from ${img.linkedPageUrl})`,
      );
      updated.set(img.id, {
        ...img,
        originalSrc: img.originalSrc || img.src,
        src: ogImageUrl,
        enhanced: true,
      });
    }
  }

  // Load actual dimensions for enhanced images
  if (updated.size > 0) {
    const dimensionResults = await Promise.allSettled(
      [...updated.entries()].map(async ([id, img]) => {
        const dims = await probeImageDimensions(img.src, DIMENSION_PROBE_TIMEOUT_MS);
        return { id, dims };
      }),
    );

    for (const result of dimensionResults) {
      if (result.status === 'fulfilled' && result.value.dims.width > 0) {
        const img = updated.get(result.value.id)!;
        img.width = result.value.dims.width;
        img.height = result.value.dims.height;
      }
    }
  }

  debugLogger.log(
    'info',
    ENHANCE_LOG_CONTEXT,
    `Enhancement complete: ${updated.size}/${images.length} upgraded`,
  );

  return {
    images: images.map((img) => updated.get(img.id) || img),
    upgradedCount: updated.size,
  };
}

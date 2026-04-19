import {
  ConvertAndDownloadImageMessage,
  ImageCandidate,
  ImageData,
  MessageActionType,
  ValidateImageUrlResponse,
} from '../types';
import { ContentScriptConstants, handleError } from '../utils';
import { collectImages } from './collectImages';
import { DEFAULT_OPTIONS } from '../utils/constants';
import { debugLogger } from '../utils/debugLogger';
import { ensureError } from '../utils/errorHandlers';
import {
  extractMainImageFromHtml,
  extractOgImageFromHtml,
  isEnhancementLarger,
  isSameImagePath,
} from '../utils/fullSizeResolver';
import { convertImageElementToFormat, convertImageUrlToFormat } from '../utils/imageConverter';
import { blobToDataUrl } from '../utils/imageUtils';
import {
  isCanvasHeavyApp,
  observeNewPerformanceEntries,
  performanceUrlsToImageData,
  probeImageDimensions,
} from '../utils/performanceImageScanner';
import { captureMessage } from '../utils/sentryCapturer';
import { getSettingFromStorage } from '../utils/settingsReader';

// Bump the native resource timing buffer so entries aren't trimmed before the first scan.
performance.setResourceTimingBufferSize?.(500);

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
let isCanvasApp: boolean | null = null;

function resolveIsCanvasApp(): boolean {
  if (isCanvasApp === null) {
    isCanvasApp = isCanvasHeavyApp();
  }
  return isCanvasApp;
}

function initPerfObserver() {
  observeNewPerformanceEntries(
    (newUrls) => {
      const unseen = newUrls.filter((url) => !perfObserverSeenUrls.has(url));
      if (unseen.length === 0) return;
      for (const url of unseen) perfObserverSeenUrls.add(url);
      performanceUrlsToImageData(unseen).then((newImages) => {
        perfObserverCache.push(...newImages);
      });
    },
    { includeXhr: resolveIsCanvasApp() },
  );
}

/** Drains perfObserverCache and returns its contents. */
function drainPerfObserverCache(): ImageCandidate[] {
  const snapshot = perfObserverCache;
  perfObserverCache = [];
  return snapshot;
}

function startMutationObserver() {
  const mutationObserver = new MutationObserver(() => {
    // Skip when cache is already stale — the observer can fire thousands of
    // times per second on SPAs and the write would notify no one new.
    if (cacheTimestamp === 0) return;
    cacheTimestamp = 0;
  });
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'data-src', 'data-lazy', 'data-original'],
  });
}

async function maybeEnableLegacyObservers() {
  try {
    const enabled = await getSettingFromStorage('enableLegacyObservers', false);
    if (!enabled) return;
  } catch {
    return;
  }

  const start = () => {
    initPerfObserver();
    setTimeout(startMutationObserver, 800);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}

maybeEnableLegacyObservers();

// Module-level cache
let cachedImages: ImageData[] = [];
let cacheTimestamp = 0;
const CACHE_MAX_AGE_MS = 30_000; // 30 seconds

/** Runs collectImages() and updates the cache. */
async function refreshCache(): Promise<{ images: ImageData[]; pageUrl: string }> {
  const maxBgImages = await getSettingFromStorage('maxBgImages', DEFAULT_OPTIONS.maxBgImages);
  const result = await collectImages({
    includeXhrInPerf: resolveIsCanvasApp(),
    drainPerfObserverCache,
    maxBgImages,
  });
  cachedImages = result.images;
  cacheTimestamp = Date.now();
  return result;
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
        .then((result) => sendResponse(result))
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

    if (message.action === MessageActionType.CONVERT_AND_DOWNLOAD_IMAGE) {
      const { imageUrl, targetFormat } = message as ConvertAndDownloadImageMessage;

      const fetchViaBackground = async (u: string): Promise<string> => {
        const resp = await chrome.runtime.sendMessage({
          msg: MessageActionType.FETCH_IMAGE,
          url: u,
        });
        if (!resp?.dataUrl) throw new Error(resp?.error || 'fetch failed');
        return resp.dataUrl;
      };

      let imgEl = document.querySelector<HTMLImageElement>(`img[src="${CSS.escape(imageUrl)}"]`);
      if (!imgEl) {
        // currentSrc (post-srcset resolution) is a property, not an attribute — fall back to scan
        const imgs = document.getElementsByTagName('img');
        for (const img of imgs) {
          if (img.currentSrc === imageUrl) {
            imgEl = img;
            break;
          }
        }
      }

      const doConvert = async (): Promise<string> => {
        if (imgEl) {
          try {
            return await convertImageElementToFormat(imgEl, targetFormat);
          } catch {
            // canvas taint or other error — fall through to URL-based conversion
          }
        }
        return convertImageUrlToFormat(imageUrl, targetFormat, fetchViaBackground);
      };

      doConvert()
        .then((dataUrl) => sendResponse({ dataUrl }))
        .catch((error) => {
          const err = ensureError(error);
          handleError(err);
          sendResponse({ error: err.message });
        });
      return true;
    }
  } catch (error) {
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
  return true;
});

const DIMENSION_PROBE_TIMEOUT_MS = 10000;

/**
 * Strategy D: For images with linkedPageUrl, fetch the page HTML via background
 * script and extract og:image / twitter:image meta tags.
 */
async function enhanceImages(
  images: ImageData[],
): Promise<{ images: ImageData[]; upgradedCount: number; remainingCount: number }> {
  const maxOgFetches = await getSettingFromStorage('maxOgFetches', DEFAULT_OPTIONS.maxOgFetches);
  const candidates = images.filter(
    (img): img is ImageData & { linkedPageUrl: string } =>
      !img.enhanced && !!img.linkedPageUrl && img.width > 0 && img.height > 0,
  );

  debugLogger.log(
    'info',
    ENHANCE_LOG_CONTEXT,
    `Enhancement triggered: ${candidates.length}/${images.length} candidates with linkedPageUrl`,
  );

  // Deduplicate by linkedPageUrl — fetch each unique page only once
  const allCandidateUrls = [...new Set(candidates.map((img) => img.linkedPageUrl))];
  const urlsToFetch = allCandidateUrls.slice(0, maxOgFetches);

  // Fetch OG images for each unique page URL
  const ogCache = new Map<string, string | null>();

  await Promise.allSettled(
    urlsToFetch.map(async (pageUrl) => {
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

        const ogImageUrl =
          extractOgImageFromHtml(metaResponse.html) ??
          extractMainImageFromHtml(metaResponse.html, pageUrl);
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
    const ogImageUrl = ogCache.get(img.linkedPageUrl);
    if (ogImageUrl && ogImageUrl !== img.src) {
      if (isSameImagePath(ogImageUrl, img.src)) {
        debugLogger.log(
          'info',
          ENHANCE_LOG_CONTEXT,
          `Strategy D skipped (same base path): ${img.src} vs ${ogImageUrl}`,
        );
        continue;
      }

      debugLogger.log(
        'info',
        ENHANCE_LOG_CONTEXT,
        `Strategy D: ${img.src} -> ${ogImageUrl} (OG meta from ${img.linkedPageUrl})`,
      );
      updated.set(img.id, {
        ...img,
        originalSrc: img.originalSrc || img.src,
        originalWidth: img.originalWidth ?? img.width,
        originalHeight: img.originalHeight ?? img.height,
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
        const origW = img.originalWidth ?? img.width;
        const origH = img.originalHeight ?? img.height;
        const newW = result.value.dims.width;
        const newH = result.value.dims.height;

        if (!isEnhancementLarger(newW, newH, origW, origH)) {
          debugLogger.log(
            'warn',
            ENHANCE_LOG_CONTEXT,
            `Rejecting enhancement for ${img.src}: ${newW}x${newH} <= original ${origW}x${origH}`,
          );
          updated.delete(result.value.id);
        } else {
          img.width = newW;
          img.height = newH;
        }
      } else if (result.status === 'fulfilled') {
        // Probe returned 0×0 (CORS, timeout, non-image URL)
        updated.delete(result.value.id);
      }
    }
  }

  // Count unique candidate URLs that were not fetched in this batch (beyond maxOgFetches limit)
  const remainingCount = Math.max(0, allCandidateUrls.length - urlsToFetch.length);

  debugLogger.log(
    'info',
    ENHANCE_LOG_CONTEXT,
    `Enhancement complete: ${updated.size}/${images.length} upgraded, ${remainingCount} remaining`,
  );

  return {
    images: images.map((img) => updated.get(img.id) || img),
    upgradedCount: updated.size,
    remainingCount,
  };
}

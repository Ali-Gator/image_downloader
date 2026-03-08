import { ImageCandidate, ImageData, MessageActionType } from '../types';
import { ContentScriptConstants, handleError, PlaceholderImages } from '../utils';
import { scanBackgroundImages } from '../utils/backgroundImageScanner';
import { getSmartFileName } from '../utils/fileUtils';
import { generateImageId } from '../utils/idUtils';
import {
  getBestSrcFromElement,
  getPictureSourceUrl,
  isPlaceholderDataUrl,
  normalizeImageUrl,
} from '../utils/imageSrcExtractor';
import { blobToDataUrl } from '../utils/imageUtils';
import {
  isCanvasHeavyApp,
  observeNewPerformanceEntries,
  performanceUrlsToImageData,
  scanPerformanceEntries,
} from '../utils/performanceImageScanner';

/**
 * Проверяет, является ли URL допустимым изображением
 *
 * @param url URL изображения для проверки
 * @returns true если URL валидный и не является плейсхолдером
 */
const isValidImage = (url: string): boolean => {
  // Проверяем, что URL не пустой и не является плейсхолдером
  // Spacer.gif - это обычные 1px прозрачные гифки, используемые для выравнивания
  // Data:image/gif - это встроенные маленькие изображения, часто используемые как плейсхолдеры
  if (
    !url ||
    url.trim() === '' ||
    isPlaceholderDataUrl(url) ||
    url.includes(PlaceholderImages.SPACER_GIF)
  ) {
    return false;
  }

  // Проверяем наличие метода URL.canParse (добавлен в Chrome 108+)
  if (typeof URL.canParse === 'function') {
    // Используем современный метод canParse, если он доступен
    return URL.canParse(url);
  } else {
    // Фолбэк для старых браузеров - используем try/catch с конструктором URL
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Получает примерный размер изображения в байтах
 * @param img DOM элемент изображения
 * @returns Размер изображения в байтах (приблизительный)
 */
const estimateImageSize = (img: HTMLImageElement): number => {
  try {
    // Для data: URL можно примерно оценить размер из строки
    if (img.src.startsWith('data:')) {
      const base64 = img.src.split(',')[1];
      if (base64) {
        // Base64 кодирует 3 байта в 4 символа (плюс возможный padding)
        const padding = (base64.match(/=/g) || []).length;
        return Math.floor((base64.length - padding) * 0.75);
      }
    }

    // Используем информацию о загруженных ресурсах, если доступно
    if (window.performance && window.performance.getEntriesByName) {
      const entries = window.performance.getEntriesByName(img.src, 'resource');
      if (entries.length > 0) {
        const entry = entries[0] as PerformanceResourceTiming;
        if (entry.transferSize && entry.transferSize > 0) {
          return entry.transferSize;
        }
        if (entry.encodedBodySize && entry.encodedBodySize > 0) {
          return entry.encodedBodySize;
        }
      }
    }

    // Используем аппроксимацию на основе разрешения и формата
    // Предполагаем 3 байта на пиксель для PNG/JPEG (среднее сжатие)
    // WebP обычно имеет лучшее сжатие - примерно 2 байта на пиксель
    const pixelCount = img.naturalWidth * img.naturalHeight;
    const isWebP = img.src.toLowerCase().includes('webp') || img.src.startsWith('data:image/webp');

    return isWebP ? pixelCount * 2 : pixelCount * 3;
  } catch (e) {
    // Если что-то пошло не так, возвращаем оценку на основе разрешения
    return img.naturalWidth * img.naturalHeight * 3;
  }
};

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
      // Wrap in async IIFE since the handler must return true synchronously
      (async () => {
        try {
          const allImgElements = Array.from(document.getElementsByTagName('img'));

          // Limit processing to avoid memory issues - process in batches
          const MAX_IMAGES_TO_PROCESS = 2000;
          const imagesToProcess = allImgElements.slice(0, MAX_IMAGES_TO_PROCESS);

          // Сразу отфильтровываем и создаем объекты с нужными свойствами
          const candidateImages: ImageCandidate[] = [];
          const seenUrls = new Set<string>();

          for (const img of imagesToProcess) {
            const bestSrc = getPictureSourceUrl(img) ?? getBestSrcFromElement(img);

            const isValid = isValidImage(bestSrc);
            const isBigEnough =
              img.naturalWidth > PlaceholderImages.MIN_SIZE_PX &&
              img.naturalHeight > PlaceholderImages.MIN_SIZE_PX;

            if (!isValid || !isBigEnough || seenUrls.has(bestSrc)) {
              continue;
            }

            seenUrls.add(bestSrc);
            // Also track original src to avoid duplicates when both resolve to same image
            if (img.src) seenUrls.add(img.src);

            const imageCandidate: ImageCandidate = {
              id: generateImageId(bestSrc, img.naturalWidth, img.naturalHeight),
              src: bestSrc,
              alt: img.alt || '',
              width: img.naturalWidth,
              height: img.naturalHeight,
              aspectRatio: img.naturalWidth / img.naturalHeight,
              filename: '',
              fileSize: estimateImageSize(img),
              qualityScore: 0,
            };

            imageCandidate.filename = getSmartFileName(imageCandidate);
            candidateImages.push(imageCandidate);
          }

          // Collect SVG elements with data-src (lazy-loaded external SVGs)
          const svgElements = document.querySelectorAll('svg[data-src]');
          for (const svg of svgElements) {
            const rawSrc = svg.getAttribute('data-src');
            if (!rawSrc) continue;
            const src = normalizeImageUrl(rawSrc);
            if (!isValidImage(src) || seenUrls.has(src)) continue;
            seenUrls.add(src);

            const width = svg.getAttribute('width');
            const height = svg.getAttribute('height');
            const w = parseInt(width || '0', 10) || 200;
            const h = parseInt(height || '0', 10) || 200;

            const svgCandidate: ImageCandidate = {
              id: generateImageId(src, w, h),
              src,
              alt: svg.getAttribute('aria-label') || '',
              width: w,
              height: h,
              aspectRatio: h > 0 ? w / h : 0,
              filename: '',
              fileSize: 0,
              qualityScore: 0,
            };
            svgCandidate.filename = getSmartFileName(svgCandidate);
            candidateImages.push(svgCandidate);
          }

          // Collect background images
          const bgImages = scanBackgroundImages(PlaceholderImages.MIN_SIZE_PX);
          for (const bg of bgImages) {
            if (!isValidImage(bg.url) || seenUrls.has(bg.url)) continue;
            seenUrls.add(bg.url);
            const bgCandidate: ImageCandidate = {
              id: generateImageId(bg.url, bg.width, bg.height),
              src: bg.url,
              alt: '',
              width: bg.width,
              height: bg.height,
              aspectRatio: bg.height > 0 ? bg.width / bg.height : 0,
              filename: '',
              fileSize: 0,
              qualityScore: 0,
            };
            bgCandidate.filename = getSmartFileName(bgCandidate);
            candidateImages.push(bgCandidate);
          }

          // Performance API scan — complementary pass for CSS/preload/XHR-loaded images
          const { urls: perfUrls, sizeMap } = scanPerformanceEntries({ includeXhr: isCanvasApp });
          const perfImages = await performanceUrlsToImageData(
            perfUrls.filter((url) => !seenUrls.has(url)),
            sizeMap,
          );

          for (const perfImage of perfImages) {
            if (!seenUrls.has(perfImage.src)) {
              seenUrls.add(perfImage.src);
              candidateImages.push(perfImage);
            }
          }

          // Drain observer cache (images caught between scans) to prevent unbounded growth
          const observerSnapshot = perfObserverCache;
          perfObserverCache = [];
          for (const cachedImage of observerSnapshot) {
            if (!seenUrls.has(cachedImage.src)) {
              seenUrls.add(cachedImage.src);
              candidateImages.push(cachedImage);
            }
          }

          // Sort images by size (area) - larger images first
          candidateImages.sort((a, b) => {
            const areaA = a.width * a.height;
            const areaB = b.width * b.height;
            return areaB - areaA;
          });

          // Limit final results to prevent UI overload and memory issues
          const MAX_FINAL_IMAGES = 2000;
          const finalImages: ImageData[] = candidateImages
            .slice(0, MAX_FINAL_IMAGES)
            .map((candidate) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { qualityScore, ...imageData } = candidate;
              return imageData;
            });

          sendResponse({ images: finalImages, pageUrl: window.location.href });
        } catch (error) {
          const contentScriptError = error instanceof Error ? error : new Error(String(error));
          Object.assign(contentScriptError, {
            context: ContentScriptConstants.CONTEXT.MESSAGE_HANDLER,
            messageAction: message.action,
          });
          handleError(contentScriptError);
          sendResponse({
            error: 'An error occurred while processing the request',
            details: error instanceof Error ? error.message : String(error),
          });
        }
      })();
      return true; // Async response
    }
  } catch (error) {
    // Отправляем ошибку в Sentry с подробным контекстом
    const contentScriptError = error instanceof Error ? error : new Error(String(error));
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
      details: error instanceof Error ? error.message : String(error),
    });
  }
  return true; // Нужно для асинхронных обработчиков
});

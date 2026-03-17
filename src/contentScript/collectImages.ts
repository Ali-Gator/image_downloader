import { ImageCandidate, ImageData } from '../types';
import { isTinyImage, PlaceholderImages } from '../utils';
import { scanBackgroundImages } from '../utils/backgroundImageScanner';
import { getSmartFileName } from '../utils/fileUtils';
import {
  resolveDataAttributes,
  resolveParentAnchorUrl,
  resolveUrlPatternCleanup,
} from '../utils/fullSizeResolver';
import { generateImageId } from '../utils/idUtils';
import {
  getBestSrcFromElement,
  getPictureSourceUrl,
  isPlaceholderDataUrl,
  normalizeImageUrl,
} from '../utils/imageSrcExtractor';
import {
  performanceUrlsToImageData,
  scanPerformanceEntries,
} from '../utils/performanceImageScanner';

/**
 * Проверяет, является ли URL допустимым изображением
 *
 * @param url URL изображения для проверки
 * @returns true если URL валидный и не является плейсхолдером
 */
export const isValidImage = (url: string): boolean => {
  if (
    !url ||
    url.trim() === '' ||
    isPlaceholderDataUrl(url) ||
    url.includes(PlaceholderImages.SPACER_GIF)
  ) {
    return false;
  }

  if (typeof URL.canParse === 'function') {
    return URL.canParse(url);
  } else {
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
export const estimateImageSize = (img: HTMLImageElement): number => {
  try {
    if (img.src.startsWith('data:')) {
      const base64 = img.src.split(',')[1];
      if (base64) {
        const padding = (base64.match(/=/g) || []).length;
        return Math.floor((base64.length - padding) * 0.75);
      }
    }

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

    const pixelCount = img.naturalWidth * img.naturalHeight;
    const isWebP = img.src.toLowerCase().includes('webp') || img.src.startsWith('data:image/webp');

    return isWebP ? pixelCount * 2 : pixelCount * 3;
  } catch (e) {
    return img.naturalWidth * img.naturalHeight * 3;
  }
};

export interface CollectImagesOptions {
  /** Whether to include XHR in performance entry scan (for canvas-heavy apps) */
  includeXhrInPerf: boolean;
  /** Cached images from PerformanceObserver; drained on read */
  drainPerfObserverCache: () => ImageCandidate[];
}

/**
 * Collects all images from the current page (img elements, SVGs, background images, performance API).
 */
export async function collectImages(
  options: CollectImagesOptions,
): Promise<{ images: ImageData[]; pageUrl: string }> {
  const allImgElements = Array.from(document.getElementsByTagName('img'));

  const MAX_IMAGES_TO_PROCESS = 2000;
  const imagesToProcess = allImgElements.slice(0, MAX_IMAGES_TO_PROCESS);

  const candidateImages: ImageCandidate[] = [];
  const seenUrls = new Set<string>();

  for (const img of imagesToProcess) {
    const bestSrc = getPictureSourceUrl(img) ?? getBestSrcFromElement(img);

    const isValid = isValidImage(bestSrc);
    const isLazy = bestSrc !== img.src;
    if (
      !isValid ||
      (!isLazy && isTinyImage(img.naturalWidth, img.naturalHeight)) ||
      seenUrls.has(bestSrc)
    ) {
      continue;
    }

    seenUrls.add(bestSrc);
    if (img.src) seenUrls.add(img.src);

    const width = isLazy ? parseInt(img.getAttribute('width') || '0') || 0 : img.naturalWidth;
    const height = isLazy ? parseInt(img.getAttribute('height') || '0') || 0 : img.naturalHeight;

    const imageCandidate: ImageCandidate = {
      id: generateImageId(bestSrc, width, height),
      src: bestSrc,
      alt: img.alt || '',
      width,
      height,
      aspectRatio: height > 0 ? width / height : 0,
      filename: '',
      fileSize: estimateImageSize(img),
      qualityScore: 0,
    };

    // Full-size resolution: Strategy C → A → B (most reliable first)
    let resolved = false;

    // Strategy C: Data attributes
    const dataAttrUrl = resolveDataAttributes(img);
    if (dataAttrUrl && dataAttrUrl !== bestSrc) {
      imageCandidate.originalSrc = bestSrc;
      imageCandidate.src = dataAttrUrl;
      imageCandidate.enhanced = true;
      resolved = true;
    }

    // Strategy A: Parent anchor — always run for linkedPageUrl even if already resolved
    const anchorResult = resolveParentAnchorUrl(img);
    if (!resolved && anchorResult?.imageUrl && anchorResult.imageUrl !== bestSrc) {
      imageCandidate.originalSrc = bestSrc;
      imageCandidate.src = anchorResult.imageUrl;
      imageCandidate.enhanced = true;
      resolved = true;
    }
    if (anchorResult?.pageUrl) {
      imageCandidate.linkedPageUrl = anchorResult.pageUrl;
    }

    // Strategy B: URL pattern cleanup
    // When linkedPageUrl is set, skip path segment removal (Strategy D will handle it)
    // but still allow suffix stripping (e.g. _d, _thumb)
    if (!resolved) {
      const cleanedUrl = resolveUrlPatternCleanup(bestSrc, {
        skipPathSegments: !!imageCandidate.linkedPageUrl,
      });
      if (cleanedUrl && cleanedUrl !== bestSrc) {
        imageCandidate.originalSrc = bestSrc;
        imageCandidate.src = cleanedUrl;
        imageCandidate.enhanced = true;
      }
    }

    // Add resolved URL to seenUrls to prevent duplicates
    if (imageCandidate.src !== bestSrc) {
      seenUrls.add(imageCandidate.src);
    }

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
  const { urls: perfUrls, sizeMap } = scanPerformanceEntries({
    includeXhr: options.includeXhrInPerf,
  });
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
  const observerSnapshot = options.drainPerfObserverCache();
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
  const finalImages: ImageData[] = candidateImages.slice(0, MAX_FINAL_IMAGES).map((candidate) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { qualityScore, ...imageData } = candidate;
    return imageData;
  });

  return { images: finalImages, pageUrl: window.location.href };
}

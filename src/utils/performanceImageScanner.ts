import { getSmartFileName } from './fileUtils';
import { generateImageId } from './idUtils';

import type { ImageCandidate } from '../types';

// Image file extensions to recognize
const IMAGE_EXTENSION_RE = /\.(jpe?g|png|webp|gif|svg|avif|bmp|tiff?|ico)(\?|#|$)/i;

// initiatorType values that reliably indicate image resources on any site
const ALWAYS_TRUSTED_INITIATORS = new Set(['img', 'css', 'link']);

// initiatorType values that may indicate images on canvas/Flutter apps
// Excluded from normal sites to avoid tracking pixel / analytics noise
const CANVAS_APP_INITIATORS = new Set(['xmlhttprequest', 'fetch', 'other', '']);

/**
 * Checks whether a single performance entry represents an image resource
 * we want to collect, based on URL shape and initiator type.
 */
function isImageResourceEntry(entry: PerformanceResourceTiming, includeXhr: boolean): boolean {
  const url = entry.name;
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return false;
  if (!IMAGE_EXTENSION_RE.test(url)) return false;
  if (ALWAYS_TRUSTED_INITIATORS.has(entry.initiatorType)) return true;
  return includeXhr && CANVAS_APP_INITIATORS.has(entry.initiatorType);
}

/**
 * Detects Flutter Web apps to unlock XHR/fetch initiator scanning.
 */
export function isFlutterApp(): boolean {
  if (document.querySelector('flt-glass-pane') !== null) return true;
  if (document.querySelector('script[src*="main.dart.js"]') !== null) return true;
  if (document.querySelector('script[src*="flutter_service_worker"]') !== null) return true;
  return false;
}

/**
 * Broader heuristic for non-Flutter canvas apps (Three.js, PixiJS, game engines).
 */
export function isCanvasHeavyApp(): boolean {
  if (isFlutterApp()) return true;
  const imgCount = document.getElementsByTagName('img').length;
  const canvasCount = document.getElementsByTagName('canvas').length;
  return canvasCount > 0 && imgCount < 3 && canvasCount >= imgCount;
}

export interface PerfScanResult {
  urls: string[];
  /** Pre-built file size lookup (avoids O(n*m) per-URL getEntriesByName calls). */
  sizeMap: Map<string, number>;
}

/**
 * Scans Performance API resource entries for image URLs.
 * Returns both the URL list and a size map built from the same pass.
 */
export function scanPerformanceEntries(options: { includeXhr?: boolean } = {}): PerfScanResult {
  if (!window.performance?.getEntriesByType) return { urls: [], sizeMap: new Map() };

  const { includeXhr = false } = options;
  const entries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const seen = new Set<string>();
  const urls: string[] = [];
  const sizeMap = new Map<string, number>();

  for (const entry of entries) {
    const url = entry.name;
    if (!url || seen.has(url)) continue;
    seen.add(url);

    if (!isImageResourceEntry(entry, includeXhr)) continue;

    urls.push(url);
    const size = entry.transferSize || entry.encodedBodySize || 0;
    if (size > 0) sizeMap.set(url, size);
  }

  return { urls, sizeMap };
}

/**
 * Probes a single image URL for real dimensions using a cached `new Image()` load.
 * Returns quickly since the browser already fetched this resource.
 */
function probeImageDimensions(
  url: string,
  timeoutMs: number,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      img.src = '';
      resolve({ width: 0, height: 0 });
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      clearTimeout(timer);
      img.src = '';
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

const PROBE_TIMEOUT_MS = 500;
const PROBE_BATCH_SIZE = 25;

/**
 * Converts raw URLs into ImageCandidate objects, probing dimensions from browser cache.
 * Processes in batches to avoid creating hundreds of Image elements at once.
 */
export async function performanceUrlsToImageData(
  urls: string[],
  sizeMap: Map<string, number> = new Map(),
): Promise<ImageCandidate[]> {
  const results: ImageCandidate[] = [];

  for (let i = 0; i < urls.length; i += PROBE_BATCH_SIZE) {
    const batch = urls.slice(i, i + PROBE_BATCH_SIZE);
    const dims = await Promise.all(batch.map((url) => probeImageDimensions(url, PROBE_TIMEOUT_MS)));

    for (let j = 0; j < batch.length; j++) {
      const url = batch[j];
      const { width, height } = dims[j];
      const candidate: ImageCandidate = {
        id: generateImageId(url, width, height),
        src: url,
        alt: '',
        width,
        height,
        aspectRatio: height > 0 ? width / height : 0,
        fileSize: sizeMap.get(url) ?? 0,
        qualityScore: 0,
        filename: '',
      };
      candidate.filename = getSmartFileName(candidate);
      results.push(candidate);
    }
  }

  return results;
}

/**
 * Watches for images loaded after the initial scan (SPA navigation, Flutter route changes).
 * Returns an unsubscribe function.
 */
export function observeNewPerformanceEntries(
  callback: (urls: string[]) => void,
  options: { includeXhr?: boolean } = {},
): () => void {
  if (!window.PerformanceObserver) return () => {};

  const { includeXhr = false } = options;
  const observer = new PerformanceObserver((list) => {
    const newUrls: string[] = [];
    for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
      if (isImageResourceEntry(entry, includeXhr)) {
        newUrls.push(entry.name);
      }
    }
    if (newUrls.length > 0) callback(newUrls);
  });

  try {
    observer.observe({ type: 'resource', buffered: false });
  } catch {
    return () => {};
  }

  return () => observer.disconnect();
}

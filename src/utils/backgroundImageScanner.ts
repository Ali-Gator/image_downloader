import { extractBackgroundImageUrls } from './imageSrcExtractor';

const BG_SELECTORS = [
  '[style*="background"]',
  '[class*="bg-"]',
  '[class*="background"]',
  '.hero',
  '.banner',
  '.cover',
  '.thumbnail',
  '.card-image',
].join(', ');

const MAX_ELEMENTS_TO_SCAN = 5000;

export interface BackgroundImageInfo {
  url: string;
  width: number;
  height: number;
}

/**
 * Extracts background image info from sized elements, adding to results/seen.
 */
function collectFromElements(
  elements: Iterable<Element>,
  minSize: number,
  seen: Set<string>,
  results: BackgroundImageInfo[],
  maxResults: number,
): void {
  // Batch geometry reads
  const sizedElements: { el: HTMLElement; width: number; height: number }[] = [];
  for (const element of elements) {
    if (results.length + sizedElements.length >= maxResults) break;
    const el = element as HTMLElement;
    if (el.offsetWidth >= minSize && el.offsetHeight >= minSize) {
      sizedElements.push({ el, width: el.offsetWidth, height: el.offsetHeight });
    }
  }

  // Read computed styles (separate pass avoids interleaved layout/style reads)
  for (const { el, width, height } of sizedElements) {
    if (results.length >= maxResults) break;
    const bgUrls = extractBackgroundImageUrls(el);
    for (const url of bgUrls) {
      if (results.length >= maxResults) break;
      if (!seen.has(url)) {
        seen.add(url);
        results.push({ url, width, height });
      }
    }
  }
}

/**
 * Scans the document for elements with significant background images.
 * First pass: targeted selectors for speed.
 * Second pass: walks all elements to catch background images set via CSS rules.
 */
export function scanBackgroundImages(minSize: number, maxResults: number = 200): BackgroundImageInfo[] {
  const seen = new Set<string>();
  const results: BackgroundImageInfo[] = [];

  try {
    // Pass 1: targeted selectors (fast)
    const targeted = document.querySelectorAll(BG_SELECTORS);
    collectFromElements(targeted, minSize, seen, results, maxResults);

    // Pass 2: broad scan for background images set via CSS classes/rules
    if (results.length < maxResults) {
      const scannedInPass1 = new WeakSet<Element>(targeted);
      const allElements = document.querySelectorAll('*');
      const remaining: Element[] = [];
      for (let i = 0; i < allElements.length && remaining.length < MAX_ELEMENTS_TO_SCAN; i++) {
        if (!scannedInPass1.has(allElements[i])) {
          remaining.push(allElements[i]);
        }
      }
      collectFromElements(remaining, minSize, seen, results, maxResults);
    }
  } catch {
    // querySelectorAll can fail on unusual DOMs
  }

  return results;
}

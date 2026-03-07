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

const MAX_RESULTS = 50;

export interface BackgroundImageInfo {
  url: string;
  width: number;
  height: number;
}

/**
 * Scans the document for elements with significant background images.
 */
export function scanBackgroundImages(minSize: number): BackgroundImageInfo[] {
  const seen = new Set<string>();
  const results: BackgroundImageInfo[] = [];

  try {
    const elements = document.querySelectorAll(BG_SELECTORS);

    // Batch geometry reads to avoid layout thrashing
    const sizedElements: { el: HTMLElement; width: number; height: number }[] = [];
    for (const element of elements) {
      if (sizedElements.length >= MAX_RESULTS) break;
      const el = element as HTMLElement;
      if (el.offsetWidth >= minSize && el.offsetHeight >= minSize) {
        sizedElements.push({ el, width: el.offsetWidth, height: el.offsetHeight });
      }
    }

    // Now read computed styles (separate pass avoids interleaved layout/style reads)
    for (const { el, width, height } of sizedElements) {
      if (results.length >= MAX_RESULTS) break;
      const bgUrls = extractBackgroundImageUrls(el);
      for (const url of bgUrls) {
        if (results.length >= MAX_RESULTS) break;
        if (!seen.has(url)) {
          seen.add(url);
          results.push({ url, width, height });
        }
      }
    }
  } catch {
    // querySelectorAll can fail on unusual DOMs
  }

  return results;
}

const RESIZE_PARAMS = new Set([
  'w',
  'width',
  'h',
  'height',
  'size',
  'quality',
  'q',
  'dpr',
  'fit',
  'crop',
  'auto',
  'format',
  'fm',
  'resize',
  'maxwidth',
  'maxheight',
]);

/**
 * Parses a srcset attribute string and returns the URL with the highest resolution.
 */
export function parseSrcset(srcset: string): string | null {
  if (!srcset || !srcset.trim()) return null;

  const candidates = srcset.split(',');
  let bestUrl: string | null = null;
  let bestValue = -1;

  for (const candidate of candidates) {
    const parts = candidate.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) continue;

    const url = parts[0];
    let value = 0;

    if (parts.length > 1) {
      const descriptor = parts[parts.length - 1];
      if (descriptor.endsWith('w')) {
        value = parseInt(descriptor, 10) || 0;
      } else if (descriptor.endsWith('x')) {
        value = (parseFloat(descriptor) || 0) * 1000;
      }
    }

    if (value > bestValue || bestUrl === null) {
      bestValue = value;
      bestUrl = url;
    }
  }

  return bestUrl;
}

/**
 * Returns the best available URL from an <img> element, preferring higher-res sources.
 */
function isUsableUrl(url: string | undefined | null): boolean {
  if (!url || !url.trim() || isPlaceholderDataUrl(url)) return false;
  return url.startsWith('http') || url.startsWith('//') || url.startsWith('/') || url.includes('.');
}

export function getBestSrcFromElement(img: HTMLImageElement): string {
  // 1. srcset attribute
  if (img.srcset) {
    const result = parseSrcset(img.srcset);
    if (isUsableUrl(result)) return normalizeImageUrl(result!);
  }

  // 2. data-srcset (lazy-loaded srcset)
  const dataSrcset = img.dataset.srcset;
  if (dataSrcset) {
    const result = parseSrcset(dataSrcset);
    if (isUsableUrl(result)) return normalizeImageUrl(result!);
  }

  // 3-7. Various data attributes for lazy loading
  const lazyAttrs = [
    img.dataset.src,
    img.dataset.lazy,
    img.dataset['lazySrc'],
    img.dataset.original,
    img.getAttribute('data-full'),
    img.getAttribute('data-zoom-image'),
  ];

  for (const attr of lazyAttrs) {
    if (isUsableUrl(attr)) return normalizeImageUrl(attr!);
  }

  // 8. Fallback to img.src
  return img.src;
}

/**
 * If the <img> has a <picture> parent, finds the best <source> URL.
 */
export function getPictureSourceUrl(img: HTMLImageElement): string | null {
  const picture = img.parentElement;
  if (!picture || picture.tagName !== 'PICTURE') return null;

  const sources = picture.querySelectorAll('source[srcset], source[data-srcset]');

  for (const source of sources) {
    const srcset = source.getAttribute('srcset') || source.getAttribute('data-srcset');
    if (!srcset) continue;

    const result = parseSrcset(srcset);
    if (isUsableUrl(result)) return normalizeImageUrl(result!);
  }

  return null;
}

/**
 * Removes common CDN resize parameters from a URL.
 */
export function normalizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (RESIZE_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Extracts URLs from CSS background-image of an element.
 */
export function extractBackgroundImageUrls(element: Element): string[] {
  const urls: string[] = [];
  try {
    const style = window.getComputedStyle(element);
    const bg = style.getPropertyValue('background-image');
    if (bg && bg !== 'none') {
      const regex = /url\(["']?(https?:\/\/[^"')]+)["']?\)/g;
      let match;
      while ((match = regex.exec(bg)) !== null) {
        urls.push(normalizeImageUrl(match[1]));
      }
    }
  } catch {
    // getComputedStyle can fail on detached elements
  }
  return urls;
}

const MAX_PLACEHOLDER_DATA_URL_LENGTH = 200;

export function isPlaceholderDataUrl(url: string): boolean {
  return (
    (url.startsWith('data:image/gif') || url.startsWith('data:image/svg+xml')) &&
    url.length < MAX_PLACEHOLDER_DATA_URL_LENGTH
  );
}

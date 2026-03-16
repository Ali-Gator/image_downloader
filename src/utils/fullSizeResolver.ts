import { debugLogger } from './debugLogger';
import { VALID_IMAGE_EXTENSIONS } from './imageFormats';

const LOG_CONTEXT = 'fullSizeResolver';
const MAX_ANCESTOR_DEPTH = 5;

const IMAGE_EXTENSIONS = new RegExp(
  `\\.(${VALID_IMAGE_EXTENSIONS.join('|')}|avif|jpe?g)(\\?|$)`,
  'i',
);

/**
 * Thumbnail-word suffixes at the end of the filename stem (before extension).
 * E.g. photo_thumb.jpg → photo.jpg, img-small.png → img.png
 */
const THUMBNAIL_SUFFIXES =
  /([-_](thumb|thumbnail|small|medium|preview|sq|mini|tiny|[smt]|d))(\.[a-z]{3,4})$/i;

/**
 * Numeric size suffixes at the end of the filename stem.
 * E.g. photo_500.jpg → photo.jpg, photo_150x150.jpg → photo.jpg
 */
const SIZE_SUFFIXES = /([-_]\d{2,4}(x\d{2,4})?)(\.[a-z]{3,4})$/i;

/**
 * Path segments that indicate thumbnails. Removed entirely from the path.
 */
const THUMBNAIL_PATH_SEGMENTS = [
  '/thumbs/',
  '/thumbnails/',
  '/thumb/',
  '/small/',
  '/preview/',
  '/mini/',
];

/**
 * Container-like class name patterns for Strategy A container search.
 */
const CONTAINER_CLASS_PATTERN =
  /container|card|item|photo|post|gallery|entry|figure|media|product|tile/i;

export interface ParentAnchorResult {
  imageUrl?: string;
  pageUrl?: string;
}

/**
 * Strategy A: Walk up DOM from <img> to find <a> with image href (ancestor or sibling subtree).
 */
export function resolveParentAnchorUrl(img: HTMLImageElement): ParentAnchorResult | null {
  // Phase 1 — Ancestor walk
  let el: HTMLElement | null = img.parentElement;
  for (let i = 0; i < MAX_ANCESTOR_DEPTH && el; i++) {
    if (el.tagName === 'A') {
      const anchor = el as HTMLAnchorElement;
      const result = classifyHref(anchor.href, img.src, anchor.getAttribute('href'));
      if (result) return result;
    }
    el = el.parentElement;
  }

  // Phase 2 — Container search
  const container = findContainer(img);
  if (!container) return null;

  const links = container.querySelectorAll('a');
  let bestPageUrl: string | null = null;

  for (const link of links) {
    const href = link.href;
    if (!isUsableHref(href, link.getAttribute('href'))) continue;

    if (IMAGE_EXTENSIONS.test(href)) {
      // Direct image link — only use if it's different from the current src
      if (href !== img.src) {
        debugLogger.log('info', LOG_CONTEXT, `Strategy A: ${img.src} -> ${href} (parent anchor)`);
        return { imageUrl: href };
      }
    } else if (!bestPageUrl) {
      bestPageUrl = href;
    }
  }

  if (bestPageUrl) {
    return { pageUrl: bestPageUrl };
  }

  return null;
}

/**
 * Strategy B: Strip thumbnail suffixes and path segments from URL.
 */
export function resolveUrlPatternCleanup(url: string): string | null {
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname;

    // Strip thumbnail path segments
    for (const segment of THUMBNAIL_PATH_SEGMENTS) {
      if (pathname.includes(segment)) {
        pathname = pathname.replace(segment, '/');
      }
    }

    // Strip thumbnail-word suffixes from filename
    pathname = pathname.replace(THUMBNAIL_SUFFIXES, (_match, _suffix, _word, ext) => ext);

    // Strip numeric size suffixes from filename
    pathname = pathname.replace(SIZE_SUFFIXES, (_match, _size, _dim, ext) => ext);

    parsed.pathname = pathname;
    const candidate = parsed.toString();
    if (candidate === url) return null;

    debugLogger.log('info', LOG_CONTEXT, `Strategy B: ${url} -> ${candidate} (URL cleanup)`);
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Data attributes to check for high-res sources (Strategy C).
 */
const HIGH_RES_ATTRS = [
  'data-high-res',
  'data-large',
  'data-full-src',
  'data-hires',
  'data-zoom-src',
  'data-hd-src',
  'data-raw-src',
];
const HIGH_RES_ATTRS_SET = new Set(HIGH_RES_ATTRS);

/**
 * Wildcard pattern for scanning data attributes that might contain full-size URLs.
 */
const WILDCARD_ATTR_PATTERN = /full|orig|large|hires/i;

/**
 * Strategy C: Check data attributes for high-res image URLs.
 */
export function resolveDataAttributes(img: HTMLImageElement): string | null {
  // Check known attributes first
  for (const attr of HIGH_RES_ATTRS) {
    const value = img.getAttribute(attr);
    if (value && value !== img.src) {
      debugLogger.log(
        'info',
        LOG_CONTEXT,
        `Strategy C: ${img.src} -> ${value} (${attr})`,
      );
      return value;
    }
  }

  // Wildcard scan for any data-* attributes matching pattern
  for (const attr of img.attributes) {
    if (
      attr.name.startsWith('data-') &&
      WILDCARD_ATTR_PATTERN.test(attr.name) &&
      attr.value &&
      attr.value !== img.src &&
      !HIGH_RES_ATTRS_SET.has(attr.name)
    ) {
      debugLogger.log(
        'info',
        LOG_CONTEXT,
        `Strategy C: ${img.src} -> ${attr.value} (${attr.name})`,
      );
      return attr.value;
    }
  }

  return null;
}

/**
 * Pre-compiled patterns for OG/Twitter meta tag extraction.
 * Each tag has two patterns to handle both attribute orderings.
 */
const OG_META_PATTERNS = ['og:image', 'twitter:image'].flatMap((tag) => [
  new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${tag}["'][^>]+content\\s*=\\s*["']([^"']+)["']`, 'i'),
  new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+(?:property|name)\\s*=\\s*["']${tag}["']`, 'i'),
]);

/**
 * Strategy D parser: Extract og:image or twitter:image from HTML string.
 */
export function extractOgImageFromHtml(html: string): string | null {
  for (const pattern of OG_META_PATTERNS) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// --- Internal helpers ---

function isUsableHref(href: string, rawHref?: string | null): boolean {
  if (!href) return false;
  const raw = rawHref ?? href;
  if (raw === '#' || raw.startsWith('#') || raw.startsWith('javascript:')) return false;
  return true;
}

function classifyHref(href: string, imgSrc: string, rawHref?: string | null): ParentAnchorResult | null {
  if (!isUsableHref(href, rawHref)) return null;
  if (href === imgSrc) return null;

  if (IMAGE_EXTENSIONS.test(href)) {
    return { imageUrl: href };
  }

  // It's a page link — could be used for Strategy D later
  return { pageUrl: href };
}

function findContainer(img: HTMLImageElement): HTMLElement | null {
  let el: HTMLElement | null = img.parentElement;
  for (let i = 0; i < MAX_ANCESTOR_DEPTH && el; i++) {
    if (el.className && CONTAINER_CLASS_PATTERN.test(el.className)) {
      return el;
    }
    // Structural heuristic: has multiple children including a link
    if (el.children.length > 1 && el.querySelector('a')) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

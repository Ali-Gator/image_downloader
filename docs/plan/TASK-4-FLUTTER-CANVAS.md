# TASK-4 — Performance API Image Detection (Flutter Web + Universal)

## Context Files
Paste before starting: `docs/plan/PROJECT.md`
Prerequisite: TASK-0 complete (Vitest). TASK-2 recommended first (this task touches same content-script code).

## Before You Start — Check Sentry

```
mcp__sentry__search_issues: query="no images found" status=unresolved
```

Cross-reference the affected page URLs — canvas/Flutter sites will cluster here.

## Core Insight

The **Performance API** (`window.performance.getEntriesByType('resource')`) is a fundamentally
different and complementary data source compared to DOM scanning. It records every network request
the browser made for this page, regardless of how the resource was used:

| DOM scanning finds | Performance API finds additionally |
|---|---|
| `<img>` elements in DOM right now | Images that were loaded then removed from DOM (SPA navigation) |
| Inline `style="background-image"` | Images loaded from CSS stylesheets |
| `data-src` / `srcset` attributes | Images loaded via fetch/XHR (Flutter, canvas apps, JS galleries) |
| — | Preloaded/prefetched images (`<link rel="preload">`) |

**This should always run as a complementary pass**, not only for Flutter. It catches real gaps even
on regular websites.

## The Flutter Web Problem

**Specific report**: "Extension doesn't work on https://portocupecoy.com/ — they use Flutter."

Flutter Web CanvasKit renders into a single WebGL `<canvas>` inside `<flt-glass-pane>`.
There are **zero `<img>` elements** for content images — everything is painted via WebGL.
DOM scanning returns 0 results. Performance API is the only way to find these images.

Flutter fetches images via `XMLHttpRequest` before drawing them to canvas. These requests appear
in `performance.getEntriesByType('resource')` with `initiatorType: 'xmlhttprequest'`.

## Implementation

### Step 1 — Extract `generateImageId` to `src/utils/idUtils.ts`

Currently defined inside `content-script.ts`. Extract to make it importable from the new utility:

```ts
// src/utils/idUtils.ts
export const generateImageId = (src: string, width: number, height: number): string =>
  `${src}_${width}_${height}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
```

Update `content-script.ts` to import from `'../utils/idUtils'` instead of defining locally.

### Step 2 — Create `src/utils/performanceImageScanner.ts`

New file. Pure functions — no DOM side effects except reading `window.performance`.

#### Constants

```ts
// Image file extensions to recognize
const IMAGE_EXTENSION_RE = /\.(jpe?g|png|webp|gif|svg|avif|bmp|tiff?|ico)(\?|#|$)/i;

// initiatorType values that reliably indicate image resources on any site
const ALWAYS_TRUSTED_INITIATORS = new Set(['img', 'css', 'link']);

// initiatorType values that may indicate images on canvas/Flutter apps
// Excluded from normal sites to avoid tracking pixel / analytics noise
const CANVAS_APP_INITIATORS = new Set(['xmlhttprequest', 'fetch', 'other', '']);
```

#### `isFlutterApp(): boolean`

Detects Flutter Web apps to unlock XHR/fetch initiator scanning:

```ts
export function isFlutterApp(): boolean {
  // flt-glass-pane is injected by Flutter Web runtime into the regular DOM
  if (document.querySelector('flt-glass-pane') !== null) return true;
  // Compiled Flutter app entry point
  if (document.querySelector('script[src*="main.dart.js"]') !== null) return true;
  // Flutter service worker
  if (document.querySelector('script[src*="flutter_service_worker"]') !== null) return true;
  return false;
}
```

#### `isCanvasHeavyApp(): boolean`

Broader heuristic for non-Flutter canvas apps (Three.js, PixiJS, game engines):

```ts
export function isCanvasHeavyApp(): boolean {
  if (isFlutterApp()) return true;
  const imgCount = document.getElementsByTagName('img').length;
  const canvasCount = document.getElementsByTagName('canvas').length;
  // More canvases than images and very few images overall
  return canvasCount > 0 && imgCount < 3 && canvasCount >= imgCount;
}
```

#### `scanPerformanceEntries(options?: { includeXhr?: boolean }): string[]`

Core function. Always runs. `includeXhr` controls whether XHR/fetch-initiated URLs are included.

```ts
export function scanPerformanceEntries(options: { includeXhr?: boolean } = {}): string[] {
  if (!window.performance?.getEntriesByType) return [];

  const { includeXhr = false } = options;
  const entries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const seen = new Set<string>();
  const imageUrls: string[] = [];

  for (const entry of entries) {
    const url = entry.name;

    // Skip empty, duplicate, blob (temporary browser URLs), or data URLs
    if (!url || seen.has(url) || url.startsWith('blob:') || url.startsWith('data:')) continue;
    seen.add(url);

    // Must look like an image URL by extension
    if (!IMAGE_EXTENSION_RE.test(url)) continue;

    const trustedInitiator = ALWAYS_TRUSTED_INITIATORS.has(entry.initiatorType);
    const xhrInitiator = CANVAS_APP_INITIATORS.has(entry.initiatorType);

    if (trustedInitiator || (includeXhr && xhrInitiator)) {
      imageUrls.push(url);
    }
  }

  return imageUrls;
}
```

#### `performanceUrlsToImageData(urls: string[]): ImageData[]`

Converts raw URLs into `ImageData` objects. Dimensions are unknown (0) for performance-sourced images.

```ts
import { generateImageId } from './idUtils';
import { getSmartFileName } from './fileUtils';
import type { ImageData, ImageCandidate } from '../types';

export function performanceUrlsToImageData(urls: string[]): ImageData[] {
  return urls.map((url) => {
    const candidate: ImageCandidate = {
      id: generateImageId(url, 0, 0),
      src: url,
      alt: '',
      width: 0,
      height: 0,
      aspectRatio: 0,
      fileSize: 0,
      qualityScore: 0,
      filename: '',
    };
    candidate.filename = getSmartFileName(candidate);
    const { qualityScore: _qs, ...imageData } = candidate;
    return imageData;
  });
}
```

#### `observeNewPerformanceEntries(callback: (urls: string[]) => void): () => void`

Watches for images loaded after the initial scan (SPA navigation, Flutter route changes, infinite scroll).
Returns an unsubscribe function.

```ts
export function observeNewPerformanceEntries(
  callback: (urls: string[]) => void,
  options: { includeXhr?: boolean } = {},
): () => void {
  if (!window.PerformanceObserver) return () => {};

  const { includeXhr = false } = options;
  const observer = new PerformanceObserver((list) => {
    const newUrls: string[] = [];
    for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
      const url = entry.name;
      if (!url || url.startsWith('blob:') || url.startsWith('data:')) continue;
      if (!IMAGE_EXTENSION_RE.test(url)) continue;
      const trustedInitiator = ALWAYS_TRUSTED_INITIATORS.has(entry.initiatorType);
      const xhrInitiator = CANVAS_APP_INITIATORS.has(entry.initiatorType);
      if (trustedInitiator || (includeXhr && xhrInitiator)) {
        newUrls.push(url);
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
```

### Step 3 — Integrate into `content-script.ts`

#### 3a. Module-level PerformanceObserver setup

Add after existing module-level code (alongside MutationObserver if TASK-3 done, otherwise standalone):

```ts
import {
  isCanvasHeavyApp,
  performanceUrlsToImageData,
  observeNewPerformanceEntries,
} from '../utils/performanceImageScanner';

// Detect at module load time (before user clicks anything)
const canvasApp = isCanvasHeavyApp();

// Watch for new image loads (Flutter navigation, lazy assets, infinite scroll)
// runs for the lifetime of the tab
observeNewPerformanceEntries(
  (newUrls) => {
    const newImages = performanceUrlsToImageData(newUrls);
    for (const img of newImages) {
      if (!seenUrls.has(img.src)) {
        seenUrls.add(img.src);
        cachedImages = [...cachedImages, img];
        cacheTimestamp = Date.now();
      }
    }
  },
  { includeXhr: canvasApp },
);
```

If TASK-3 is not yet done, `seenUrls`, `cachedImages`, `cacheTimestamp` need to be declared at module level here.

#### 3b. Add performance scan pass inside `collectImages()`

In the `collectImages()` function (or `GRAB_IMAGES` handler if TASK-3 not done), after the DOM scan:

```ts
import { scanPerformanceEntries, performanceUrlsToImageData, isCanvasHeavyApp } from '../utils/performanceImageScanner';

// After the <img> DOM loop completes:
const perfUrls = scanPerformanceEntries({ includeXhr: isCanvasHeavyApp() });
const perfImages = performanceUrlsToImageData(perfUrls);

for (const perfImage of perfImages) {
  if (!seenUrls.has(perfImage.src)) {
    seenUrls.add(perfImage.src);
    candidateImages.push({ ...perfImage, qualityScore: 0 });
  }
}
```

The deduplication via `seenUrls` ensures images already found by DOM scan are not duplicated.
On regular sites this adds mostly nothing (same `<img>` URLs already collected). On Flutter sites
this is the primary source.

### Step 4 — Fix quality filter for unknown-dimension images

**File**: `src/store/imageStore.ts`, `applyFilters()` method.

Images from Performance API have `width: 0, height: 0`. Without this fix they'd be categorized
as `LOW` quality and filtered out when user selects HD or Medium filter.

```ts
// In the quality filter section of applyFilters():
filtered = filtered.filter((img) => {
  // Performance API images have unknown dimensions — always show them
  if (img.width === 0 && img.height === 0) return true;
  const imageQuality = getQualityFromDimensions(img.width, img.height);
  return qualityFilters.some((filter) => filter === imageQuality);
});
```

### Step 5 — Show "Unknown size" in UI instead of "0 × 0"

**File**: `src/components/Page/components/ImageInfo/index.tsx`

Find where `image.width` and `image.height` are rendered and add a guard:

```tsx
const hasDimensions = image.width > 0 && image.height > 0;
// Replace the dimension display with:
{hasDimensions ? `${image.width} × ${image.height}` : t('dimensions_unknown')}
```

Add i18n key `dimensions_unknown` = `"Unknown size"` to `public/_locales/en/messages.json`
and any other locale files present.

**File**: `src/components/Page/components/MetadataBadge/index.tsx` (or wherever resolution badge renders):
Apply the same guard — hide or show "?" for 0×0 images.

## Tests to Write

### `src/utils/__tests__/performanceImageScanner.test.ts`

```ts
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  isFlutterApp,
  isCanvasHeavyApp,
  scanPerformanceEntries,
  performanceUrlsToImageData,
} from '../performanceImageScanner';

describe('isFlutterApp', () => {
  afterEach(() => { document.body.innerHTML = ''; document.head.innerHTML = ''; });

  it('returns false on regular page', () => {
    expect(isFlutterApp()).toBe(false);
  });

  it('detects flt-glass-pane', () => {
    document.body.innerHTML = '<flt-glass-pane></flt-glass-pane>';
    expect(isFlutterApp()).toBe(true);
  });

  it('detects main.dart.js script', () => {
    const script = document.createElement('script');
    script.src = '/build/main.dart.js';
    document.head.appendChild(script);
    expect(isFlutterApp()).toBe(true);
  });
});

describe('isCanvasHeavyApp', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('returns false when more images than canvases', () => {
    document.body.innerHTML = '<img/><img/><img/><canvas/>';
    expect(isCanvasHeavyApp()).toBe(false);
  });

  it('returns true when only canvases and no images', () => {
    document.body.innerHTML = '<canvas/><canvas/>';
    expect(isCanvasHeavyApp()).toBe(true);
  });

  it('returns false on a normal page with no canvas', () => {
    document.body.innerHTML = '<img/><img/>';
    expect(isCanvasHeavyApp()).toBe(false);
  });
});

describe('scanPerformanceEntries', () => {
  it('returns empty array when performance API unavailable', () => {
    const orig = window.performance;
    // @ts-ignore
    delete window.performance;
    expect(scanPerformanceEntries()).toEqual([]);
    window.performance = orig;
  });

  it('includes img-initiated image resources always', () => {
    vi.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
      { name: 'https://ex.com/photo.jpg', initiatorType: 'img' },
    ] as unknown as PerformanceResourceTiming[]);
    expect(scanPerformanceEntries()).toContain('https://ex.com/photo.jpg');
  });

  it('includes css-initiated image resources always', () => {
    vi.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
      { name: 'https://ex.com/bg.png', initiatorType: 'css' },
    ] as unknown as PerformanceResourceTiming[]);
    expect(scanPerformanceEntries()).toContain('https://ex.com/bg.png');
  });

  it('excludes xmlhttprequest resources by default (no includeXhr)', () => {
    vi.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
      { name: 'https://ex.com/flutter-asset.jpg', initiatorType: 'xmlhttprequest' },
    ] as unknown as PerformanceResourceTiming[]);
    expect(scanPerformanceEntries({ includeXhr: false })).toHaveLength(0);
  });

  it('includes xmlhttprequest resources when includeXhr=true', () => {
    vi.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
      { name: 'https://ex.com/flutter-asset.jpg', initiatorType: 'xmlhttprequest' },
    ] as unknown as PerformanceResourceTiming[]);
    expect(scanPerformanceEntries({ includeXhr: true })).toContain('https://ex.com/flutter-asset.jpg');
  });

  it('excludes non-image URLs', () => {
    vi.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
      { name: 'https://ex.com/app.js', initiatorType: 'img' },
      { name: 'https://ex.com/font.woff2', initiatorType: 'css' },
      { name: 'https://ex.com/photo.jpg', initiatorType: 'img' },
    ] as unknown as PerformanceResourceTiming[]);
    const result = scanPerformanceEntries();
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('https://ex.com/photo.jpg');
  });

  it('deduplicates URLs', () => {
    vi.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
      { name: 'https://ex.com/photo.jpg', initiatorType: 'img' },
      { name: 'https://ex.com/photo.jpg', initiatorType: 'img' },
    ] as unknown as PerformanceResourceTiming[]);
    expect(scanPerformanceEntries()).toHaveLength(1);
  });

  it('excludes blob and data URLs', () => {
    vi.spyOn(window.performance, 'getEntriesByType').mockReturnValue([
      { name: 'blob:https://ex.com/abc123', initiatorType: 'img' },
      { name: 'data:image/png;base64,abc', initiatorType: 'img' },
    ] as unknown as PerformanceResourceTiming[]);
    expect(scanPerformanceEntries()).toHaveLength(0);
  });
});

describe('performanceUrlsToImageData', () => {
  it('returns ImageData with width/height 0', () => {
    const result = performanceUrlsToImageData(['https://ex.com/photo.jpg']);
    expect(result).toHaveLength(1);
    expect(result[0].width).toBe(0);
    expect(result[0].height).toBe(0);
    expect(result[0].src).toBe('https://ex.com/photo.jpg');
  });

  it('generates a filename', () => {
    const result = performanceUrlsToImageData(['https://ex.com/my-photo.jpg']);
    expect(result[0].filename).toBeTruthy();
  });
});
```

### `src/store/__tests__/imageStore-quality-filter.test.ts`

```ts
describe('applyFilters — unknown dimension images', () => {
  it('passes through images with width=0 regardless of quality filter', () => {
    const store = useImageStore.getState();
    store.setImages([
      { id: '1', src: 'a.jpg', width: 0, height: 0, ... },
      { id: '2', src: 'b.jpg', width: 100, height: 100, ... },
    ]);
    store.setQualityFilters([QualityLevel.HD]);
    const filtered = store.filteredImages;
    expect(filtered.some(img => img.id === '1')).toBe(true); // unknown size passes
    expect(filtered.some(img => img.id === '2')).toBe(false); // 100x100 is LOW, filtered out
  });
});
```

## Manual E2E Checklist

| Site | What to verify |
|---|---|
| portocupecoy.com (Flutter) | Extension shows images (from Performance API), not 0 results |
| Any CanvasKit Flutter app | Images detected via XHR-initiated performance entries |
| Wikipedia (regular) | No extra duplicate images; count same as before |
| Site with CSS background images in stylesheet | Background images now appear (css-initiator entries) |
| BBC / NYT (srcset + img) | Performance entries add 0 duplicates (already in DOM scan) |
| Site with preloaded images | `<link rel="preload" as="image">` resources appear |

## Acceptance Criteria

- [ ] `scanPerformanceEntries()` always runs as part of `collectImages()` (on every site)
- [ ] `includeXhr: true` is passed only when `isCanvasHeavyApp()` returns true
- [ ] On portocupecoy.com: extension shows images (not 0 results)
- [ ] CSS `background-image` from stylesheets now detected via `initiatorType: 'css'` entries
- [ ] Images with `width: 0, height: 0` are not filtered out by quality filter
- [ ] UI shows "Unknown size" (not "0 × 0") for performance-sourced images
- [ ] `PerformanceObserver` is active for the lifetime of the content script (catches new loads)
- [ ] Blob URLs and data URLs are excluded from performance scan results
- [ ] All unit tests pass (`yarn test`)
- [ ] `yarn build` passes

## What `isFlutterApp()` Is Needed For

Not for activating the Performance API scan (that always runs), but for:
1. Deciding whether to include `xmlhttprequest`/`fetch` initiator types in the scan
2. Passing `includeXhr: true` to `observeNewPerformanceEntries()` in the PerformanceObserver
3. Potentially showing a hint in the UI ("Flutter app detected — scanning network activity")

Without `isFlutterApp()`, XHR-loaded images would be included on all sites, picking up analytics
beacons and tracking pixels that happen to have image extensions in their URL.

## Explicitly Out of Scope

- Canvas pixel extraction (`ctx.getImageData`) — cross-origin tainted canvas; not possible
- Blob URL images — temporary, no stable download URL; skip
- WASM-loaded textures — no URL, embedded in WASM binary; impossible
- Serving as a generic network request interceptor — too invasive, not an extension capability

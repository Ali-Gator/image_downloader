# TASK-2 — Better Image Source Detection

## Context Files
Paste before starting: `docs/plan/PROJECT.md`
Prerequisite: TASK-0 complete (Vitest running).

## Before You Start — Check Sentry

```
mcp__sentry__search_issues: query="no images found" status=unresolved
mcp__sentry__search_issues: query="GRAB_IMAGES" status=unresolved
```

Use `mcp__sentry__get_issue_details` on top results to find which sites/patterns fail most.

## Problem

**File**: `src/contentScript/content-script.ts`, `GRAB_IMAGES` handler (line 128)

Current image detection only reads `img.src` from `<img>` elements:

```ts
const allImgElements = Array.from(document.getElementsByTagName('img'));
// ...
const src = img.src;  // Only this. Nothing else.
```

This misses:
- **`srcset`** — used on almost all modern sites for responsive images. Contains higher-res URLs.
- **`data-src`, `data-lazy`, `data-original`** — lazy-loading patterns (Intersection Observer / legacy lazy loaders). The `img.src` at scan time is often a tiny placeholder.
- **`<picture> > <source srcset>`** — used by Next.js, Gatsby, modern responsive images.
- **CSS `background-image`** — hero images, product images on e-commerce.
- **URL resize parameters** — CDNs like Cloudinary/imgix/Shopify append `?w=400` or `&width=400`. Removing these often yields the original.

Users report "downloads thumbnails instead of originals" because of srcset and lazy-load patterns.

## Implementation

All changes are in `src/contentScript/content-script.ts` and a new utility file.

### Step 1 — Create `src/utils/imageSrcExtractor.ts`

New file with pure functions (no DOM side effects except reading attributes). This keeps the content script lean and makes logic testable.

#### 1a. `parseSrcset(srcset: string): string | null`

Parses a `srcset` attribute string and returns the URL with the highest width descriptor.

```
"img-400.jpg 400w, img-800.jpg 800w, img-1600.jpg 1600w"
→ "img-1600.jpg"

"img.jpg 1x, img@2x.jpg 2x"
→ "img@2x.jpg"

"img.jpg"  (no descriptor)
→ "img.jpg"
```

Algorithm:
1. Split by `,`
2. Each candidate: trim, split by whitespace — `[url, descriptor]`
3. Parse descriptor: if ends with `w` → parse as width integer; if ends with `x` → parse as float * 1000 (normalize to comparable number); if no descriptor → 0
4. Return url of the candidate with highest numeric value
5. Return `null` if input is empty or unparseable

#### 1b. `getBestSrcFromElement(img: HTMLImageElement): string`

Returns the best available URL from an `<img>` element, in priority order:

1. `img.srcset` → `parseSrcset(img.srcset)` if non-empty
2. `img.dataset.srcset` → `parseSrcset(...)` if non-empty
3. `img.dataset.src` if non-empty
4. `img.dataset.lazy` if non-empty (check `img.dataset['lazy-src']` too)
5. `img.dataset.original` if non-empty
6. `img.getAttribute('data-full')` (Shopify pattern)
7. `img.getAttribute('data-zoom-image')` (Magento pattern)
8. `img.src` (fallback — always available)

Return the first non-empty, non-data-gif, non-placeholder value.
Call `normalizeImageUrl()` on the result before returning.

#### 1c. `getPictureSourceUrl(img: HTMLImageElement): string | null`

If the `<img>` has a `<picture>` parent, find the best `<source>` URL:

1. Get `img.parentElement` — check if it's `<picture>`
2. Query all `picture > source[srcset]` elements
3. For each source, call `parseSrcset(source.srcset)` — take the result with highest resolution
4. Also check `source.getAttribute('data-srcset')` for lazy-loaded picture elements
5. Return the best URL found, or `null`

#### 1d. `normalizeImageUrl(url: string): string`

Removes common CDN resize parameters from a URL. Returns the cleaned URL.

Params to remove: `w`, `width`, `h`, `height`, `size`, `quality`, `q`, `dpr`, `fit`, `crop`, `auto`, `format`, `fm`, `resize`, `maxwidth`, `maxheight`

Note: Only remove params that are clearly resize/quality hints. Be conservative — do not strip params that might be auth tokens or content identifiers.

```
"https://cdn.example.com/img.jpg?w=400&quality=80&token=abc"
→ "https://cdn.example.com/img.jpg?token=abc"

"https://img.example.com/photo.jpg?auto=format&fit=crop&w=800&h=600"
→ "https://img.example.com/photo.jpg"
```

Implementation:
- Parse with `new URL(url)` — if parsing fails, return original url unchanged
- Delete the resize params from `searchParams`
- If `searchParams` is now empty, remove the `?` too (handled automatically by `URL.toString()`)

#### 1e. `extractBackgroundImageUrls(element: Element): string[]`

Extracts URLs from CSS `background-image` of an element and its direct children.

```ts
const style = window.getComputedStyle(element);
const bg = style.getPropertyValue('background-image');
// bg may be: "url("https://...")" or "none"
```

Parse with regex: `/url\(["']?(https?:\/\/[^"')]+)["']?\)/g`

Return array of matched URLs, normalized via `normalizeImageUrl`.

Limit depth to immediate element only (not deep subtree scan) to avoid performance issues.

### Step 2 — Create `src/utils/backgroundImageScanner.ts`

New file. Scans the document for elements with significant background images.

#### `scanBackgroundImages(minSize: number): string[]`

Algorithm:
1. Query all elements: `document.querySelectorAll('[style*="background"], [class*="bg-"], [class*="background"]')`
   Plus common patterns: `.hero`, `.banner`, `.cover`, `.thumbnail`, `.card-image`
2. For each element:
   - Check `element.offsetWidth * element.offsetHeight >= minSize * minSize` to skip tiny elements
   - Call `extractBackgroundImageUrls(element)`
3. Deduplicate and return all found URLs
4. Cap at 50 results to avoid performance issues

`minSize` should use `PlaceholderImages.MIN_SIZE_PX` from constants (currently 10).

Note: This is best-effort. Background images on non-standard selectors won't be found.
Do not attempt to walk the full DOM — too expensive.

### Step 3 — Update `GRAB_IMAGES` handler in `src/contentScript/content-script.ts`

Replace the current image collection loop (lines 129–171) with an expanded version.

Key changes:

**3a. Use `getBestSrcFromElement` and `getPictureSourceUrl`**

```ts
// Instead of: const src = img.src
import { getBestSrcFromElement, getPictureSourceUrl } from '../utils/imageSrcExtractor';

const bestSrc = getPictureSourceUrl(img) ?? getBestSrcFromElement(img);
```

Use `bestSrc` where `img.src` was used. Keep `isValidImage(bestSrc)` check.

**3b. Also check `img.src` as fallback for seen-URL deduplication**

`seenUrls` should contain both `img.src` and `bestSrc` to prevent duplicates when both point to the same logical image.

**3c. Add background image collection**

After the `<img>` loop, add background image collection:

```ts
import { scanBackgroundImages } from '../utils/backgroundImageScanner';

const bgUrls = scanBackgroundImages(PlaceholderImages.MIN_SIZE_PX);
for (const bgUrl of bgUrls) {
  if (!isValidImage(bgUrl) || seenUrls.has(bgUrl)) continue;
  seenUrls.add(bgUrl);
  candidateImages.push({
    id: generateImageId(bgUrl, 0, 0),
    src: bgUrl,
    alt: '',
    width: 0,   // unknown for background images
    height: 0,
    aspectRatio: 0,
    filename: getSmartFileName({ src: bgUrl, alt: '', width: 0, height: 0 } as ImageCandidate),
    fileSize: 0,
    qualityScore: 0,
  });
}
```

Background images with `width: 0, height: 0` will sort after real images (they sort by area descending).

**3d. Keep all existing limits** (MAX_IMAGES_TO_PROCESS=500, MAX_FINAL_IMAGES=200).

### Step 4 — Update `isValidImage` to also filter data-gif srcset results

The `parseSrcset` output could potentially produce data URLs. Add a check:

```ts
if (url.startsWith('data:image/gif')) return false;
if (url.startsWith('data:image/svg+xml')) return false;  // SVG placeholders
```

## Tests to Write

### `src/utils/__tests__/imageSrcExtractor.test.ts`

```ts
describe('parseSrcset', () => {
  it('returns highest width-descriptor URL', () => {
    const result = parseSrcset('img-400.jpg 400w, img-800.jpg 800w, img-1600.jpg 1600w');
    expect(result).toBe('img-1600.jpg');
  });

  it('returns highest pixel-ratio URL', () => {
    const result = parseSrcset('img.jpg 1x, img@2x.jpg 2x');
    expect(result).toBe('img@2x.jpg');
  });

  it('handles single URL without descriptor', () => {
    expect(parseSrcset('img.jpg')).toBe('img.jpg');
  });

  it('returns null for empty input', () => {
    expect(parseSrcset('')).toBeNull();
  });

  it('handles URLs with commas in query params (edge case)', () => {
    // This is a known edge case — srcset spec says commas separate candidates
    // URLs with commas must be encoded as %2C
    // Just verify we don't crash on unexpected input
    expect(() => parseSrcset('bad,input,here')).not.toThrow();
  });
});

describe('normalizeImageUrl', () => {
  it('removes width param', () => {
    expect(normalizeImageUrl('https://cdn.ex.com/img.jpg?w=400')).toBe('https://cdn.ex.com/img.jpg');
  });

  it('removes multiple resize params but keeps others', () => {
    const url = 'https://cdn.ex.com/img.jpg?w=400&quality=80&token=abc123';
    expect(normalizeImageUrl(url)).toBe('https://cdn.ex.com/img.jpg?token=abc123');
  });

  it('returns original URL if parsing fails', () => {
    expect(normalizeImageUrl('not-a-url')).toBe('not-a-url');
  });

  it('removes trailing ? when all params removed', () => {
    const result = normalizeImageUrl('https://ex.com/img.jpg?w=400&h=300');
    expect(result).not.toContain('?');
  });
});

describe('getBestSrcFromElement', () => {
  it('prefers srcset over src', () => {
    const img = document.createElement('img');
    img.src = 'thumb.jpg';
    img.srcset = 'small.jpg 400w, large.jpg 1200w';
    expect(getBestSrcFromElement(img)).toBe('large.jpg');
  });

  it('falls back to data-src when srcset is empty', () => {
    const img = document.createElement('img');
    img.src = 'placeholder.gif';
    img.dataset.src = 'real-image.jpg';
    expect(getBestSrcFromElement(img)).toBe('real-image.jpg');
  });

  it('falls back to img.src as last resort', () => {
    const img = document.createElement('img');
    img.src = 'real-image.jpg';
    expect(getBestSrcFromElement(img)).toBe('real-image.jpg');
  });
});
```

Add more tests for `getPictureSourceUrl`, `extractBackgroundImageUrls`, covering DOM manipulation with jsdom.

### Manual E2E Test Checklist

After loading unpacked build:

| Test site type | What to verify |
|---|---|
| Site using `srcset` (e.g., Wikipedia, BBC) | Highest-res URL is collected, not thumbnail |
| Site with lazy loading (`data-src`) | After page scroll, images are detected |
| Site using `<picture>` (Next.js app) | Source URLs extracted, not placeholder |
| E-commerce with Cloudinary (e.g., `?w=400`) | URL normalized to no-resize version |
| Site with CSS background hero image | Background image URL appears in list |

## Acceptance Criteria

- [ ] `parseSrcset` unit tests all pass
- [ ] `normalizeImageUrl` unit tests all pass
- [ ] `getBestSrcFromElement` unit tests all pass
- [ ] On a site with `srcset`, the extension downloads the highest-resolution candidate
- [ ] On a site with `data-src` lazy loading, images are detected after page loads
- [ ] On a site using `<picture>`, source URLs are collected
- [ ] Background images are included in the image list (at least on common patterns)
- [ ] Image count on static pages does not decrease vs. before this change
- [ ] `yarn test` passes
- [ ] `yarn build` passes

## Explicitly Out of Scope

- Do NOT scan iframes — cross-origin restrictions make this unreliable
- Do NOT attempt to fetch and probe candidate URLs to verify they load — too slow
- Do NOT parse CSS stylesheets for background images — too expensive for content script
- The "Force original detection" toggle (ChatGPT plan) — defer, not enough data to know if URL normalization causes false negatives

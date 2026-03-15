# Full-Size Image Resolution Feature

## Context

Users report that the extension downloads thumbnails instead of full-size images on many sites (imgur, flickr, photo
galleries, etc.). The root cause: sites display small previews in `<img>` tags while the full image is available via
parent links, URL patterns, or data attributes. The extension currently extracts the best `<img>` src (srcset, lazy
attrs) but doesn't look beyond the element itself.

**Goal:** Add a multi-strategy resolution pipeline that upgrades thumbnails to full-size originals — cheap strategies
run automatically during scan, expensive ones run on-demand via an "Enhance" button.

---

## Architecture

### New module: `src/utils/fullSizeResolver.ts`

Four strategies, ordered by cost:

| Strategy                        | Runs                       | Description                                                                                                                                                                                                 |
|---------------------------------|----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **A: Parent Anchor**            | Auto (in collectImages)    | Walk up DOM from `<img>` to find `<a>` ancestor/sibling whose `href` is a direct image URL                                                                                                                  |
| **B: URL Pattern Cleanup**      | Auto (in collectImages)    | Strip thumbnail suffixes (`_thumb`, `_small`, `_500`, `_150x150`, `-medium`) and path segments (`/thumbs/`, `/thumbnails/`) from URLs                                                                       |
| **C: Data Attribute Deep Scan** | Auto (in collectImages)    | Check additional attrs: `data-high-res`, `data-large`, `data-full-src`, `data-hires`, `data-zoom-src`, `data-hd-src`, `data-raw-src`, plus wildcard scan for attrs containing "full"/"orig"/"large"/"hires" |
| **D: OG Meta Extraction**       | On-demand (Enhance button) | For images whose parent `<a>` links to an HTML page (not image), fetch page via background script and extract `og:image`/`twitter:image` meta tags                                                          |

**Validation:** All candidate URLs from strategies B and D are validated via HEAD request through background script (
HTTP 200 + `Content-Type: image/*`). Timeout: 5s. Strategy A candidates (direct image URLs from href) get validated too.
Strategy C doesn't need validation (data attrs are set by the site).

### Data model changes (`src/types/index.ts`)

```typescript
interface ImageData {
  // ... existing fields
  originalSrc?: string;    // thumbnail URL before resolution
  enhanced?: boolean;       // true if upgraded from thumbnail
  linkedPageUrl?: string;   // page URL found nearby (for OG meta fetch via Enhance)
}
```

New fields on ImageData:
- `linkedPageUrl?: string` — page URL found by Strategy A container search (for Strategy D to fetch later)

New message types:
- `ENHANCE_IMAGES` — triggers Strategy D from page UI via content script
- `FETCH_PAGE_META` — background script fetches HTML page, returns og:image
- `VALIDATE_IMAGE_URL` — background script HEAD request, returns {exists, contentType}

---

## Implementation Plan

### Phase 1: Types & Data Model

**Files:** `src/types/index.ts`, `src/store/types.ts`

- Add `originalSrc?: string` and `enhanced?: boolean` to `ImageData`
- Add `ENHANCE_IMAGES`, `FETCH_PAGE_META`, `VALIDATE_IMAGE_URL` to `MessageActionType`
- Add corresponding message interfaces
- Add `isEnhancing`, `setIsEnhancing`, `updateImages` to `ImageState`

### Phase 2: Core Resolver Module

**New file:** `src/utils/fullSizeResolver.ts`

Functions to export:

- `resolveParentAnchorUrl(img: HTMLImageElement): string | null` — Strategy A
- `resolveUrlPatternCleanup(url: string): string | null` — Strategy B
- `resolveDataAttributes(img: HTMLImageElement): string | null` — Strategy C
- `extractOgImageFromHtml(html: string): string | null` — Strategy D parser
- `THUMBNAIL_SUFFIXES` regex: `/([-_](thumb|thumbnail|small|medium|preview|sq|icon|mini|tiny|[smt]|d))(\.[a-z]{3,4})$/i`
- `SIZE_SUFFIXES` regex: `/([-_]\d{2,4}(x\d{2,4})?)(\.[a-z]{3,4})$/i`
- `THUMBNAIL_PATH_SEGMENTS`: `/thumbs/`, `/thumbnails/`, `/thumb/`, `/small/`, `/preview/`, `/mini/`
- Additional query params to strip: `shape`, `fidelity`, `thumb`, `thumbnail`, `preset`

Strategy A detail:
- **Phase 1 — Ancestor walk**: Walk up from img through parentElement (max 5 levels). At each level, check if element is `<a>` with href matching image extension.
- **Phase 2 — Container search**: If no direct ancestor `<a>` found, find the closest "container" ancestor (max 5 levels up) and search ALL `<a>` descendants within it. This handles Flickr-style layouts where `<img>` and `<a>` are in separate subtrees of the same container:
  ```html
  <div class="photo-container">        ← container found
    <img src="thumb.jpg">               ← starting element
    <div class="interaction">
      <div><a href="/photos/..."></a></div>  ← found via querySelectorAll('a')
    </div>
  </div>
  ```
- Container heuristic: stop at elements with common container class patterns (`*container*`, `*card*`, `*item*`, `*photo*`, `*post*`) or any element with >1 child that contains both an `<img>` and an `<a>`.
- Prefer `<a>` elements whose href is a direct image URL (for auto-resolution). If href is an HTML page URL, store it as a **page link candidate** for Strategy D (Enhance button).
- Image extensions to match: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.bmp`, `.tiff`, `.svg`
- Ignore `#` and `javascript:` hrefs
- Return type expanded: `{ imageUrl?: string; pageUrl?: string } | null` — imageUrl for direct resolution, pageUrl for deferred Strategy D resolution

Strategy B detail:

- Apply suffix stripping to generate candidate URL
- Only strip suffixes at END of filename stem (before extension) to avoid false positives like `thumb_drive.jpg`
- For path segment replacement: try removing the segment entirely (e.g., `/thumbs/photo.jpg` → `/photo.jpg`)
- Returns null if URL unchanged

**New file:** `src/__tests__/fullSizeResolver.test.ts`

Test cases:

1. Parent `<a href="full.jpg">` wrapping `<img src="thumb.jpg">` → resolves
2. Parent `<a href="/gallery">` (not image) → returns null
3. Sibling `<a href="full.jpg">` next to img container → resolves
3b. Flickr-style: `<a>` is deep inside sibling subtree of container → found via container search, returns `{ pageUrl }` (not direct image)
3c. Container search stops at reasonable boundary (doesn't escape into unrelated content)
4. `photo_thumb.jpg` → `photo.jpg`
5. `photo_500.jpg` → `photo.jpg`
6. `photo_150x150.jpg` → `photo.jpg`
7. `photo-small.jpg` → `photo.jpg`
8. `/thumbs/photo.jpg` → `/photo.jpg`
9. URL with `shape=thumb` → param stripped
10. `thumb_drive.jpg` → NOT modified (no false positive)
11. `christmas.jpg` → NOT modified
12. `data-high-res` attribute → returns value
13. Wildcard data attr scan finds `data-fullsize-url`
14. OG meta extraction from HTML string with `<meta property="og:image" content="...">`
15. OG meta extraction returns null for HTML without meta tags
16. `img_d.webp?maxwidth=520&shape=thumb&fidelity=high` → strips all params

### Phase 3: Content Script Integration

**Files:** `src/contentScript/collectImages.ts`, `src/contentScript/content-script.ts`

In `collectImages.ts`:

- After getting `bestSrc` from `getBestSrcFromElement`, run strategies A, B, C
- If any strategy produces a different URL, set `originalSrc = bestSrc` and use new URL as `src`
- Set `enhanced = true` on the candidate
- Order: C (data attrs) → A (parent anchor) → B (URL cleanup) — most reliable first

In `collectImages.ts` — Strategy A stores `linkedPageUrl` on ImageData:
- When Strategy A finds an `<a>` whose href is a **page URL** (not direct image), store it as `linkedPageUrl` on the candidate
- This is cheap (DOM-only) and runs during initial scan
- Strategy D later uses `linkedPageUrl` to know which pages to fetch

In `content-script.ts`:
- Add handler for `ENHANCE_IMAGES` message
- Receives image list, for each image that has `linkedPageUrl` set:
  - Send `FETCH_PAGE_META` to background script with the `linkedPageUrl`
  - Parse OG image from response via `extractOgImageFromHtml()`
  - Validate via `VALIDATE_IMAGE_URL`
  - If valid, set `src = ogImageUrl`, `originalSrc = old src`, `enhanced = true`
- Return updated image list
- Limit: max 20 OG fetches per enhance call (configurable)

### Phase 4: Background Script Handlers

**File:** `src/background/index.ts`

`FETCH_PAGE_META`:

- Fetch URL with same referrer/headers infrastructure as FETCH_IMAGE
- Return raw HTML text (limit to first 50KB to avoid large downloads)
- Timeout: 5 seconds

`VALIDATE_IMAGE_URL`:

- HEAD request to URL
- Return `{ exists: boolean, contentType: string, contentLength?: number }`
- Timeout: 5 seconds

### Phase 5: Store & UI

**Files:** `src/store/imageStore.ts`, `src/components/Page/components/Toolbar/index.tsx`

Store:

- Add `isEnhancing: boolean` state
- Add `updateImages(updated: ImageData[])` — merges by ID, preserves selection

Toolbar:

- Add "Enhance" button next to "Rescan" with `AutoFixHighIcon` (MUI)
- Shows spinner while enhancing
- Snackbar: "Upgraded N image(s) to full size" / "All images already at best quality"
- Button disabled when `isEnhancing` or no `sourceTabId`

ImageCard/ImageInfo:

- When `enhanced === true`, show small sparkle/star badge with tooltip "Upgraded from thumbnail"
- In list view, show `originalSrc` as muted secondary text

### Phase 6: E2E Tests
**New file:** `e2e/fixtures/fullsize-test-page.html`

Test page must include structures matching real-world sites from user reports:

**Case 1 — Imgur-style (nested anchor wrapping img with resize params):**
```html
<a href="/gallery/photo-of-pup-Dd0bfnF" class="Post-item">
  <div class="Post-item-container">
    <div class="Post-item-media" style="height: 400px;">
      <div class="imageContainer">
        <img src="images/photo_d.webp?maxwidth=520&shape=thumb&fidelity=high"
             width="300" height="400" alt="photo-of-pup">
      </div>
    </div>
  </div>
</a>
```
- Strategy A finds parent `<a>` — but href is a page, not image → stores as `linkedPageUrl`
- Strategy B strips `_d` suffix and `maxwidth`, `shape`, `fidelity` params → auto-resolves to `images/photo.webp`

**Case 2 — Classic thumbnail gallery (direct image link wrapping thumbnail):**
```html
<a href="images/IMG_0003.jpg">
  <img src="images/thumbs/tn_IMG_0003.jpg" class="img_thumbnail_image">
</a>
```
- Strategy A finds parent `<a>` with direct image href → auto-resolves to `images/IMG_0003.jpg`

**Case 3 — Flickr-style (img and link in separate subtrees of container):**
```html
<div class="photo-list-photo-container">
  <img loading="lazy" src="images/55145287496_a240db048f.jpg"
       height="100%" width="100%">
  <div class="interaction-view">
    <div class="photo-list-photo-interaction">
      <a class="overlay" href="/photos/125877475/55145287496/"
         aria-label="cold evening by Rafael Zenon Wagner"></a>
    </div>
  </div>
</div>
```
- Strategy A container search finds `<a>` in sibling subtree → href is page URL → stores as `linkedPageUrl`
- Strategy D (Enhance button) fetches the page URL to extract OG image

**Case 4 — Data attribute (high-res source):**
```html
<img data-high-res="images/photo-full.png" src="images/photo-thumb.png">
```
- Strategy C finds `data-high-res` → auto-resolves

**Case 5 — URL suffix cleanup (no link, just URL pattern):**
```html
<img src="images/landscape_thumb.jpg">
```
- `images/landscape.jpg` is also served by the fixture server
- Strategy B strips `_thumb` suffix → validates via HEAD → auto-resolves

**Fixture server updates** (`e2e/extension-fixture.ts`):
- Serve the fullsize test page at a dedicated path
- Serve test images (both thumb and full versions) from `e2e/fixtures/images/`
- For Case 3 Flickr page URL: serve a mock HTML page at `/photos/125877475/55145287496/` that contains `<meta property="og:image" content="http://localhost:9753/images/55145287496_full.jpg">`

**File:** `e2e/extension.spec.ts`
- New test group: "full-size image resolution"
  - Test: "auto-resolves direct image links (Case 2)" — verify `IMG_0003.jpg` URL is collected instead of `tn_IMG_0003.jpg`
  - Test: "auto-resolves URL suffix patterns (Case 5)" — verify `landscape.jpg` URL is collected instead of `landscape_thumb.jpg`
  - Test: "auto-resolves data attributes (Case 4)" — verify `photo-full.png` is collected
  - Test: "strips resize params from URLs (Case 1)" — verify `photo.webp` without params
  - Test: "stores linkedPageUrl for Flickr-style layouts (Case 3)" — verify `linkedPageUrl` is populated
  - Test: "Enhance button resolves OG images (Case 3)" — click Enhance, verify upgraded URL from OG meta

### Phase 7: Logging & Sentry

In `fullSizeResolver.ts`, log via `debugLogger`:

- **info** `[fullSizeResolver] Strategy A: {thumbUrl} -> {fullUrl} (parent anchor)`
- **info** `[fullSizeResolver] Strategy B: {thumbUrl} -> {fullUrl} (URL cleanup)`
- **info** `[fullSizeResolver] Strategy C: {thumbUrl} -> {fullUrl} (data-{attr})`
- **info** `[fullSizeResolver] Strategy D: {thumbUrl} -> {fullUrl} (OG meta from {pageUrl})`
- **warn** `[fullSizeResolver] Validation failed: {url} -> HTTP {status}`
- **warn** `[fullSizeResolver] Strategy D fetch failed: {pageUrl} -> {error}`
- **info** `[fullSizeResolver] Enhancement complete: {count}/{total} upgraded`

Sentry breadcrumbs via `captureMessage` for:

- Enhancement triggered (with count of images)
- Enhancement completed (with upgrade count)
- Strategy D failures (as warnings)

### Phase 8: Onboarding Step

**Files:** `src/components/Page/components/Onboarding/steps.tsx`, `public/_locales/en/messages.json`

Add a new onboarding step after "Reset & Rescan" (step 4) that explains the Enhance feature:
- **Step definition** in `steps.tsx`:
  ```typescript
  {
    titleKey: 'onboarding_enhance_title',
    textKey: 'onboarding_enhance_text',
    Icon: AutoFixHighOutlined,
    targetSelector: '[data-onboarding="enhance-button"]',
    tooltipPlacement: 'bottom',
  }
  ```
- **Target attribute**: Add `data-onboarding="enhance-button"` to the Enhance button in Toolbar
- **i18n keys**:
  - `onboarding_enhance_title`: "Find Full-Size Images"
  - `onboarding_enhance_text`: "Some sites show thumbnails instead of full images. Click Enhance to automatically find and upgrade to the original full-size versions."
- **Test update**: Update onboarding test (`src/__tests__/onboarding.test.tsx`) to account for the new step count (6 → 7 steps)

### Phase 9: Localization

**File:** `public/_locales/en/messages.json` (only en locale)

New keys:

- `enhance_button`: "Enhance"
- `enhance_button_title`: "Find full-size versions of thumbnail images"
- `enhance_found`: "Upgraded $1 image(s) to full size"
- `enhance_no_upgrades`: "All images are already at best quality"
- `enhanced_badge_tooltip`: "Upgraded from thumbnail"

---

## Files to Create/Modify

| Action | File                                                 | Purpose                                      |
|--------|------------------------------------------------------|----------------------------------------------|
| Create | `src/utils/fullSizeResolver.ts`                      | Core resolution strategies                   |
| Create | `src/__tests__/fullSizeResolver.test.ts`             | Unit tests                                   |
| Create | `e2e/fixtures/fullsize-test-page.html`               | E2E fixture                                  |
| Create | `docs/plan/TASK-6-FULL-SIZE-RESOLUTION.md`           | This plan                                    |
| Modify | `src/types/index.ts`                                 | `originalSrc`, `enhanced`, new message types |
| Modify | `src/store/types.ts`                                 | `isEnhancing`, `updateImages` in ImageState  |
| Modify | `src/store/imageStore.ts`                            | New state & actions                          |
| Modify | `src/contentScript/collectImages.ts`                 | Wire strategies A/B/C                        |
| Modify | `src/contentScript/content-script.ts`                | ENHANCE_IMAGES handler                       |
| Modify | `src/background/index.ts`                            | FETCH_PAGE_META, VALIDATE_IMAGE_URL          |
| Modify | `src/utils/imageSrcExtractor.ts`                     | Add extra params to RESIZE_PARAMS            |
| Modify | `src/components/Page/components/Toolbar/index.tsx`   | Enhance button                               |
| Modify | `src/components/Page/components/ImageCard/index.tsx` | Enhanced badge                               |
| Modify | `src/components/Page/components/ImageInfo/index.tsx` | Enhanced indicator                           |
| Modify | `src/components/Page/components/Onboarding/steps.tsx` | New onboarding step for Enhance |
| Modify | `src/__tests__/onboarding.test.tsx`                   | Update step count |
| Modify | `public/_locales/en/messages.json`                    | i18n strings                                 |
| Modify | `e2e/extension.spec.ts`                               | E2E test                                     |

---

## Verification

1. **Unit tests:** `npm run test` — all fullSizeResolver tests pass
2. **E2E tests:** `npm run test:e2e` — fullsize fixture test passes
3. **Manual testing:**

- Load extension, visit imgur.com gallery page → images should auto-resolve via Strategy A (parent anchors) and B (URL
  cleanup removing `_d` suffix and `maxwidth`/`shape`/`fidelity` params)
- Visit flickr.com/explore → click Enhance → images with gallery links resolve via OG meta
- Visit a basic photo gallery → parent anchor links resolve automatically
- Check debugLogger output (`chrome.storage.local` → extension storage) for resolution logs
- Verify Sentry breadcrumbs in Sentry dashboard

4. **Regression:** existing tests pass, no slowdown in initial scan (strategies A/B/C are synchronous DOM/string
   operations)

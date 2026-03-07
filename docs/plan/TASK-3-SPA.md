# TASK-3 — SPA / Dynamic Content Support

## Context Files

Paste before starting: `docs/plan/PROJECT.md`
Prerequisite: TASK-0 complete. TASK-2 recommended first (this task calls the same image collection logic).

## Before You Start — Check Sentry

```
mcp__sentry__search_issues: query="content script not available" status=unresolved
mcp__sentry__search_issues: query="Could not establish connection" status=unresolved
mcp__sentry__search_issues: query="no images found" status=unresolved
```

Note: many "no images found" errors may be SPA-related (images not yet rendered when scan runs).

## Problem

**File**: `src/contentScript/content-script.ts`

The content script scans images only once, synchronously, when it receives the `GRAB_IMAGES` message.
On modern sites, this is often too early:

1. **React / Angular / Vue SPAs** — the DOM may be mostly empty on first load; images appear after JS hydration (100ms–2000ms after DOMContentLoaded).
2. **Infinite scroll** — images below the fold load dynamically as the user scrolls; a one-shot scan misses them entirely.
3. **Lazy loading with Intersection Observer** — `img.src` is set to a placeholder until the image enters the viewport; a scan before scrolling gets only placeholders (partially addressed by TASK-2's `data-src` support, but not fully — some lazy loaders only set `src` after intersection).

Users report: "extension shows 0 images" on React apps, "only found 3 images on a page with 50."

## Implementation

### Step 1 — Add `RESCAN_IMAGES` to `MessageActionType` in `src/types/index.ts`

```ts
export enum MessageActionType {
  // ...existing...
  RESCAN_IMAGES = 'rescanImages',
}
```

### Step 2 — Extract image collection into a reusable function in `content-script.ts`

Currently the image collection logic is inlined inside the `GRAB_IMAGES` message handler.
Extract it into a standalone function `collectImages(): ImageData[]` so it can be called from multiple places (handler, MutationObserver, rescan).

The function signature:

```ts
function collectImages(): { images: ImageData[]; pageUrl: string };
```

This is a refactor only — do not change the logic. The handler becomes:

```ts
if (message.action === MessageActionType.GRAB_IMAGES) {
  sendResponse(collectImages());
  return true;
}
```

### Step 3 — Add `RESCAN_IMAGES` handler in `content-script.ts`

```ts
if (message.action === MessageActionType.RESCAN_IMAGES) {
  sendResponse(collectImages());
  return true;
}
```

Identical to `GRAB_IMAGES` — same result, same logic. The distinction exists for future telemetry (knowing when users need to rescan vs. initial scan).

### Step 4 — Add MutationObserver in `content-script.ts`

Add a module-level observer that watches for DOM changes and caches the latest image list.
The Popup can then request this cached result immediately, even before user clicks.

```ts
// Module-level cache
let cachedImages: ImageData[] = [];
let cacheTimestamp = 0;
const CACHE_MAX_AGE_MS = 30_000; // 30 seconds

let mutationDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const observer = new MutationObserver(() => {
  if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer);
  mutationDebounceTimer = setTimeout(() => {
    const result = collectImages();
    cachedImages = result.images;
    cacheTimestamp = Date.now();
  }, 500); // 500ms debounce
});

// Start observing after initial page load
const startObserver = () => {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'data-src', 'data-lazy', 'data-original'],
  });
  // Run initial collection
  const result = collectImages();
  cachedImages = result.images;
  cacheTimestamp = Date.now();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(startObserver, 800));
} else {
  setTimeout(startObserver, 800);
}
```

Notes:

- 800ms delay after DOMContentLoaded gives most SPA frameworks time to render initial content
- 500ms debounce prevents excessive rescans during rapid DOM changes (infinite scroll)
- `attributeFilter` limits observer to image-related attributes only — avoids performance hit from class/style changes
- Observer is global in the content script module — it runs for the lifetime of the tab

**Update `GRAB_IMAGES` handler to use cache when fresh:**

```ts
if (message.action === MessageActionType.GRAB_IMAGES) {
  const isCacheFresh = Date.now() - cacheTimestamp < CACHE_MAX_AGE_MS && cachedImages.length > 0;
  if (isCacheFresh) {
    sendResponse({ images: cachedImages, pageUrl: window.location.href });
  } else {
    const result = collectImages();
    cachedImages = result.images;
    cacheTimestamp = Date.now();
    sendResponse(result);
  }
  return true;
}
```

**`RESCAN_IMAGES` always bypasses cache:**

```ts
if (message.action === MessageActionType.RESCAN_IMAGES) {
  const result = collectImages();
  cachedImages = result.images;
  cacheTimestamp = Date.now();
  sendResponse(result);
  return true;
}
```

### Step 5 — Add "Rescan" button to the Page toolbar

**File**: `src/components/Page/components/Toolbar/index.tsx`

Add a refresh/rescan button next to the existing toolbar actions.

Behavior:

1. User clicks "Rescan page"
2. Popup sends `RESCAN_IMAGES` to content script of the originating tab
3. Response merges with (or replaces) the current image list
4. Show a snackbar: "Found N images" (or "No new images found")

**Note on tab identity**: The Page component (`page.html`) is a separate tab — it does not have a reference to the original tab that was being scraped. The tab ID must be stored in the `imageStore` alongside `pageUrl`.

Update `useImageStore` in `src/store/imageStore.ts` and `src/store/types.ts`:

- Add `sourceTabId: number | null` to `ImageState`
- Populate it in the Popup before calling `openImagesPage`:
  ```ts
  // In Popup handleGrabImages, after getting tab:
  useImageStore.getState().setSourceTabId(tab.id);
  ```
- Pass it in `PageImagesPayload`:
  ```ts
  export interface PageImagesPayload {
    images: ImageData[];
    pageUrl: string;
    sourceTabId: number; // add this
  }
  ```

**Rescan handler in Page component** (`src/components/Page/index.tsx` or Toolbar):

```ts
const handleRescan = useCallback(async () => {
  const sourceTabId = useImageStore.getState().sourceTabId;
  if (!sourceTabId) return;

  setIsRescanning(true);
  try {
    const response = await sendMessageToContentScript<GrabImagesResponse>(
      sourceTabId,
      { action: MessageActionType.RESCAN_IMAGES },
      10000,
    );
    if (response?.images) {
      // Merge: add new images not already in the list (by src)
      const existingSrcs = new Set(useImageStore.getState().images.map((img) => img.src));
      const newImages = response.images.filter((img) => !existingSrcs.has(img.src));
      if (newImages.length > 0) {
        useImageStore.getState().setImages([...useImageStore.getState().images, ...newImages]);
        showNotification(`Found ${newImages.length} new image(s)`);
      } else {
        showNotification('No new images found');
      }
    }
  } finally {
    setIsRescanning(false);
  }
}, []);
```

Add i18n keys: `rescan_button`, `rescan_found_new` (with `{count}` param), `rescan_no_new`.

Button should show a spinner while `isRescanning`.

## Tests to Write

### `src/contentScript/__tests__/content-script-utils.test.ts`

Test the extracted `collectImages()` function logic (extract to separate testable module if needed):

```ts
describe('collectImages', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns empty array when no images', () => {
    const result = collectImages();
    expect(result.images).toHaveLength(0);
  });

  it('collects img elements', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/photo.jpg';
    Object.defineProperty(img, 'naturalWidth', { value: 500 });
    Object.defineProperty(img, 'naturalHeight', { value: 400 });
    document.body.appendChild(img);

    const result = collectImages();
    expect(result.images).toHaveLength(1);
    expect(result.images[0].src).toBe('https://example.com/photo.jpg');
  });

  it('deduplicates images with same src', () => {
    for (let i = 0; i < 3; i++) {
      const img = document.createElement('img');
      img.src = 'https://example.com/photo.jpg';
      Object.defineProperty(img, 'naturalWidth', { value: 100 });
      Object.defineProperty(img, 'naturalHeight', { value: 100 });
      document.body.appendChild(img);
    }
    const result = collectImages();
    expect(result.images).toHaveLength(1);
  });

  it('filters images smaller than MIN_SIZE_PX', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/icon.png';
    Object.defineProperty(img, 'naturalWidth', { value: 5 });
    Object.defineProperty(img, 'naturalHeight', { value: 5 });
    document.body.appendChild(img);

    const result = collectImages();
    expect(result.images).toHaveLength(0);
  });
});
```

Note: Testing MutationObserver behavior in Vitest/jsdom is complex — skip observer timing tests.
The observer logic is simple enough that manual E2E testing is sufficient.

### `src/store/__tests__/imageStore.test.ts`

```ts
describe('imageStore sourceTabId', () => {
  it('stores and retrieves sourceTabId', () => {
    useImageStore.getState().setSourceTabId(42);
    expect(useImageStore.getState().sourceTabId).toBe(42);
  });
});
```

## Manual E2E Checklist

| Scenario                           | Steps                                       | Expected                          |
| ---------------------------------- | ------------------------------------------- | --------------------------------- |
| React SPA (e.g., create-react-app) | Open app, wait 2s, click extension          | Images from rendered DOM detected |
| Infinite scroll                    | Open page, scroll to bottom, click "Rescan" | New images added to existing list |
| Image count improves               | Compare count before/after on SPA           | Count >= before                   |
| "Rescan" spinner                   | Click rescan on slow page                   | Button shows loading state        |
| Rescan on tab that was closed      | Close original tab, click rescan            | Graceful error / no crash         |

## Acceptance Criteria

- [ ] `RESCAN_IMAGES` message type exists in `MessageActionType`
- [ ] `collectImages()` is an extracted testable function
- [ ] MutationObserver starts after 800ms delay with 500ms debounce
- [ ] Cache is used for `GRAB_IMAGES` when < 30s old
- [ ] "Rescan" button appears in the Page toolbar
- [ ] Clicking "Rescan" sends `RESCAN_IMAGES` to correct tab
- [ ] New images are merged into existing list without clearing selections
- [ ] `sourceTabId` is stored in `imageStore` and passed via `PageImagesPayload`
- [ ] All new unit tests pass (`yarn test`)
- [ ] `yarn build` passes

## Explicitly Out of Scope

- Do NOT add automatic background rescanning (polling) — too aggressive, drains battery
- Do NOT implement "wait for network idle" — no Chrome extension API for this; approximated by the 800ms delay
- Do NOT handle iframe images — cross-origin restriction
- Do NOT animate or sort newly added images — keep the merge simple (append to end)

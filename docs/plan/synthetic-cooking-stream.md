# Plan: Fix Content Script Performance Issues

## Context

Reviews show a clear pattern: many users uninstall because of browser/PC slowdowns and memory consumption. One 1-star review explicitly identifies a conflict with Baidu.com (slow load + Chrome crash). I confirmed the issue: baidu.com took 4.7 seconds to load with the extension active — domInteractive was only 879ms (fast), meaning the extension overhead adds to the async JS phase.

The code analysis found two concrete root causes in `src/contentScript/content-script.ts`:

1. **MutationObserver** with `subtree: true` **+ `attributes: true`** runs on ALL pages forever. Even with `attributeFilter`, Chrome evaluates every DOM mutation against the filter — on dynamic pages like Baidu (live search, hot news tickers), this fires hundreds of times per second. The callback only sets `cacheTimestamp = 0`, so the overhead gives zero benefit until the user actually opens the popup.

2. **Unbounded memory growth**: `perfObserverSeenUrls` (Set) and `perfObserverCache` (array) accumulate indefinitely until the user drains the cache by opening the popup. On infinite-scroll pages or long sessions, these can grow to thousands of entries.

## Files to Modify

- `src/contentScript/content-script.ts` — main content script

## Changes

### 1. Remove `attributes: true` from MutationObserver (lines 104–111)

**Before:**
```ts
mutationObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['src', 'srcset', 'data-src', 'data-lazy', 'data-original'],
});
```

**After:**
```ts
mutationObserver.observe(document.body, {
  childList: true,
  subtree: true,
});
```

**Why safe**: Attribute changes on existing `<img>` elements (lazy loading via `src` swap) are already covered by the `PerformanceObserver` — when a new image URL loads, it appears in performance entries regardless of how it was triggered. `childList` still catches new `<img>` elements being added.

### 2. Add max-size bounds to perf observer caches (lines 44–63)

Add a constant and guard inside the observer callback:

```ts
const PERF_CACHE_MAX = 500;

// inside the observeNewPerformanceEntries callback:
const unseen = newUrls.filter((url) => !perfObserverSeenUrls.has(url));
if (unseen.length === 0) return;
// Stop accumulating if over limit — user would need to rescan manually
if (perfObserverSeenUrls.size >= PERF_CACHE_MAX) return;
for (const url of unseen) perfObserverSeenUrls.add(url);
performanceUrlsToImageData(unseen).then((newImages) => {
  if (perfObserverCache.length < PERF_CACHE_MAX) {
    perfObserverCache = [...perfObserverCache, ...newImages];
  }
});
```

`PERF_CACHE_MAX = 500` is generous enough for normal pages and infinite-scroll sites while capping memory at ~100KB per tab.

## What This Does NOT Change

- PerformanceObserver stays on (it's lightweight, fires only on resource load completion, already filtered by image extension)
- MutationObserver still starts 800ms after DOMContentLoaded (keeps existing lazy-load detection for newly added `<img>` nodes)
- No changes to `collectImages`, enhance pipeline, or background

## Verification

1. `npm run test` — existing unit tests should pass
2. Manual: open a dynamic page (Baidu, Twitter, Google) with DevTools Performance tab — record 10 seconds, check CPU flame graph shows no repeated small callbacks from the content script
3. Manual: open a page with lazy-loaded images (e.g. any infinite scroll) → open popup → images appear correctly
4. Memory: open a long infinite-scroll page, check Task Manager → extension tab memory should stay stable over time

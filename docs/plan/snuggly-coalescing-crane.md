# Plan: Observers off by default, with opt-in escape hatch

## Context

Reviews from the last 30 days show a pattern of uninstalls citing browser slowdowns and memory pressure (e.g. `pożera pamięć`, `Chrome started to work very slow`, `slowing my pc`). One 1-star review blames a conflict with `baidu.com`. Measurements I ran on baidu.com in this session:

| Scenario                                     | `domInteractive` |   `loadEvent` | Renderer                             |
| -------------------------------------------- | ---------------: | ------------: | ------------------------------------ |
| **With extension** (current `release` build) |    **51,828 ms** | **53,940 ms** | repeatedly froze (45 s CDP timeouts) |
| Without extension (cold)                     |         1,383 ms |      3,498 ms | responsive                           |
| **Without extension** (warm cache)           |       **435 ms** |    **806 ms** | responsive                           |

The extension adds ~50 s to baidu.com. The overhead sits in the async JS phase (`domInteractive` inflated 100×), matching an always-on observer hypothesis.

User-critical constraint: **image search quality must not regress**. A lot of tuning went into collection across many sites and it cannot backslide. The user explicitly asked for an escape hatch — hide observers behind an experimental opt-in in Options, so advanced users can re-enable them if they find pages where images go missing.

The previous plan at `docs/plan/synthetic-cooking-stream.md` (tactical: drop `attributes: true`, cap caches at 500) is correct but doesn't address the root cost on unused tabs, and has no escape hatch.

## Approach

At page load the content script is minimal (message listener + a Performance API buffer bump). Observers are guarded by a new `enableLegacyObservers` setting, **default `false`**. All users get the perf fix automatically; power users who hit a regression can toggle the setting in Options.

### How it works end-to-end

1. **On page load** (content script injected at `document_end` as today):

   - Install `chrome.runtime.onMessage` listener (unchanged).
   - Call `performance.setResourceTimingBufferSize?.(500)` so the native buffer doesn't trim old entries on heavy pages. Cheap, synchronous, fires before anything heavy loads.
   - Read `enableLegacyObservers` from storage asynchronously (reuse `getSettingFromStorage`). When it resolves:
     - If `false` (default): stop. No observers, no DOM traversal, no 800 ms timer.
     - If `true`: run the existing `initPerfObserver` + `startMutationObserver` logic (unchanged).
   - Storage lookup misses / errors → treat as `false`.

2. **When user opens the extension (first `GRAB_IMAGES`)**:

   - `collectImages` runs unchanged (DOM + background-image + SVG + performance-API passes).
   - `scanPerformanceEntries` reads `performance.getEntriesByType('resource')` synchronously. The browser has been populating this buffer passively since navigation start — same data the old PerformanceObserver accumulates, just read at scan time.
   - `isCanvasHeavyApp()` still evaluated here (moves from page-load to scan-time when observers are off; still cheap).
   - The observer-only path (`drainPerfObserverCache`) is only used when `enableLegacyObservers` is on.

3. **User presses Rescan**: another `collectImages`. Native buffer still fills up from the browser, so newly loaded images (infinite scroll etc.) are included. Cache TTL stays at 30 s.

4. **Toggling the setting**: the tooltip notes that it takes effect on the next page reload (content script init reads storage once at load). Acceptable — this is an edge-case knob.

### Why image search quality is preserved (default path)

- DOM traversal in `collectImages` (`src/contentScript/collectImages.ts:102–260`): unchanged.
- Strategy A/B/C/D full-size resolution: unchanged.
- SVG `data-src` collection: unchanged.
- Background-image scan (`scanBackgroundImages`): unchanged.
- `scanPerformanceEntries` result: same as today, with slightly _more_ history retained thanks to the 500-entry buffer bump.
- Canvas/Flutter XHR-as-image detection (`isCanvasHeavyApp`): unchanged, just evaluated at first scan.
- The `perfObserverCache` drain block in `collectImages` stays in the code path — it just becomes a no-op when `drainPerfObserverCache` returns `[]`, which happens when observers are off.

### Why the opt-in escape hatch is worth the small extra code

- If we missed a regression case (e.g. a page that loads >500 image resources before the user opens the popup, or a page where DOM churn hides images between cache refreshes), the user has a knob to flip instead of uninstalling.
- Framed as experimental / high resource usage / only enable if images are missing — matches the user's proposed wording. Most users will never see it; discoverability is intentionally low.
- Cost is one boolean setting + one conditional branch. No new code paths in the hot scan logic.

## Files to modify

### Content script & scanner

- `src/contentScript/content-script.ts`
  - Add `performance.setResourceTimingBufferSize?.(500)` at top, guarded.
  - Keep `perfObserverCache`, `perfObserverSeenUrls`, `isCanvasApp`, `initPerfObserver`, `drainPerfObserverCache`, `mutationObserver`, `startMutationObserver` in code — but gate them behind an async `getSettingFromStorage('enableLegacyObservers', false)` check. Move their wiring into a single `maybeEnableLegacyObservers()` function called once at module load.
  - `drainPerfObserverCache` always returns `perfObserverCache`; when observers are off, the array stays empty, so `collectImages` treats it as a no-op without any extra branching on the caller side.
  - `refreshCache` reads `isCanvasApp` via a lazy getter: if observers are off, compute `isCanvasHeavyApp()` on first call and cache for the tab's lifetime.
- No changes needed in `src/contentScript/collectImages.ts` (the drain block degrades to no-op naturally).
- No changes needed in `src/utils/performanceImageScanner.ts`.

### Settings plumbing

- `src/utils/constants.ts` — add `enableLegacyObservers: false` to `DEFAULT_OPTIONS` (around line 91).
- `src/store/types.ts` — add `enableLegacyObservers: boolean` to `DownloadOptions` and a `setEnableLegacyObservers(v: boolean): void` to the store actions type.
- `src/store/settingsStore.ts` — add the field to the Zustand state, the setter, and include it in the `persist` whitelist (around line 24).
- `src/utils/constants.ts` (near `maxBgImages`) — no schema changes beyond default.

### Options UI

- `src/components/OptionsPage/components/AdvancedOptions/index.tsx` — add a new `FormControlLabel` / `Switch` for "Enable legacy image observers (experimental)". Wire to `useSettingsStore` via `enableLegacyObservers` + `setEnableLegacyObservers`. Add a sibling `InfoTooltip` with the warning copy.
- `public/_locales/en/messages.json` (and other locales if they have parity) — add `enable_legacy_observers` + `enable_legacy_observers_info` strings. English copy (per user wording): `"Enable legacy page observers (experimental)"` and `"High CPU and memory usage. Only enable if images are missing from some pages. Takes effect on the next page reload."` User will translate to other locales himself.

## Tests to add / update

New tests in `src/__tests__/contentScriptInit.test.ts` (new file):

1. **Default: buffer bump is called at load time**. Spy on `performance.setResourceTimingBufferSize`, import the module fresh (vi.resetModules), expect it was called with `500`.
2. **Default: no observers are created at load time**. Spy on `global.MutationObserver` and `global.PerformanceObserver`, mock storage to return `enableLegacyObservers: false` (or nothing), import the module, `await` microtasks, expect neither constructor was invoked.
3. **Opt-in: observers ARE created when setting is on**. Mock storage to return `enableLegacyObservers: true`, import the module, `await` microtasks (and the 800 ms timer via `vi.useFakeTimers` + `advanceTimersByTime`), expect both constructors were invoked.
4. **`HEALTH_CHECK` responds immediately after module import**, regardless of setting state.

Behavioral test in `src/__tests__/collectImages.test.ts` (extend existing file): 5. **Images loaded before first scan still appear without observers**. `noopOptions.drainPerfObserverCache` returns `[]`; mock `scanPerformanceEntries` to return URLs representing resources loaded during page load; add a DOM `<img>`; run `collectImages`; expect both sources merged into output.

Existing tests — no updates expected since `CollectImagesOptions` shape is unchanged.

## Verification (manual, done BY ME after the edits are applied in the next session)

Run after the edits:

1. `npm run test` — all unit tests green, new tests from the list above included.
2. `npm run build` — clean build, no type errors.
3. Reload the unpacked build in Chrome.
4. **Final baidu.com check** (requested by user):
   - Visit `https://www.baidu.com`, reload 2–3 times with the extension enabled.
   - Measure via `performance.getEntriesByType('navigation')[0]`: `domInteractive`, `loadEventEnd`. Baselines from this session — with old extension: `domInteractive = 51,828 ms`, `loadEvent = 53,940 ms`, renderer intermittently frozen; without extension (warm cache): `domInteractive = 435 ms`, `loadEvent = 806 ms`. Target after fix: within ~100 ms of the no-extension baseline.
   - Open DevTools Performance tab, record 10 s on baidu.com: verify no recurring callbacks attributable to the extension (no MutationObserver, no PerformanceObserver).
5. **Image-search regression sweep** (with the default setting — observers OFF). Has to look equivalent to the current release on each:
   - Pinterest (infinite-scroll, thousands of thumbs) — open popup, note count. Scroll down 5 screens, press Rescan, note new count.
   - Google Images — count + Rescan.
   - Twitter / X timeline — count + Rescan.
   - A Flutter/canvas app the user has in mind — count + Rescan.
   - A listing site with OG-enhanced links (listing → detail) — verify `linkedPageUrl` enhancement still upgrades images.
   - Any one site where the user previously struggled with image collection — confirm parity.
6. **Opt-in path smoke test**: turn on `enableLegacyObservers` in Options, reload a Pinterest tab, confirm the observers are back (DevTools shows PerformanceObserver activity), image count ≥ default-path count. Toggle off, reload, confirm observers gone.
7. **Memory soak**: open ~10 tabs including baidu and Pinterest, leave 30 min with the default setting. `chrome://extensions` → service-worker memory and per-tab memory should stay flat.

## Non-goals

- Not removing `content_scripts` from the manifest (true lazy injection). That tradeoff — ~200–500 ms extra on first open, and potential buffer-trim loss before injection — is worse for user-visible search quality.
- Not touching `background/index.ts`, `enhanceImages`, messaging, or any other UI beyond the one Options toggle.
- Not migrating existing users — default is `false` for everyone. Anyone who was relying on observers implicitly will have to flip the toggle if they hit a regression (intended behavior).

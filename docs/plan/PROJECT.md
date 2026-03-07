# Image Downloader — Project Architecture Reference

> Context file for clean-session prompts. Paste this when starting a new task.

## Stack

| Layer          | Technology                                                                      |
| -------------- | ------------------------------------------------------------------------------- |
| Build          | Vite 3 + `@crxjs/vite-plugin` (handles manifest + entry points automatically)   |
| Language       | TypeScript 5, React 18                                                          |
| State          | Zustand 5, persisted via `chromeStorage` adapter (`src/store/chromeStorage.ts`) |
| UI             | MUI 5 + Emotion, notistack (snackbars)                                          |
| Error tracking | Sentry (`@sentry/react`)                                                        |
| Monetization   | appbox.space paywall, wallId 711                                                |
| Extension type | Chrome MV3, service worker background                                           |

## Entry Points

| File                                  | Description                                                                                                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/background/index.ts`             | Service worker. CORS bypass via `declarativeNetRequest`. Download filename handling. Paywall messaging relay. **Cannot use path aliases — use relative imports only.** |
| `src/contentScript/content-script.ts` | Injected into all pages. Scrapes DOM images on `GRAB_IMAGES` message. Also handles `FETCH_IMAGE_AS_DATA_URL` and `HEALTH_CHECK`.                                       |
| `src/containers/popup/index.tsx`      | `popup.html` — single button that triggers image grab and opens `page.html`                                                                                            |
| `src/containers/page/index.tsx`       | `page.html` — full-tab image viewer/downloader                                                                                                                         |
| `src/containers/options/index.tsx`    | `options.html` — settings page                                                                                                                                         |

## Path Aliases

```
@utils   → src/utils
@components → src/components
@types   → src/types
@store   → src/store
@theme   → src/theme
```

## Key Source Files

```
src/
  background/index.ts              Service worker (CORS, downloads, paywall)
  contentScript/content-script.ts  DOM image scraper
  store/
    imageStore.ts                  Images list + filter/sort state (not persisted)
    settingsStore.ts               Download settings (persisted to chrome.storage.local)
    ratingStore.ts                 Rating reminder state (persisted)
    chromeStorage.ts               Zustand storage adapter for chrome.storage.local
    fallbackStorage.ts             Falls back to localStorage when chrome.storage unavailable
  utils/
    constants.ts                   All enums, StorageKeys, PlaceholderImages, timeouts
    downloadHelpers.ts             sanitizeFileName, downloadImage (3-level fallback)
    downloadWithConversion.ts      downloadImageWithConversion, downloadImagesWithConversion
    imageOperations.ts             useImageOperations hook (handleDownload, handleCopyUrl)
    contentScriptUtils.ts          sendMessageToContentScript (with auto-inject retry)
    domImageUtils.ts               findImageInDOM, waitForImageLoad, getImageSrcFromDOM
    imageUtils.ts                  blobToDataUrl, getFileExtension, getQualityFromDimensions
    imageConverter.ts              Canvas-based format conversion
    imageFormats.ts                shouldConvertImage, VALID_IMAGE_EXTENSIONS
    fileUtils.ts                   getSmartFileName
    errorHandlers.ts               handleError (wraps Sentry)
    messaging.ts                   sendImagesToTab
    monetization.ts                maybeOpenPaywallOn11thClick, recordSuccessfulDownloadPageUrl
    zipArchive.ts                  createAndDownloadZipArchive (jszip)
  types/index.ts                   All shared types and enums (MessageActionType, ImageData, etc.)
```

## Message Flow

```
Popup
  → chrome.tabs.sendMessage(GRAB_IMAGES)
  → ContentScript: reads document.getElementsByTagName('img')
  → returns ImageData[]

Popup/Page
  → chrome.runtime.sendMessage({ msg: FETCH_IMAGE, url })
  → Background: fetch with declarativeNetRequest referrer headers
  → returns { dataUrl } or { error }

Page
  → chrome.downloads.download({ url: dataUrl/src, filename })
  → Background: onDeterminingFilename applies folder + rename pattern

Background
  → chrome.runtime.sendMessage(REGISTER_FILENAME, { downloadId, filename })
  → stored in downloadFilenamesMap for onDeterminingFilename handler
```

## Download Flow (3-level fallback in `downloadHelpers.ts:downloadImage`)

1. `chrome.downloads.download({ url: originalSrc })` — direct download
2. If fails → retry with generic `image_<timestamp>.ext` filename
3. If fails → `chrome.runtime.sendMessage(FETCH_IMAGE)` → background fetches as dataUrl →
   `chrome.downloads.download({ url: dataUrl })`
4. If all fail → throws Error (caught in `useImageOperations.handleDownload`, shows error snackbar)

## Detected Gaps (from code review, relevant to retention plan)

1. **Image detection** (`content-script.ts`): Only reads `img.src`. Missing `srcset`, `data-src`, `data-lazy`,
   `data-original`, `picture > source`, CSS `background-image`. Users report thumbnails instead of originals.

2. **SPA/Dynamic content** (`content-script.ts`): No `MutationObserver`, no rescan, no initial scan delay. Fails on
   React/Angular SPAs and infinite scroll.

3. **Bulk download errors** (`downloadWithConversion.ts:downloadImagesWithConversion`): Individual download failures are
   silently swallowed — `catch {}` block does nothing. No user feedback on partial failures.

4. **False success tracking**: `useRatingStore.setHasSuccessfulDownload(true)` is called even in the final fallback path
   of `downloadImageWithConversion`, without confirming the download actually completed.

5. **No debug logging**: No way to export download error state for debugging user-reported issues.

6. **No tests**: Zero test files in `src/`. No test runner configured.

## Commands

```bash
yarn dev    # Dev build with HMR
yarn build  # Production build → build/
yarn lint   # ESLint
yarn fmt    # Prettier
yarn zip    # build + zip → package/
```

Load for testing: `chrome://extensions` → Developer mode → Load unpacked → `build/`

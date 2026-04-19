# Save image as JPG/PNG/WebP — context-menu submenu

## Context

Mirror the screenshot from `~/Downloads/unnamed.webp`: replace the existing single `Save This Image` context-menu item with a parent submenu `Save image as JPG/PNG/WebP` that has three children — `Save as JPG…`, `Save as PNG…`, `Save as WebP…`. Each child re-encodes the right-clicked image into the chosen format and triggers a download via the extension's existing pipeline (so rename pattern / domain folder still apply).

Also: when we previously added the context menu, we never mentioned it in `public/_locales/*/messages.json → storeDesc`. Add a short paragraph about the new submenu (and the overall context-menu support) to all 52 locale `storeDesc` strings.

The extension already has all primitives needed: canvas-based encoder (`src/utils/imageConverter.ts`), CORS-bypassing fetch proxy (`FETCH_IMAGE` in background), filename + extension utilities. Nothing new architecturally — we wire existing pieces to a new menu.

---

## Final menu structure

Flat — three format items are direct siblings of `Open Image Downloader` (no nested parent). Chrome auto-groups them under the extension name regardless, so an extra `Save as JPG/PNG/WebP` parent only adds a useless click.

| ID                                | Title (i18n key)                  | Contexts    | Parent |
| --------------------------------- | --------------------------------- | ----------- | ------ |
| `open-image-downloader` *(kept)*  | `context_menu_open`               | `['all']`   | —      |
| `save-as-jpg` *(new)*             | `context_menu_save_as_jpg`        | `['image']` | —      |
| `save-as-png` *(new)*             | `context_menu_save_as_png`        | `['image']` | —      |
| `save-as-webp` *(new)*            | `context_menu_save_as_webp`       | `['image']` | —      |

`save-this-image` (id + handler + locale key `context_menu_save_image`) is removed — Chrome's native "Save image as…" already covers no-conversion saves, and the three new items replace its role.

User sees, when right-clicking an image:
```
Image Downloader ▶
   Open Image Downloader
   Save as JPG…
   Save as PNG…
   Save as WebP…
```

---

## Files to modify

### 1. `src/utils/constants.ts` (~line 265)
Replace `ContextMenuIds`:
```ts
export const ContextMenuIds = {
  OPEN_IMAGE_DOWNLOADER: 'open-image-downloader',
  SAVE_AS_JPG: 'save-as-jpg',
  SAVE_AS_PNG: 'save-as-png',
  SAVE_AS_WEBP: 'save-as-webp',
} as const;
```
Add a `CONTEXT_MENU_FORMAT_BY_ID` map for the click handler:
```ts
export const CONTEXT_MENU_FORMAT_BY_ID: Record<string, 'jpeg' | 'png' | 'webp'> = {
  [ContextMenuIds.SAVE_AS_JPG]: 'jpeg',
  [ContextMenuIds.SAVE_AS_PNG]: 'png',
  [ContextMenuIds.SAVE_AS_WEBP]: 'webp',
};
```

### 2. `src/types/index.ts`
Add a new message type for the background → content-script call:
```ts
CONVERT_AND_DOWNLOAD_IMAGE = 'convertAndDownloadImage',

export interface ConvertAndDownloadImageMessage {
  action: MessageActionType.CONVERT_AND_DOWNLOAD_IMAGE;
  imageUrl: string;        // info.srcUrl
  targetFormat: 'jpeg' | 'png' | 'webp';
}
export interface ConvertAndDownloadImageResponse {
  dataUrl?: string;
  error?: string;
}
```

### 3. `src/utils/imageConverter.ts` (extend, do not replace)
Add a sibling helper that does NOT require an existing DOM element — needed when the right-clicked image isn't reachable via `querySelector` (e.g. CSS background, shadow DOM, or canvas-tainted):
```ts
export const convertImageUrlToFormat = async (
  url: string,
  targetFormat: 'jpeg' | 'png' | 'webp',
  fetchAsDataUrl: (u: string) => Promise<string>, // injected: routes through background FETCH_IMAGE
): Promise<string>
```
Implementation: try `new Image()` with `crossOrigin = 'anonymous'` first; on load error / canvas taint, call `fetchAsDataUrl(url)` (which proxies through background), load that data URL into a fresh Image, and run the existing canvas→`toDataURL(mime, quality)` path. Quality defaults from `FORMAT_QUALITY` (already in `imageFormats.ts`).

### 4. `src/contentScript/content-script.ts`
Add a listener for `CONVERT_AND_DOWNLOAD_IMAGE`:
1. Find an existing `<img>` whose `currentSrc === imageUrl` or `src === imageUrl`. If found → try `convertImageElementToFormat(img, targetFormat)`.
2. On miss / SecurityError → call `convertImageUrlToFormat(imageUrl, targetFormat, fetchViaBackground)`, where `fetchViaBackground` does `chrome.runtime.sendMessage({ msg: FETCH_IMAGE, url })` and returns `response.dataUrl`.
3. `sendResponse({ dataUrl })` or `{ error }`. Return `true` to keep the channel open.

### 5. `src/background/index.ts`
- **`setupContextMenus()` (lines 57–70)**: replace the `SAVE_THIS_IMAGE` `create()` call with three flat sibling items (no `parentId`):
  ```ts
  chrome.contextMenus.create({
    id: ContextMenuIds.SAVE_AS_JPG,
    title: chrome.i18n.getMessage('context_menu_save_as_jpg') || 'Save as JPG…',
    contexts: ['image'],
  });
  // …PNG, WebP same shape
  ```
- **Click handler (lines 607–633)**: drop the `SAVE_THIS_IMAGE` branch. Add a single branch that handles all three format ids via `CONTEXT_MENU_FORMAT_BY_ID`:
  ```ts
  const targetFormat = CONTEXT_MENU_FORMAT_BY_ID[String(info.menuItemId)];
  if (targetFormat) {
    if (!tab?.id || !info.srcUrl) return;
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: MessageActionType.CONVERT_AND_DOWNLOAD_IMAGE,
      imageUrl: info.srcUrl,
      targetFormat,
    });
    if (!response?.dataUrl) {
      handleError(new Error(response?.error || 'conversion failed'), {
        extra: { source: 'contextMenu.saveAs', targetFormat, srcUrl: info.srcUrl },
      });
      return;
    }
    const baseName = getFileNameFromUrl(info.srcUrl) || `image_${Date.now()}`;
    const filename = updateFileExtension(baseName, targetFormat);
    const pageDomain = tab.url ? extractDomain(tab.url) : '';
    const downloadId = await chrome.downloads.download({
      url: response.dataUrl,
      filename,
    });
    if (downloadId) registerDownloadMeta(downloadId, filename, pageDomain);
  }
  ```
  Reuses `updateFileExtension` from `src/utils/imageFormats.ts`, `getFileNameFromUrl` from `src/utils/fileUtils.ts`, `extractDomain` + `registerDownloadMeta` already in this file. The `onDeterminingFilename` listener (line 677) then applies rename pattern + organize-by-domain like every other extension download.

### 6. `public/_locales/*/messages.json` (52 locales)
Per locale:
- **Add** `context_menu_save_as_jpg`, `context_menu_save_as_png`, `context_menu_save_as_webp`.
- **Remove** the now-unused `context_menu_save_image` key.
- **Append** a paragraph to `storeDesc` describing the right-click context menu (both `Open Image Downloader` and the new format-conversion submenu). The paragraph already-existing locale text style — for example, English version after the "Advanced Save Options" section:
  > 🖱️ Right-Click Context Menu
  > Right-click any image to open the Image Downloader or save it instantly as JPG, PNG, or WebP — instant format conversion without leaving the page.

  Each translated `storeDesc` should get the equivalent paragraph in its language.

English values for the new keys:
| Key | Value |
| --- | --- |
| `context_menu_save_as_jpg`    | `Save as JPG…`               |
| `context_menu_save_as_png`    | `Save as PNG…`               |
| `context_menu_save_as_webp`   | `Save as WebP…`              |

---

## Reused utilities (do not re-implement)

- `convertImageElementToFormat()` — `src/utils/imageConverter.ts:15`
- `FORMAT_QUALITY`, `CANVAS_MIME_TYPES`, `updateFileExtension()`, `isOutputFormatSupported()` — `src/utils/imageFormats.ts`
- `FETCH_IMAGE` background handler with referrer rules — `src/background/index.ts:746`
- `getFileNameFromUrl()` — `src/utils/fileUtils.ts`
- `extractDomain()`, `ensureValidExtension()` — `src/utils/downloadHelpers.ts`
- `registerDownloadMeta()` + `onDeterminingFilename` pipeline — `src/background/index.ts:50,677`

---

## Verification

1. `npm run format` — Prettier + ESLint clean.
2. `npm run test` — unit tests pass; update any existing test that asserted on `SAVE_THIS_IMAGE` (search: `save-this-image`, `SAVE_THIS_IMAGE`, `context_menu_save_image`).
3. `npm run build` — type-check clean.
4. `npm run dev`, then in Chrome:
   - Right-click an image on a same-origin page (e.g. wikipedia.org) → submenu visible → "Save as PNG…" produces a `.png` file with correct bytes (verify in Preview / `file` cmd).
   - Repeat on a CORS-strict source (Instagram / pbs.twimg.com) → fallback path through background fetch works, file saves correctly.
   - Verify rename pattern + "organize by website" settings still apply to the converted file.
   - Right-click on non-image (text, link) → only "Open Image Downloader" appears under the extension group, no "Save as…" entries.
5. Spot-check `chrome://extensions` → Details → that the store description preview shows the new paragraph (English locale at minimum).

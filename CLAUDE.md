# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev          # Development build with HMR (loads as unpacked extension)
yarn build        # Production build → build/
yarn lint         # ESLint on src/
yarn fmt          # Prettier format
yarn format       # Prettier + ESLint autofix
yarn zip          # build + create distributable zip in package/
```

To load for testing: `chrome://extensions` → Enable Developer mode → Load unpacked → select `build/`.

## Architecture

Chrome Extension (Manifest V3) built with Vite + React 18 + TypeScript. Uses `@crxjs/vite-plugin` which handles the manifest and extension entry points automatically.

### Extension components

| File/Dir | Role |
|---|---|
| `src/background/index.ts` | Service worker — CORS bypass via `declarativeNetRequest`, download filename handling, paywall messaging |
| `src/contentScript/content-script.ts` | Injected into all pages — scrapes DOM images, relays fetch requests, health checks |
| `src/containers/popup/` | Entry point for `popup.html` (main extension popup) |
| `src/containers/page/` | Entry point for `page.html` (full-tab image viewer) |
| `src/containers/options/` | Entry point for `options.html` (settings page) |
| `src/components/` | Shared React UI components (Popup, Page, OptionsPage, etc.) |
| `src/store/` | Zustand stores persisted to `chrome.storage.local` |
| `src/manifest.ts` | Extension manifest (version pulled from `package.json`) |

### Message flow

1. **Popup** → `MessageActionType.GRAB_IMAGES` → **Content Script** scrapes `<img>` elements → returns `ImageData[]`
2. **Popup/Page** → `MessageActionType.FETCH_IMAGE` → **Background** proxies fetch (CORS bypass with `declarativeNetRequest` referrer rules) → returns data URL
3. **Background** → `chrome.downloads.onDeterminingFilename` → applies folder/rename pattern from settings

### State management

Three Zustand stores in `src/store/`, all persisted via `chromeStorage` adapter (falls back to `localStorage` via `fallbackStorage.ts`):
- `useImageStore` — current page's image list and selection state
- `useSettingsStore` — download options (folder, rename pattern, conversion, zip)
- `useRatingStore` — rating reminder state

Settings are also read directly from `chrome.storage.local` in the background script via `getSettings()` (cannot use Zustand there).

### Path aliases

Configured in `vite.config.ts` and `tsconfig.json`:
- `@utils` → `src/utils`
- `@components` → `src/components`
- `@types` → `src/types`
- `@store` → `src/store`
- `@theme` → `src/theme`

**Important:** `src/background/index.ts` cannot use these aliases — use relative imports only there (noted in comment at top of file).

### Key utilities

- `src/utils/downloadHelpers.ts` — filename sanitization, rename pattern application
- `src/utils/imageConverter.ts` / `downloadWithConversion.ts` — canvas-based image format conversion
- `src/utils/fileUtils.ts` — smart filename generation from image metadata
- `src/utils/messaging.ts` — typed wrappers for `chrome.runtime.sendMessage`
- `src/utils/monetization.ts` — paywall integration (appbox.space, wallId 711)
- `src/utils/errorHandlers.ts` — Sentry error capture helpers

### Localization

Uses Chrome's `__MSG_key__` system. String files live in `public/_locales/`. The manifest name/description use `__MSG_appName__` and `__MSG_shortDesc__`.

### Build output

Built to `build/`. Distributable zips are written to `package/` by `src/utils/zip.js` (uses gulp-zip).
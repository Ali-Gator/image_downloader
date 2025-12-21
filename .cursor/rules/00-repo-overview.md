## Repo overview (read this first)

### What this repo is
- **Type**: Chrome extension (Manifest V3) built with CRXJS + Vite + React 18.
- **UI**: React + MUI (Emotion `styled`) + notistack.
- **State**: Zustand (with persistence to `chrome.storage` via a fallback storage).
- **Error reporting**: centralized error handling + Sentry capture helper.

### Source-of-truth vs generated output
- **Do** edit code in `src/` and assets in `public/`.
- **Do not** hand-edit `build/` — it is a build output directory.

### Key entrypoints
- **Manifest**: `src/manifest.ts`
- **Background service worker**: `src/background/index.ts`
- **Content script**: `src/contentScript/content-script.ts`
- **React entrypoints**:
  - Popup: `src/containers/popup/index.tsx` → `src/components/Popup/`
  - Page: `src/containers/page/index.tsx` → `src/components/Page/`
  - Options: `src/containers/options/index.tsx` → `src/components/OptionsPage/`

### Path aliases (prefer these imports)
Configured in `tsconfig.json` and `vite.config.ts`:
- `@components/*` → `src/components/*`
- `@utils/*` → `src/utils/*`
- `@store/*` → `src/store/*`
- `@types/*` → `src/types/*`
- `@theme/*` → `src/theme/*`

### High-level data flow (mental model)
- Popup asks content script to collect images (`GRAB_IMAGES`).
- Content script scrapes/filters images and returns `GrabImagesResponse`.
- Popup opens `page.html` and sends images to the page tab.
- Background service worker handles privileged operations (downloads, CORS-sensitive fetch proxying, DNR session rules).

### When adding new functionality
- **Prefer** extending existing helpers (`@utils/*`) and types (`@types/*`) rather than introducing new ad-hoc logic.
- **Keep contracts explicit**: if a message crosses boundaries (popup/page/content/background), it should have a typed payload and a stable `MessageActionType`.



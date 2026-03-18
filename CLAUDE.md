# CLAUDE.md

## Behavioral rules

- Do not guess - ask questions
- All text: chat conversations, comments, plans, etc. - only in English

## What This Is

Chrome extension (Manifest V3) for downloading images from web pages. Built with CRXJS + Vite + React 18 + TypeScript +
MUI (Emotion styled) + Zustand.

## Commands (most useful)

```bash
npm run dev          # Dev server (HMR via CRXJS)
npm run build        # tsc && vite build → build/
npm run test         # Vitest (unit tests, single run)
npm run test:e2e     # Playwright e2e tests (headless: false)
npm run format       # Prettier + ESLint --fix
```

## Architecture

### MV3 Boundaries (popup → content script → background)

- **Popup/Page/Options** — React apps that initiate user actions
  - Popup: `src/containers/popup/` → `src/components/Popup/`
  - Page (full tab view): `src/containers/page/` → `src/components/Page/`
  - Options: `src/containers/options/` → `src/components/OptionsPage/`
- **Content script** (`src/contentScript/content-script.ts`) — runs in page context, scrapes/collects images, responds
  to messages like `GRAB_IMAGES`, `ENHANCE_IMAGES`, `HEALTH_CHECK`
- **Background service worker** (`src/background/index.ts`) — privileged APIs: downloads, CORS fetch proxying, DNR
  session rules, content script injection

### Data Flow

1. Popup sends `GRAB_IMAGES` to content script via `sendMessageToContentScript` (`src/utils/contentScriptUtils.ts`)
2. Content script runs `collectImages()` and returns images
3. Popup opens `page.html` and sends images via `sendImagesToTab` (`src/utils/messaging.ts`)
4. Background handles privileged fetch (`FETCH_IMAGE`), page meta fetching, and download filename determination

### Image Enhancement Pipeline

Content script has a full-size resolution system (`src/utils/fullSizeResolver.ts`) that upgrades thumbnail URLs to
full-size versions. The `ENHANCE_IMAGES` phase fetches linked pages via background (`FETCH_PAGE_META`) and extracts og:
image/twitter:image meta tags.

## Testing

- Unit tests use Vitest with jsdom environment. Setup file: `src/__tests__/setup.ts`.
- E2e tests use Playwright in `e2e/` directory with a custom extension fixture (`e2e/extension-fixture.ts`).
- Test files are colocated in `src/__tests__/`.

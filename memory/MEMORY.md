# Image Downloader Extension — Memory

## Project

Chrome MV3 extension (Vite + React 18 + TypeScript + Zustand + MUI). No tests yet.
Full architecture: `docs/plan/PROJECT.md`

## Retention Sprint Plan

`docs/plan/PLAN.md` — master plan. 7 tasks:

| Task     | File                                                                               | Status      |
|----------|------------------------------------------------------------------------------------|-------------|
| TASK-0   | `TASK-0-TEST-SETUP.md` — Vitest + Chrome API mocks                                 | Not started |
| TASK-0.5 | `TASK-0.5-SENTRY-FILTER.md` — Fix Sentry filter bypass (-70% noise)                | Not started |
| TASK-1   | `TASK-1-DOWNLOAD.md` — DownloadResult type, debugLogger, bulk error visibility     | Not started |
| TASK-2   | `TASK-2-IMAGE-DETECTION.md` — srcset/data-src/picture/bg-image + URL normalization | Not started |
| TASK-3   | `TASK-3-SPA.md` — MutationObserver, RESCAN_IMAGES, Rescan button                   | Not started |
| TASK-4   | `TASK-4-FLUTTER-CANVAS.md` — Performance API (always-on) + Flutter detection       | Not started |
| TASK-5   | `TASK-5-E2E-PLAYWRIGHT.md` — Playwright E2E with fixture page                      | Not started |

Order: 0 → 0.5 → 2 → 4 → 3 → 1 → 5

Supporting: `E2E-TEST-SITES.md` (manual test sites), `SENTRY-BASELINE.md` (5,732 errors/30d)

## Sentry

- Org: `blockdev`, Project: `id`, Region: `https://de.sentry.io`
- Baseline (2026-03-07): 5,732 errors/30d, 71% are noise (filter bypass bug)
- Key finding: `setupGlobalErrorHandlers()` and `ErrorBoundary` call `captureException` directly, bypassing
  `shouldIgnoreError` filter

## User Preferences

- Always use English in chat and code/files/comments
- SDD + TDD approach, no cowboy coding
- Ask when unclear, don't guess
- No over-engineering

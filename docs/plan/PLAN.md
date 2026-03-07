# Retention Sprint — Master Plan

## Context

1400 installs, ~650 uninstalls. User complaints cluster around:

- "Download doesn't start" / "Nothing happens"
- "Downloads thumbnails instead of originals"
- "Doesn't work on Instagram / React sites / infinite scroll"
- "Doesn't work on Flutter Web sites" (e.g. portocupecoy.com)

Goal: reduce technical uninstalls. Target: -50% "doesn't work" complaints.

## Gap Analysis (vs actual code)

| #   | Gap                                                                        | File(s)                                 | Severity |
| --- | -------------------------------------------------------------------------- | --------------------------------------- | -------- |
| G1  | Only `img.src` scraped — no srcset/data-src/picture/background-image       | `content-script.ts`                     | High     |
| G2  | No MutationObserver — SPAs / dynamic content missed                        | `content-script.ts`                     | High     |
| G3  | Bulk download errors silently swallowed, no user feedback                  | `downloadWithConversion.ts`             | High     |
| G4  | `setHasSuccessfulDownload(true)` called even when download unconfirmed     | `downloadWithConversion.ts`             | Medium   |
| G5  | No test infrastructure — regressions ship undetected                       | whole project                           | High     |
| G6  | No debug log / export — impossible to diagnose user-reported failures      | —                                       | Medium   |
| G7  | Flutter Web (CanvasKit) / canvas-heavy apps: zero `<img>` tags in DOM      | `content-script.ts`                     | High     |
| G8  | Sentry filter bypassed: 71% of errors are noise (3 code paths skip filter) | `errorHandlers.ts`, `sentryCapturer.ts` | High     |

## Task List

| Task                                  | File                                                                | What it solves         | Effort |
| ------------------------------------- | ------------------------------------------------------------------- | ---------------------- | ------ |
| [TASK-0](TASK-0-TEST-SETUP.md)        | Test infrastructure (Vitest)                                        | G5                     | ~1h    |
| [TASK-0.5](TASK-0.5-SENTRY-FILTER.md) | Fix Sentry filter bypass                                            | G8 (-70% Sentry noise) | ~15min |
| [TASK-1](TASK-1-DOWNLOAD.md)          | Download reliability & error visibility                             | G3, G4, G6             | ~3h    |
| [TASK-2](TASK-2-IMAGE-DETECTION.md)   | Better image source detection (srcset, data-src, picture, bg-image) | G1                     | ~3h    |
| [TASK-3](TASK-3-SPA.md)               | SPA / dynamic content support (MutationObserver, Rescan)            | G2                     | ~3h    |
| [TASK-4](TASK-4-FLUTTER-CANVAS.md)    | Flutter Web / canvas-rendered sites (Performance API)               | G7                     | ~2h    |
| [TASK-5](TASK-5-E2E-PLAYWRIGHT.md)    | Automated E2E tests (Playwright + fixture page)                     | Regression safety      | ~3h    |

**Recommended order**: TASK-0 → TASK-0.5 → TASK-2 → TASK-4 → TASK-3 → TASK-1 → TASK-5

Rationale:

- TASK-0 first (test infra — everything else needs it)
- TASK-0.5 next (quick win: 70% Sentry noise reduction, establishes clean baseline)
- TASK-2 and TASK-4 both touch `content-script.ts` image collection — do together to avoid conflicts
- TASK-3 builds on TASK-2's extracted `collectImages()` function
- TASK-1 is independent
- TASK-5 last (E2E tests verify all previous tasks work end-to-end against fixture page)

## Supporting Files

| File                                     | Purpose                                               |
| ---------------------------------------- | ----------------------------------------------------- |
| [PROJECT.md](PROJECT.md)                 | Architecture overview — paste into clean sessions     |
| [E2E-TEST-SITES.md](E2E-TEST-SITES.md)   | Manual test sites by category with checklist template |
| [SENTRY-BASELINE.md](SENTRY-BASELINE.md) | Pre-sprint Sentry error counts (5,732/month baseline) |

## How to Use This Plan

Each task file is self-contained:

1. Paste `PROJECT.md` + the specific `TASK-N.md` into a clean Claude Code session
2. Follow steps in order
3. Each step has acceptance criteria — verify before moving to the next
4. After completing each task, run the E2E checklist from `E2E-TEST-SITES.md`

## MCP Servers & Skills to Use

### During planning and debugging

- **`mcp__sentry__search_issues`** / **`mcp__sentry__get_issue_details`** — query real Sentry errors before writing code
- **`mcp__sentry__search_events`** — error counts for baseline. Org: `blockdev`, project: `id`, region: `https://de.sentry.io`
- **`mcp__ide__getDiagnostics`** — TypeScript errors without full build

### During implementation

- **`simplify` skill** (`/simplify`) — review added code for quality after each task

### For E2E tests (TASK-5)

- **`playwright-e2e-testing` skill** — `npx skills add bobmatnyc/claude-mpm-skills@playwright-e2e-testing -g -y`

### Sentry queries

```
# Total error count (30d):
mcp__sentry__search_events: org=blockdev, project=id, region=https://de.sentry.io
  query="count of all errors in the last 30 days"

# Errors by message:
mcp__sentry__search_events: org=blockdev, project=id, region=https://de.sentry.io
  query="count of errors grouped by error message in the last 30 days"
```

## Testing Strategy

| Layer             | Tool                            | What it covers                                 |
| ----------------- | ------------------------------- | ---------------------------------------------- |
| Unit tests        | Vitest + jsdom                  | Pure functions, store logic, image URL parsing |
| Integration tests | Vitest + Chrome API mocks       | Message handlers, download flow                |
| Auto E2E          | Playwright + local fixture page | Extension lifecycle, image detection pipeline  |
| Manual E2E        | Chrome + real sites             | Live site verification (see E2E-TEST-SITES.md) |

## Definition of Done (sprint-level)

- [ ] All tasks have passing unit tests (coverage >= 80% for changed files)
- [ ] `yarn test:e2e` passes against fixture page
- [ ] `yarn build` passes with no TypeScript errors
- [ ] `yarn lint` passes with no new warnings
- [ ] Manual E2E verified on all 7 categories from E2E-TEST-SITES.md
- [ ] Sentry error count drops from 5,732/month to < 2,000/month (measured 30 days after release)
- [ ] "Content script loader" errors drop from 1,264 to < 200

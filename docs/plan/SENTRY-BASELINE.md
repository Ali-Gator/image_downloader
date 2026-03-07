# Sentry Error Baseline — Pre-Sprint Snapshot

> Captured: 2026-03-07
> Organization: blockdev
> Project: `id` (Image Downloader)
> Region: de.sentry.io
> Period: last 30 days

## Summary

**Total errors (30d): 5,732**

## Errors by Message (top 30, sorted by count)

| # | Error Message | Count (30d) | Category |
|---|---|---|---|
| 1 | Blocked | 2,469 | Filtered (browser policy) |
| 2 | Cannot access a chrome:// URL | 654 | Filtered (chrome internal) |
| 3 | Could not load file: 'assets/content-script.ts-loader.212bb65e.js' | 481 | Content script injection |
| 4 | Could not load file: 'assets/content-script.ts-loader.edd30700.js' | 453 | Content script injection |
| 5 | Unknown error. | 431 | Unknown |
| 6 | Could not load file: 'content-script.js' | 330 | Content script injection |
| 7 | No SW | 234 | Filtered (paywall SDK) |
| 8 | Could not establish connection. Receiving end does not exist. | 163 | Content script messaging |
| 9 | Tabs cannot be edited right now (user may be dragging a tab). | 137 | Chrome API edge case |
| 10 | No current window | 106 | Chrome API edge case |
| 11 | Cannot access a chrome-extension:// URL of different extension | 74 | Filtered (cross-extension) |
| 12 | Cannot access contents of url "about:blank"... | 48 | Filtered (about:blank) |
| 13 | Frame with ID 0 is showing error page | 42 | Chrome API edge case |
| 14 | Cannot execute script on this site! | 24 | Content script injection |
| 15 | Frame with ID 0 was removed. | 18 | Chrome API edge case |
| 16 | Cannot access contents of url "chrome://newtab/"... | 9 | Filtered (chrome internal) |
| 17 | IO error: .../000001.dbtmp: Unable to create writable file | 8 | Chrome storage |
| 18 | IO error: .../MANIFEST-000001: Unable to create sequential file | 7 | Chrome storage |
| 19 | Cannot access contents of url "chrome-extension://...page.html"... | 6 | Self-injection bug |
| 20 | Tab creation is restricted in standalone sidebar mode. | 5 | Chrome API edge case |
| 21-30 | Various (IO errors, file:// access, terminal URLs, webstore) | ~25 total | Mixed |

## Analysis

### Already filtered in `SENTRY_FILTER_ERRORS` (constants.ts)

These errors should already be filtered by the existing error filter list but are still showing up.
Either the filter is not applied correctly, or these are new variants:

- "Blocked" (2,469) — should match `'blocked'`
- "Cannot access a chrome:// URL" (654) — should match `'cannot access a chrome://'`
- "No SW" (234) — should match `'no sw'`
- "Could not establish connection" (163) — should match `'could not establish connection'`
- "No current window" (106) — should match `'no current window'`
- "Unknown error." (431) — should match `'unknown error.'`
- "Cannot execute script on this site!" (24) — should match `'this page cannot be scripted'` (partial mismatch?)

**Action item**: Verify `SENTRY_FILTER_ERRORS` in `constants.ts` is actually being applied in `errorHandlers.ts`. These account for **4,081 of 5,732** errors (71%). If properly filtered, the real error count drops to ~1,651/month.

### Actionable Errors (our sprint should impact these)

| Error | Count | Sprint task |
|---|---|---|
| Could not load content-script.ts-loader (3 variants) | 1,264 | TASK-3 (content script re-injection) |
| Could not establish connection | 163 | TASK-3 (SPA, health check) |
| Cannot execute script on this site! | 24 | TASK-3 (unsupported page detection) |
| IO errors (storage) | 22 | Not in scope (Chrome bug) |

### Post-Sprint Target

| Metric | Before | Target After |
|---|---|---|
| Total errors (30d) | 5,732 | < 2,000 (fix Sentry filter + real fixes) |
| Content script loader errors | 1,264 | < 200 |
| "Could not establish connection" | 163 | < 50 |
| "Cannot execute script" | 24 | 0 (proper UX error message) |

## How to Re-Measure After Release

```
# Total count (30d):
mcp__sentry__search_events:
  org=blockdev, project=id, region=https://de.sentry.io
  query="count of all errors in the last 30 days"

# By message:
mcp__sentry__search_events:
  org=blockdev, project=id, region=https://de.sentry.io
  query="count of errors grouped by error message in the last 30 days"
  limit=30
```

Or visit: https://blockdev.sentry.io/issues/?project=4509021769039952

## Unresolved Issues Snapshot (as of 2026-03-07)

13 unresolved issues. Top by event count:

| Issue ID | Title | Events | Users |
|---|---|---|---|
| ID-R5 | Error: Blocked | 68 | 5 |
| ID-T | Error: No SW | 35 | 5 |
| ID-15 | Error: Cannot access a chrome:// URL | 24 | 3 |
| ID-9P | Error: Unknown error. | 17 | 3 |
| ID-Q | Error: Could not establish connection | 11 | 6 |
| ID-9V | Error: No current window | 6 | 6 |
| ID-S9 | Error: Cannot execute script on this site! | 3 | 1 |
| ID-RE | Error: Could not load file: content-script.ts-loader | 3 | 2 |

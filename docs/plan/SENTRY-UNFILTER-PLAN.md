# Sentry Unfilter Plan — Fix Errors Instead of Hiding Them

> Created: 2026-03-28
> Status: **Phase 2 — In Progress (B4 done, waiting on Phase 1 context data)**
> Last updated: 2026-04-18

## Context

After TASK-0.5 we moved all error filtering into `beforeSend` in `sentryCapturer.ts`.
The filter list (`SENTRY_FILTER_ERRORS` in `constants.ts`) has 26 patterns that silently drop errors client-side.

Result: Sentry shows 0 errors in the last 14 days, but the Sentry weekly report says **8.4k events dropped** (Mar
21-28).
The errors aren't fixed — they're hidden. Some filters are correct (we can't fix Chrome internals),
but others may be masking real, fixable bugs.

## Goal

Systematically review each filter, decide: **keep** (unfixable) or **unfilter + fix** (actionable).
Reduce dropped events by fixing root causes, not by adding more filters.

## Filter Inventory (26 patterns)

### Category A — Keep filtered (Chrome internals, not our code)

These are Chrome API limitations. We cannot fix them. Keep the filters.

| #   | Pattern                                                  | Why unfixable                                    |
| --- | -------------------------------------------------------- | ------------------------------------------------ |
| 1   | `cannot access a chrome://`                              | Chrome blocks extension access to internal pages |
| 2   | `cannot access a chrome-extension://`                    | Cross-extension access is forbidden              |
| 3   | `cannot access contents of url "chrome`                  | Same as #1, different wording                    |
| 4   | `extensions gallery`                                     | Chrome Web Store blocks all extensions           |
| 5   | `this page cannot be scripted`                           | Enterprise/managed policy                        |
| 6   | `extensionssettings policy`                              | Enterprise/managed policy                        |
| 7   | `cannot be scripted due to an extensionssettings policy` | Enterprise/managed policy                        |
| 8   | `cannot excute script on this site`                      | Chrome typo variant of "cannot execute"          |
| 9   | `cannot execute script on this site`                     | Chrome blocks injection on certain pages         |
| 10  | `the browser is shutting down`                           | Nothing to do during shutdown                    |
| 11  | `tab creation is restricted`                             | Sidebar mode limitation                          |
| 12  | `unable to create writable file`                         | Chrome storage IO, not our problem               |
| 13  | `unable to create sequential file`                       | Chrome storage IO                                |
| 14  | `io error`                                               | Chrome storage IO                                |
| 15  | `access denied`                                          | Chrome file lock                                 |

**15 patterns — no action needed.**

### Category B — Investigate and potentially fix

These errors might be fixable with better error handling or UX. Plan: unfilter one at a time,
observe what comes in, fix the root cause, then either remove the filter or narrow it.

| #   | Pattern                              | Last 30d count | Hypothesis                                                                                                                                  | Phase |
| --- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| B1  | `blocked`                            | 1,342          | Too broad — matches ANY error with "blocked". Could hide CORS, CSP, real fetch failures. Replace with specific patterns or fix the cause.   | 1     |
| B2  | `unknown error.`                     | 182            | Generic Chrome error. Need to see stack traces — might reveal a real bug.                                                                   | 1     |
| B3  | `no sw`                              | 119            | Service Worker not running. Could be fixable — re-register SW or handle gracefully.                                                         | 2     |
| B4  | `cannot access contents of the page` | 3,076          | Biggest by volume. Happens when user clicks extension on a page without host permission. Could show a friendly message instead of erroring. | 2     |
| B5  | `could not load file`                | 777            | Content script loader missing — stale extension version after update. Potentially fixable with auto-reload or user notification.            | 3     |
| B6  | `receiving end does not exist`       | 85             | Message sent before content script ready. Fixable with retry + health check.                                                                | 3     |
| B7  | `could not establish connection`     | 85             | Same root cause as B6.                                                                                                                      | 3     |
| B8  | `no current window`                  | —              | Background fires when no window open. Guard with window check.                                                                              | 3     |
| B9  | `frame with id 0`                    | 71             | Tab showing error page. Check tab status before messaging.                                                                                  | 3     |
| B10 | `no tab with id:`                    | —              | Tab closed between check and action. Guard with try/catch or tab existence check.                                                           | 3     |
| B11 | `tabs cannot be edited right now`    | 61             | User dragging a tab. Retry after delay.                                                                                                     | 3     |

**11 patterns — investigate in phases below.**

---

## Phases

### Phase 1 — Unfilter broad patterns, observe (current)

**Goal**: See what `blocked` and `unknown error.` actually contain.

**Steps**:

- [x] Remove `'blocked'` filter entirely (no replacement patterns — observe first)
- [x] Remove `'unknown error.'` filter entirely
- [x] Add `extra` context parameter to `captureException` and `handleError`
- [x] Add context to global error handlers (source, url, filename, line/col)
- [x] Add context to `action.onClicked` handler (tabUrl, tabId)
- [x] Add context to `FETCH_IMAGE` handler (requestUrl)
- [x] Add context to `sendMessageToContentScript` (tabId, messageAction)
- [x] Build passes
- [x] Deploy and wait 3-5 days
- [x] Check Sentry: what new errors appear? What context do they carry?
- [x] Document findings below in Phase 1 Results

**Phase 1 Results** _(checked: 2026-04-18, 21 days of data)_:

**Volume after unfiltering** (last 30d):

| Error            | Before (Mar 28) | After (Apr 18) | Change |
| ---------------- | --------------- | -------------- | ------ |
| `Blocked`        | ~1,342/month    | 79/month       | −94%   |
| `Unknown error.` | ~182/month      | 51/month       | −72%   |

**Findings for B1 — `blocked` (issue ID-R5)**:

- Status in Sentry: `ignored / archived_forever` (was archived at some point, still receiving events)
- No stacktrace, no culprit, `mechanism: generic`, `handled: yes`
- Our extra context fields (tabUrl, requestUrl, messageAction) are **not visible** in events
- Conclusion: these errors come from the Chrome runtime itself via the global error handler, not via our `captureException` calls with context. We never know _which_ operation triggered them.
- **Decision**: cannot fix. Move to Category A. Re-add filter `'blocked'` (narrowed if possible).

**Findings for B2 — `unknown error.` (issue ID-9P)**:

- Status in Sentry: `ignored / archived_forever`
- No stacktrace, no culprit, `mechanism: generic`, `handled: yes`
- Extra context also not visible — same root cause as B1
- Conclusion: Chrome emits this for various internal failures (storage, network, tab operations). Not actionable.
- **Decision**: cannot fix. Move to Category A. Re-add filter `'unknown error.'`.

**Other findings from the 30-day scan**:

- `Cannot access contents of the page`: 73 events/month (B4) — confirmed high volume, Phase 2 target
- `Frame with ID 0 is showing error page`: 439 all-time / 10 in 30d (B9, issue ID-18) — steady trickle
- `Frame with ID 0 was removed.`: 635 all-time / 7 in 30d (B9, issue ID-19) — steady trickle
- New: `A listener indicated an asynchronous response... message channel closed` (ID-VN) — related to B6/B7, 1 event
- New: `Strategy D fetch failed` (ID-VP) — from full-size resolver, 1 event, probably noise
- `Cannot access a secure:// URL` (ID-VQ) — not in filter list, 4 events, should add to Category A

**Root cause of missing context (discovered 2026-04-18)**:

Raw event JSON confirmed that none of our custom tags (`browser`, `extension.id`, etc.) or contexts (`Extra Context`, `Error Details`) were ever sent. Bug: `captureException` was calling `client.captureException()` instead of `scope.captureException()`. The client bypasses our custom scope, so all context added via `scope.setTag()` / `scope.setContext()` was silently dropped.

**Fix applied 2026-04-18**: Changed `client.captureException()` → `scope.captureException()` and `client.captureMessage()` → `scope.captureMessage()` in `src/utils/sentryCapturer.ts`. Build passes.

**Action items before Phase 2**:

- [ ] Deploy fix and wait 3-5 days to see if `blocked` / `unknown error.` events now carry context
- [ ] If context appears and reveals a fixable source → fix it; if still no context or confirms unfixable → re-add filters
- [ ] Add `'cannot access a secure://'` to Category A filters (new variant, not in filter list)

---

### Phase 2 — Permission errors and Service Worker

**Goal**: Fix or improve UX for `cannot access contents of the page` and `no sw`.

**Steps**:

- [x] **B4 (cannot access contents of the page)**: `ContentScriptAccessDeniedError` thrown in `injectContentScript`
      when Chrome returns "cannot access contents" — caught in `grabImagesFromTab`, returns `t('page_not_accessible')`
      to user (snackbar in side panel, alert in popup). No Sentry. New translation key added to all 52 locales.
- [ ] **B3 (no sw)**: Investigate when SW dies. Add SW registration check + recovery. If unrecoverable, show user a
      message to reload the extension.
- [ ] Deploy, wait 3-5 days, check Sentry
- [ ] Document findings below

**Hypothesis**: B4 is the biggest volume (3k+/month). If we handle it gracefully in UI, we can remove the filter AND
improve UX.

**Phase 2 Results**:

> _Not started yet._

---

### Phase 3 — Messaging and tab lifecycle

**Goal**: Fix race conditions in content script messaging and tab operations.

**Steps**:

- [ ] **B6+B7 (receiving end / could not establish connection)**: Add retry with health check before sending messages to
      content script. Use `HEALTH_CHECK` message pattern that already exists in codebase.
- [ ] **B5 (could not load file)**: Detect stale extension state, prompt user to reload. Or use
      `chrome.runtime.reload()` if in background.
- [ ] **B9 (frame with id 0)**: Check `tab.status` and `tab.url` before sending messages. Skip error pages.
- [ ] **B10 (no tab with id)**: Wrap tab operations in try/catch, handle gracefully.
- [ ] **B11 (tabs cannot be edited)**: Add short retry (500ms) when tab is being dragged.
- [ ] **B8 (no current window)**: Guard `chrome.windows.getCurrent` calls.
- [ ] Remove corresponding filters as fixes are confirmed
- [ ] Deploy, wait 3-5 days, check Sentry

**Phase 3 Results**:

> _Not started yet._

---

## How to Work With This Plan

### Starting a phase

1. Read this doc to see current status
2. Make the code changes described in the phase
3. Update checkboxes as you go
4. Deploy to Chrome Web Store

### After deploying

Wait 3-5 days, then run in Claude Code:

```
Check Sentry for errors in the last 7 days — org blockdev, project id, region de.sentry.io.
Compare with the baseline in docs/plan/SENTRY-UNFILTER-PLAN.md.
```

### Recording results

Fill in the "Phase N Results" section with:

- What errors appeared after unfiltering
- Which ones are fixable vs noise
- What was actually fixed
- Updated error counts

### When to move to next phase

- All checkboxes in current phase are done
- Results section is filled in
- Error counts are stable (no regression)

---

## Success Metrics

| Metric                     | Before (Mar 2026) | Target            |
| -------------------------- | ----------------- | ----------------- |
| Dropped events/week        | ~8,400            | < 2,000           |
| Filters in Category B      | 11                | < 4               |
| User-facing error handling | Silent failures   | Friendly messages |

## Reference

- Filter list: `src/utils/constants.ts:226` (`SENTRY_FILTER_ERRORS`)
- Filter logic: `src/utils/sentryCapturer.ts:45` (`shouldIgnoreError`)
- Previous baseline: `docs/plan/SENTRY-BASELINE.md`
- Previous filter fix: `docs/plan/TASK-0.5-SENTRY-FILTER.md`
- Sentry dashboard: https://blockdev.sentry.io/issues/?project=4509021769039952

# TASK-1 — Download Reliability & Error Visibility

## Context Files

Paste before starting: `docs/plan/PROJECT.md`
Prerequisite: TASK-0 complete (Vitest running).

## Before You Start — Check Sentry

Run these MCP queries to identify the most frequent real-world failures:

```
mcp__sentry__search_issues: query="download" status=unresolved
mcp__sentry__search_issues: query="chrome.downloads" status=unresolved
mcp__sentry__search_issues: query="FETCH_IMAGE" status=unresolved
```

Read the top 3 issues with `mcp__sentry__get_issue_details` before writing any code.
Adjust the implementation plan below based on what you find.

## Problems (from code review)

### P1 — Bulk download errors are silently swallowed

**File**: `src/utils/downloadWithConversion.ts:122`

```ts
// Current — error is caught but user gets no feedback:
} catch (error) {
  // Remove all console.log and console.warn except for real errors (console.error)
}
```

When downloading 10 images and 3 fail, the user sees no indication of partial failure.

### P2 — False success tracking

**File**: `src/utils/downloadWithConversion.ts:85-88`

```ts
// Current — called even in the final unconfirmed fallback:
await downloadImage({ src, filename });
useRatingStore.getState().setHasSuccessfulDownload(true); // <-- not confirmed
```

`downloadImage` resolves when `chrome.downloads.download` callback fires, but that doesn't confirm
the file was actually written to disk. The rating store should only be updated when we have reasonable
confidence of success (i.e., when `downloadId` is returned by the API).

### P3 — No debug log

No way to diagnose user-reported failures without access to their browser console.

### P4 — `chrome.runtime.lastError` empty message edge case

**File**: `src/utils/downloadHelpers.ts:345-349`

Handles empty `lastError.message` but the raw message trimming could still produce misleading logs.

## Implementation

### Step 1 — Add `DownloadResult` type to `src/types/index.ts`

Add after the existing `ImageFetchResponse` interface:

```ts
export interface DownloadResult {
  success: boolean;
  downloadId?: number;
  errorCode?: string;
  errorMessage?: string;
}
```

### Step 2 — Add `DebugLogger` utility at `src/utils/debugLogger.ts`

New file. Stores structured log entries in `chrome.storage.local` under key `debug-log`.
Keeps last 100 entries (ring buffer). Used by download flow and settings export.

Interface:

```ts
interface DebugLogEntry {
  ts: number; // Date.now()
  level: 'info' | 'warn' | 'error';
  context: string; // e.g. 'download', 'grab_images'
  message: string;
  data?: Record<string, unknown>; // url, domain, filename, errorStack, etc.
}
```

Public API:

```ts
export const debugLogger = {
  log(level: DebugLogEntry['level'], context: string, message: string, data?: Record<string, unknown>): void,
  getEntries(): Promise<DebugLogEntry[]>,
  clear(): Promise<void>,
  export(): Promise<string>,  // Returns JSON string for clipboard/file
};
```

Implementation notes:

- `log()` must be fire-and-forget (synchronous signature, async internally) — do not await in hot paths
- Cap at 100 entries using `slice(-100)` before storing
- `chrome.storage.local` is only available in extension context; wrap in `try/catch` with silent fallback for tests
- `export()` returns pretty-printed JSON

### Step 3 — Update `downloadImage` in `src/utils/downloadHelpers.ts`

Change return type from `Promise<void>` to `Promise<DownloadResult>`.

Key changes:

- When `chrome.downloads.download` callback fires with a valid `downloadId`, log success via `debugLogger.log('info', 'download', 'Download started', { url, filename, downloadId })`
- When it fails, log error via `debugLogger.log('error', 'download', message, { url, filename, errorCode })`
- Return `{ success: true, downloadId }` or `{ success: false, errorCode, errorMessage }`
- Do NOT change the 3-level fallback logic — it already exists and works
- The function currently throws on all-fallback-failure; keep that behavior AND add log entry before throwing

### Step 4 — Update `downloadImageWithConversion` in `src/utils/downloadWithConversion.ts`

Change return type to `Promise<DownloadResult>`.

Key changes:

- Call `downloadImage(...)` and capture the result
- Only call `useRatingStore.getState().setHasSuccessfulDownload(true)` when `result.success === true`
- Return the `DownloadResult` up the call chain
- Add log entry at the top: `debugLogger.log('info', 'download', 'Download initiated', { src, filename, id })`

### Step 5 — Update `downloadImagesWithConversion` in `src/utils/downloadWithConversion.ts`

Change to track and return structured results.

Key changes:

- Accumulate results: `const results: DownloadResult[] = []`
- In the `catch` block: push `{ success: false, errorMessage: String(error) }` to results AND call `debugLogger.log('error', 'download', 'Bulk download item failed', { src: image.src, error: String(error) })`
- Return `{ successCount, failCount, totalCount }` (extend or replace current return type)
- Call `setHasSuccessfulDownload(true)` only if `successCount > 0`

### Step 6 — Update `useImageOperations` in `src/utils/imageOperations.ts`

The `handleDownload` hook currently shows a generic error snackbar. After this change:

- For single download: behavior unchanged (success/error snackbar)
- For bulk download callers (in `Page` component): pass the failure count up so the caller can show "Downloaded 7/10 images. 3 failed."

Check `src/components/Page/components/Toolbar/index.tsx` and `src/components/Page/index.tsx` — find where bulk download is triggered and update the success notification to include failure count when `failCount > 0`.

Notification message pattern: `t('bulk_download_partial', { success: 7, total: 10 })` — add this key to `public/_locales/en/messages.json` and any other locale files present.

### Step 7 — Add "Export Debug Log" to Options page

**File**: `src/components/OptionsPage/index.tsx` (or the appropriate sub-component)

Add a button in the OptionsPage that:

1. Calls `debugLogger.export()`
2. Creates a `Blob` from the JSON string
3. Triggers a download via `URL.createObjectURL` + anchor click pattern (not `chrome.downloads` — simpler)

Label: "Export debug log" — add i18n key `export_debug_log`.

The button should also show an entry count: "Export debug log (23 entries)".

## Tests to Write

### `src/utils/__tests__/debugLogger.test.ts`

```ts
describe('debugLogger', () => {
  it('stores a log entry', async () => { ... })
  it('caps at 100 entries', async () => { ... })
  it('export returns valid JSON', async () => { ... })
  it('clear removes all entries', async () => { ... })
  it('does not throw when chrome.storage unavailable', async () => { ... })
})
```

### `src/utils/__tests__/downloadHelpers.test.ts`

```ts
describe('downloadImage', () => {
  it('returns { success: true, downloadId } when chrome.downloads.download succeeds', async () => { ... })
  it('retries with generic filename when first attempt fails', async () => { ... })
  it('tries CORS fallback when both filename attempts fail', async () => { ... })
  it('returns { success: false } when all methods fail', async () => { ... })
  it('logs error to debugLogger on failure', async () => { ... })
})
```

### `src/utils/__tests__/downloadWithConversion.test.ts`

```ts
describe('downloadImagesWithConversion', () => {
  it('returns correct successCount and failCount', async () => { ... })
  it('does not call setHasSuccessfulDownload when all fail', async () => { ... })
  it('calls setHasSuccessfulDownload when at least one succeeds', async () => { ... })
  it('logs failures to debugLogger', async () => { ... })
})
```

Mock `downloadImage` with `vi.mock('../downloadHelpers')` to avoid Chrome API dependency in these tests.

## Acceptance Criteria

- [ ] `downloadImage` returns `DownloadResult` (not `void`)
- [ ] When 3 out of 10 bulk downloads fail, the snackbar shows "Downloaded 7/10. 3 failed." (or equivalent)
- [ ] `useRatingStore.setHasSuccessfulDownload(true)` is NOT called when `downloadId` is undefined
- [ ] "Export debug log" button appears in Options page
- [ ] Clicking it downloads a `.json` file with log entries
- [ ] All new unit tests pass (`yarn test`)
- [ ] `yarn build` passes with no TypeScript errors
- [ ] `yarn lint` passes

## Explicitly Out of Scope

- Do NOT change the 3-level fallback logic in `downloadImage` — it is already correct
- Do NOT add retry delays or exponential backoff — YAGNI
- Do NOT show download progress per-image — too complex for this sprint

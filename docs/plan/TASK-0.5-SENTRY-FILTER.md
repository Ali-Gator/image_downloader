# TASK-0.5 — Fix Sentry Error Filter Bypass

## Context Files
Paste before starting: `docs/plan/PROJECT.md`
No prerequisites — can be done independently at any time.

## Problem

`SENTRY_FILTER_ERRORS` in `src/utils/constants.ts` defines 13 error patterns to ignore (chrome://,
"receiving end does not exist", "blocked", etc.). The filter is applied in `shouldIgnoreError()`
which is called from `handleError()`.

**However, 3 out of 5 code paths to Sentry bypass `handleError()` entirely:**

| Code path | File | Goes through filter? |
|---|---|---|
| `handleError(error)` | `errorHandlers.ts:27` | Yes |
| `withErrorHandling(action)` | `errorHandlers.ts:60` | Yes (calls `handleError`) |
| `setupGlobalErrorHandlers()` → `unhandledrejection` | `errorHandlers.ts:82-88` | **NO** |
| `setupGlobalErrorHandlers()` → `error` event | `errorHandlers.ts:90-94` | **NO** |
| `ErrorBoundary.componentDidCatch` | `ErrorBoundary/index.tsx:25` | **NO** |

This means browser-level unhandled errors (which include many of the filtered patterns like
"Blocked", "No current window", "receiving end does not exist") are sent to Sentry unfiltered.

**Impact**: ~4,081 of 5,732 errors/month (71%) are noise that should be filtered.

## Fix

### Option A: Move filter into `captureException` (recommended)

The simplest fix with zero risk of missing future code paths.

**File**: `src/utils/sentryCapturer.ts`

Add the filter check at the top of `captureException`:

```ts
import { SENTRY_FILTER_ERRORS } from '@utils/constants';

function shouldIgnoreError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return SENTRY_FILTER_ERRORS.some((substr) => lower.includes(substr));
}

export const captureException = (error: Error, errorInfo?: ErrorInfo) => {
  // Filter noise before sending to Sentry
  if (shouldIgnoreError(error.message || '')) {
    return null;
  }

  // ... rest of existing code
};
```

Then remove `shouldIgnoreError` from `errorHandlers.ts` (it becomes redundant since `captureException`
now handles it). Keep the `console.warn` in `handleError` if desired for local debugging:

```ts
// errorHandlers.ts — simplified handleError:
export function handleError(error: unknown, showAlert = false, customMessage?: string): void {
  const errorObj = ensureError(error);
  const message = errorObj?.message || errorObj?.toString() || '';

  if (showAlert) {
    alert(customMessage || message);
  }

  // captureException now handles filtering internally
  const tabUrl = (error as any)?.tabUrl;
  if (tabUrl) {
    captureException(errorObj, { componentStack: `tabUrl: ${tabUrl}` } as ErrorInfo);
  } else {
    captureException(errorObj);
  }
}
```

### Option B: Wrap all `captureException` call sites

Add `shouldIgnoreError` checks before each direct `captureException` call in:
- `errorHandlers.ts:87` (unhandledrejection)
- `errorHandlers.ts:93` (error event)
- `ErrorBoundary/index.tsx:25`

**Not recommended** — easy to miss new call sites in the future.

### Additional: Add missing filter patterns

Current `SENTRY_FILTER_ERRORS` in `constants.ts` is missing some patterns seen in Sentry:

```ts
export const SENTRY_FILTER_ERRORS = [
  // ... existing entries ...

  // Add these:
  'cannot excute script on this site',    // typo in Chrome error message (yes, Chrome has this typo)
  'cannot execute script on this site',   // correct spelling variant
  'tab creation is restricted',           // sidebar mode
  'tabs cannot be edited right now',      // user dragging tab
  'unable to create writable file',       // Chrome IO error
  'unable to create sequential file',     // Chrome IO error
  'io error',                             // generic Chrome storage IO
  'access denied',                        // Chrome file lock
  'frame with id 0',                      // already in filter, but check exact match
];
```

Review against the Sentry baseline in `SENTRY-BASELINE.md` for completeness.

## Tests to Write

### `src/utils/__tests__/sentryCapturer.test.ts`

```ts
describe('captureException', () => {
  it('does not send filtered errors to Sentry', () => {
    const result = captureException(new Error('Blocked'));
    expect(result).toBeNull();
  });

  it('does not send "Cannot access a chrome://" errors', () => {
    const result = captureException(new Error('Cannot access a chrome:// URL'));
    expect(result).toBeNull();
  });

  it('does not send "receiving end does not exist" errors', () => {
    const result = captureException(new Error('Could not establish connection. Receiving end does not exist.'));
    expect(result).toBeNull();
  });

  it('sends real errors to Sentry', () => {
    const result = captureException(new Error('Download failed: network timeout'));
    expect(result).not.toBeNull();
  });
});
```

Note: You'll need to mock the Sentry `BrowserClient` in tests. The `client.captureException` call
can be mocked with `vi.fn()`.

### `src/utils/__tests__/errorHandlers.test.ts`

```ts
describe('handleError', () => {
  it('does not throw on filtered errors', () => {
    expect(() => handleError(new Error('No current window'))).not.toThrow();
  });

  it('calls alert when showAlert=true', () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    handleError(new Error('Real error'), true, 'Custom message');
    expect(window.alert).toHaveBeenCalledWith('Custom message');
  });
});
```

## Acceptance Criteria

- [ ] `captureException` checks `shouldIgnoreError` before sending to Sentry
- [ ] All 3 bypass paths (unhandledrejection, error event, ErrorBoundary) are now filtered
- [ ] Missing filter patterns added to `SENTRY_FILTER_ERRORS`
- [ ] Unit tests verify filtered errors return `null`
- [ ] Unit tests verify real errors are still sent
- [ ] `yarn build` passes
- [ ] After deploy: Sentry error count drops by ~70% within 24 hours

## Estimated Impact

Before: ~5,732 errors/month
After: ~1,200-1,600 errors/month (only actionable errors remain)

This is the single highest-ROI fix in the entire sprint — 5 minutes of code, 70% noise reduction.

# TASK-0 — Test Infrastructure Setup

## Context Files

Paste before starting: `docs/plan/PROJECT.md`

## Problem

Zero tests in `src/`. No test runner configured. Regressions ship undetected.
This task must be completed before any other task — all subsequent tasks require writing tests.

## Approach

**Vitest** — native Vite integration, zero config overhead, compatible with existing `vite.config.ts`.
**jsdom** — DOM environment for content script tests.
**Chrome API mocks** — manual mock object (no external library needed).

## Steps

### Step 1 — Install dependencies

```bash
yarn add -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom happy-dom
```

Notes:

- `@vitest/coverage-v8` — V8-based coverage (no instrumentation overhead)
- `jsdom` — for content script and DOM utility tests
- `@testing-library/react` — for React component tests (future tasks)
- `happy-dom` — faster alternative to jsdom for pure DOM tests; we'll use jsdom for broader compatibility

### Step 2 — Configure Vitest in `vite.config.ts`

Add a `test` block to the existing `vite.config.ts`. Do not replace existing config — only add the `test` key.

```ts
// Add inside defineConfig({...}):
test: {
  globals: true,
    environment
:
  'jsdom',
    setupFiles
:
  ['src/__tests__/setup.ts'],
    include
:
  ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude
:
  ['node_modules', 'build'],
    coverage
:
  {
    provider: 'v8',
      reporter
  :
    ['text', 'lcov'],
      include
  :
    ['src/**/*.{ts,tsx}'],
      exclude
  :
    [
      'src/**/*.d.ts',
      'src/__tests__/**',
      'src/containers/**',   // entry points — tested via E2E
      'src/theme/**',
    ],
      thresholds
  :
    {
      lines: 80,
        functions
    :
      80,
    }
  ,
  }
,
}
,
```

### Step 3 — Create setup file `src/__tests__/setup.ts`

This file runs before every test. It provides Chrome API mocks.

```ts
// src/__tests__/setup.ts
import '@testing-library/jest-dom';

// Chrome API global mock
const chromeStorageData: Record<string, unknown> = {};

global.chrome = {
  runtime: {
    id: 'test-extension-id',
    lastError: undefined,
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    onConnect: { addListener: vi.fn() },
    onConnectExternal: { addListener: vi.fn() },
    onMessageExternal: { addListener: vi.fn() },
    getManifest: vi.fn(() => ({ content_scripts: [{ js: ['content-script.js'] }] })),
    connect: vi.fn(() => ({ onDisconnect: { addListener: vi.fn() }, disconnect: vi.fn() })),
    setUninstallURL: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn((keys, cb) => cb({})),
      set: vi.fn((data, cb) => {
        Object.assign(chromeStorageData, data);
        cb?.();
      }),
      remove: vi.fn((keys, cb) => cb?.()),
    },
    sync: {
      get: vi.fn((keys, cb) => cb({})),
      set: vi.fn((data, cb) => cb?.()),
      remove: vi.fn((keys, cb) => cb?.()),
    },
  },
  downloads: {
    download: vi.fn(),
    onDeterminingFilename: { addListener: vi.fn() },
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    sendMessage: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  declarativeNetRequest: {
    getSessionRules: vi.fn(async () => []),
    updateSessionRules: vi.fn(async () => {
    }),
    RuleActionType: { MODIFY_HEADERS: 'modifyHeaders' },
    HeaderOperation: { SET: 'set' },
    ResourceType: {
      IMAGE: 'image', MEDIA: 'media', XMLHTTPREQUEST: 'xmlhttprequest',
      OTHER: 'other', MAIN_FRAME: 'main_frame', SUB_FRAME: 'sub_frame',
    },
  },
} as unknown as typeof chrome;
```

### Step 4 — Add scripts to `package.json`

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### Step 5 — Write smoke tests to verify setup

Create `src/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sanitizeFileName } from '../utils/downloadHelpers';
import { getQualityFromDimensions } from '../utils/imageUtils';

describe('smoke tests — verify test setup works', () => {
  it('sanitizeFileName removes unsafe chars', () => {
    expect(sanitizeFileName('my:file?.jpg')).toBe('my_file_.jpg');
  });

  it('getQualityFromDimensions returns HD for large images', () => {
    expect(getQualityFromDimensions(1920, 1080)).toBe('hd');
  });

  it('chrome mock is available', () => {
    expect(chrome.runtime.id).toBe('test-extension-id');
  });
});
```

Run `yarn test` — all 3 tests must pass.

### Step 6 — Update `tsconfig.json` for test types

Add to `compilerOptions`:

```json
"types": ["vitest/globals", "chrome"]
```

Or create `src/__tests__/vitest.d.ts`:

```ts
/// <reference types="vitest/globals" />
```

## Acceptance Criteria

- [x] `yarn test` runs and exits 0
- [x] `yarn test:coverage` runs and shows coverage report
- [x] All 3 smoke tests pass
- [x] No TypeScript errors in test files (`yarn build` still passes)
- [x] `vi.fn()` is available globally in test files without import

## Notes

- Do not add `@types/jest` — conflicts with Vitest globals
- Chrome API mock in setup.ts is intentionally minimal; extend per-test with
  `vi.mocked(chrome.X.Y).mockReturnValue(...)`
- Tests for `src/background/index.ts` are harder to unit-test (side effects on module load); skip for now, cover via
  integration tests in later tasks

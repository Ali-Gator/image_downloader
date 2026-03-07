# TASK-5 — Automated E2E Tests with Playwright

## Context Files
Paste before starting: `docs/plan/PROJECT.md`
Prerequisite: TASK-0 (Vitest), ideally after TASK-2/3/4 so all detection features exist.

## Approach

Chrome extensions cannot run in headless mode — Playwright must use headed Chromium.
We do NOT test against live external sites (fragile, slow). Instead, we create a **local test fixture page** with all image patterns and test against that.

### What we test automatically

| Scenario | Value |
|---|---|
| Extension loads, popup renders, button works | Smoke test |
| Content script injects into test page | Core flow |
| GRAB_IMAGES returns correct images from fixture page | Image detection (TASK-2, 3, 4) |
| page.html renders image list with correct count | UI integration |
| Filters (quality, search, sort) work on page.html | Store logic |
| Options page saves/loads settings | Persistence |
| Download single image triggers chrome.downloads | Download flow |

### What stays manual (see E2E-TEST-SITES.md)

- Behavior on live external sites (Flutter, SPA, srcset)
- Cross-origin CORS edge cases
- Visual quality of downloaded images
- Paywall/monetization flow

## Implementation

### Step 1 — Install Playwright

```bash
yarn add -D @playwright/test
npx playwright install chromium
```

Only Chromium is needed — extensions don't work in Firefox/WebKit via Playwright.

### Step 2 — Create Playwright config `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    // Extensions require headed mode
    headless: false,
  },
  projects: [
    {
      name: 'chromium-extension',
      use: {
        // Extension will be loaded via custom fixture (see step 4)
      },
    },
  ],
});
```

### Step 3 — Create test fixture page `e2e/fixtures/test-page.html`

A self-contained HTML page with all image patterns the extension should detect.
Serve it via a simple local HTTP server during tests.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Image Downloader Test Page</title>
  <style>
    .hero {
      width: 800px;
      height: 400px;
      background-image: url('./images/bg-hero.jpg');
      background-size: cover;
    }
    .card-bg {
      width: 300px;
      height: 200px;
      background-image: url('./images/bg-card.png');
      background-size: cover;
    }
  </style>
</head>
<body>
  <h1>Image Downloader E2E Test Page</h1>

  <!-- Category 1: Basic <img> -->
  <img src="./images/basic-photo.jpg" alt="Basic photo" width="800" height="600">
  <img src="./images/basic-icon.png" alt="Basic icon" width="64" height="64">

  <!-- Category 2: srcset -->
  <img
    src="./images/srcset-small.jpg"
    srcset="./images/srcset-small.jpg 400w, ./images/srcset-medium.jpg 800w, ./images/srcset-large.jpg 1600w"
    sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1600px"
    alt="Srcset responsive image"
    width="800" height="600"
  >

  <!-- Category 3: <picture> element -->
  <picture>
    <source srcset="./images/picture-webp.webp" type="image/webp">
    <source srcset="./images/picture-large.jpg" type="image/jpeg">
    <img src="./images/picture-fallback.jpg" alt="Picture element" width="800" height="600">
  </picture>

  <!-- Category 4: Lazy loading (data-src) -->
  <img
    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    data-src="./images/lazy-photo.jpg"
    alt="Lazy loaded image"
    width="800" height="600"
    class="lazy"
  >
  <img
    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    data-lazy="./images/lazy-photo-2.jpg"
    alt="Lazy loaded image 2"
    width="600" height="400"
    class="lazy"
  >

  <!-- Category 5: CSS background images (see <style> above) -->
  <div class="hero" data-testid="hero-bg"></div>
  <div class="card-bg" data-testid="card-bg"></div>

  <!-- Category 6: Small images (should be filtered out, < 10px) -->
  <img src="./images/tiny-spacer.gif" alt="" width="1" height="1">
  <img src="./images/tiny-tracker.png" alt="" width="5" height="5">

  <!-- Category 7: Duplicate (same src, should appear once) -->
  <img src="./images/basic-photo.jpg" alt="Duplicate" width="800" height="600">

  <!-- Category 8: data-original (Magento/legacy pattern) -->
  <img
    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    data-original="./images/data-original-photo.jpg"
    alt="Data-original image"
    width="500" height="500"
  >
</body>
</html>
```

### Step 4 — Create test images `e2e/fixtures/images/`

Generate minimal valid image files for tests. These don't need to be real photos — just valid
image files with the right dimensions so `naturalWidth`/`naturalHeight` work:

```bash
# Create minimal test images via ImageMagick (or manually create small PNGs/JPGs)
mkdir -p e2e/fixtures/images
# 800x600 JPEG
convert -size 800x600 xc:red e2e/fixtures/images/basic-photo.jpg
convert -size 64x64 xc:blue e2e/fixtures/images/basic-icon.png
convert -size 400x300 xc:green e2e/fixtures/images/srcset-small.jpg
convert -size 800x600 xc:green e2e/fixtures/images/srcset-medium.jpg
convert -size 1600x1200 xc:green e2e/fixtures/images/srcset-large.jpg
convert -size 800x600 xc:yellow e2e/fixtures/images/picture-webp.webp
convert -size 800x600 xc:yellow e2e/fixtures/images/picture-large.jpg
convert -size 800x600 xc:yellow e2e/fixtures/images/picture-fallback.jpg
convert -size 800x600 xc:purple e2e/fixtures/images/lazy-photo.jpg
convert -size 600x400 xc:purple e2e/fixtures/images/lazy-photo-2.jpg
convert -size 800x400 xc:orange e2e/fixtures/images/bg-hero.jpg
convert -size 300x200 xc:cyan e2e/fixtures/images/bg-card.png
convert -size 1x1 xc:white e2e/fixtures/images/tiny-spacer.gif
convert -size 5x5 xc:white e2e/fixtures/images/tiny-tracker.png
convert -size 500x500 xc:pink e2e/fixtures/images/data-original-photo.jpg
```

If ImageMagick is not available, create them programmatically in a Node script using `canvas`
or just use any small real images renamed appropriately.

### Step 5 — Create extension fixture `e2e/extension-fixture.ts`

Playwright fixture that builds the extension, launches Chromium with it loaded, and provides helpers.

```ts
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { createServer, type Server } from 'http';
import fs from 'fs';

// Serve test fixture page on a local HTTP server
function startFixtureServer(fixturesDir: string, port: number): Server {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
    '.css': 'text/css', '.js': 'application/javascript',
  };

  return createServer((req, res) => {
    const filePath = path.join(fixturesDir, req.url || '/');
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }).listen(port);
}

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  fixtureUrl: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const extensionPath = path.resolve(__dirname, '../build');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
        '--disable-gpu',
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    // Wait for service worker to register
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },

  fixtureUrl: async ({}, use) => {
    const fixturesDir = path.resolve(__dirname, 'fixtures');
    const port = 9753;
    const server = startFixtureServer(fixturesDir, port);
    await use(`http://localhost:${port}/test-page.html`);
    server.close();
  },
});

export { expect } from '@playwright/test';
```

### Step 6 — Write E2E tests `e2e/extension.spec.ts`

```ts
import { test, expect } from './extension-fixture';

test.describe('Extension loads and works', () => {

  test('popup renders with download button', async ({ context, extensionId }) => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popupPage.locator('button')).toBeVisible();
    await popupPage.close();
  });

  test('grabs images from test page', async ({ context, extensionId, fixtureUrl }) => {
    // 1. Navigate to test fixture page
    const testPage = await context.newPage();
    await testPage.goto(fixtureUrl);
    await testPage.waitForLoadState('networkidle');

    // Wait for content script to inject (MutationObserver delay)
    await testPage.waitForTimeout(1500);

    // 2. Open popup and click the grab button
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

    // Click the download/grab button
    const grabButton = popupPage.locator('button').first();
    await grabButton.click();

    // 3. Wait for page.html to open (extension creates a new tab)
    const pageTab = await context.waitForEvent('page', { timeout: 10000 });
    await pageTab.waitForLoadState('domcontentloaded');
    await pageTab.waitForTimeout(2000); // Wait for images to render

    // 4. Verify images are shown
    //    Expected: basic-photo (1, not duplicate), basic-icon (too small? 64x64 > 10px so yes),
    //    srcset-large (highest res), picture source, lazy photos, bg images, data-original
    //    NOT expected: tiny-spacer (1x1), tiny-tracker (5x5), duplicate
    const imageCards = pageTab.locator('[data-image-id]');
    const count = await imageCards.count();

    // At minimum we expect several images (exact count depends on which tasks are complete)
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify no tiny images (spacer/tracker) made it through
    const allSrcs = await pageTab.evaluate(() => {
      const cards = document.querySelectorAll('[data-image-id]');
      return Array.from(cards).map(c => {
        const img = c.querySelector('img');
        return img?.src || img?.alt || '';
      });
    });
    expect(allSrcs.join(',')).not.toContain('tiny-spacer');
    expect(allSrcs.join(',')).not.toContain('tiny-tracker');

    await testPage.close();
    await popupPage.close();
  });

  test('options page saves settings', async ({ context, extensionId }) => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await optionsPage.waitForLoadState('domcontentloaded');

    // Verify page renders
    await expect(optionsPage.locator('body')).not.toBeEmpty();

    await optionsPage.close();
  });
});

test.describe('Image detection specifics', () => {

  test('detects correct number of valid images from fixture', async ({
    context, extensionId, fixtureUrl,
  }) => {
    const testPage = await context.newPage();
    await testPage.goto(fixtureUrl);
    await testPage.waitForLoadState('networkidle');
    await testPage.waitForTimeout(1500);

    // Send GRAB_IMAGES directly via content script messaging
    const result = await testPage.evaluate(async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'grabImages' },
          (response: unknown) => resolve(response),
        );
      });
    });

    // Result should have images array
    expect(result).toHaveProperty('images');
    // @ts-expect-error dynamic response
    expect(result.images.length).toBeGreaterThanOrEqual(3);
  });

  test('srcset: selects highest resolution candidate', async ({
    context, extensionId, fixtureUrl,
  }) => {
    // This test verifies TASK-2 srcset detection
    const testPage = await context.newPage();
    await testPage.goto(fixtureUrl);
    await testPage.waitForLoadState('networkidle');
    await testPage.waitForTimeout(1500);

    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    const grabButton = popupPage.locator('button').first();
    await grabButton.click();

    const pageTab = await context.waitForEvent('page', { timeout: 10000 });
    await pageTab.waitForLoadState('domcontentloaded');
    await pageTab.waitForTimeout(2000);

    // Check that the srcset-large (1600w) variant was selected, not srcset-small (400w)
    const pageSrcs = await pageTab.evaluate(() => {
      const cards = document.querySelectorAll('[data-image-id]');
      return Array.from(cards).map(c => {
        const img = c.querySelector('img');
        return img?.src || '';
      });
    });

    const hasSrcsetLarge = pageSrcs.some(src => src.includes('srcset-large'));
    // Only assert if TASK-2 is implemented; skip gracefully otherwise
    if (pageSrcs.some(src => src.includes('srcset'))) {
      expect(hasSrcsetLarge).toBe(true);
    }
  });
});
```

### Step 7 — Add npm scripts to `package.json`

```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed",
"test:e2e:debug": "playwright test --debug"
```

### Step 8 — Add CI note (optional, for future)

For GitHub Actions, add to workflow:

```yaml
- name: E2E tests
  run: |
    yarn build
    xvfb-run --auto-servernum yarn test:e2e
```

This is not required for this sprint — just document it for future.

### Step 9 — Add `.gitignore` entries

```
# Playwright
e2e/test-results/
e2e/playwright-report/
```

## Expected Image Count from Fixture

After all tasks are complete, the fixture page should yield these images:

| Image | Source type | Detected by | Expected |
|---|---|---|---|
| basic-photo.jpg | `<img src>` | Current code | Yes |
| basic-icon.png (64x64) | `<img src>` | Current code (>10px) | Yes |
| srcset-large.jpg (1600w) | `<img srcset>` | TASK-2 | Yes (after TASK-2) |
| picture-large.jpg or picture-webp.webp | `<picture><source>` | TASK-2 | Yes (after TASK-2) |
| lazy-photo.jpg | `data-src` | TASK-2 | Yes (after TASK-2) |
| lazy-photo-2.jpg | `data-lazy` | TASK-2 | Yes (after TASK-2) |
| bg-hero.jpg | CSS `background-image` | TASK-2/4 | Yes (after TASK-2 or 4) |
| bg-card.png | CSS `background-image` | TASK-2/4 | Yes (after TASK-2 or 4) |
| data-original-photo.jpg | `data-original` | TASK-2 | Yes (after TASK-2) |
| tiny-spacer.gif (1x1) | `<img src>` | Filtered out (<10px) | No |
| tiny-tracker.png (5x5) | `<img src>` | Filtered out (<10px) | No |
| basic-photo.jpg (duplicate) | `<img src>` | Deduplicated | No |

**Before TASK-2**: expect ~2-3 images (basic-photo, basic-icon, maybe picture-fallback)
**After TASK-2+4**: expect ~9 images

Tests should use `toBeGreaterThanOrEqual` with a minimum that matches current implementation,
and update thresholds as tasks are completed.

## Skills to Install (optional, helpful)

```bash
npx skills add bobmatnyc/claude-mpm-skills@playwright-e2e-testing -g -y
```

This skill provides Playwright best practices and patterns for writing stable E2E tests.

## Acceptance Criteria

- [ ] `yarn build && yarn test:e2e` runs and passes (headed Chromium)
- [ ] Popup renders and grab button is clickable
- [ ] Test fixture page yields correct image count (at least 3 pre-TASK-2, 9+ post-TASK-2)
- [ ] Tiny images (< 10px) are NOT in the results
- [ ] Duplicate images are NOT in the results
- [ ] Options page loads without errors
- [ ] Tests do NOT depend on any external website
- [ ] Test fixture page covers all detection categories (img, srcset, picture, data-src, data-lazy, data-original, CSS bg, tiny, duplicate)

## Explicitly Out of Scope

- Firefox / WebKit testing — extensions not supported
- Headless mode — not supported for extensions
- CI pipeline setup — document only, implement in a future sprint
- Testing against live external sites — too fragile; use fixture page
- Download file verification — complex (needs temp dir monitoring); defer
- Paywall / monetization flow — separate concern

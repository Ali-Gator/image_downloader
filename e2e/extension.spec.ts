import { test, expect, FIXTURE_BASE } from './extension-fixture';
import type { BrowserContext, Page } from '@playwright/test';

/**
 * Helper: sends GRAB_IMAGES to a specific tab via the extension's messaging API.
 * Reuses an existing extension page to avoid open/close overhead per call.
 */
async function grabImagesFromTab(
  helperPage: Page,
  tabUrlSubstring: string,
) {
  const result = await helperPage.evaluate(async (urlMatch: string) => {
    const tabs = await chrome.tabs.query({});
    const targetTab = tabs.find((t) => t.url?.includes(urlMatch));
    if (!targetTab?.id) return { images: [] as Array<{ src: string }> };

    return new Promise<{ images: Array<{ src: string }>; pageUrl?: string }>((resolve) => {
      chrome.tabs.sendMessage(targetTab.id!, { action: 'grabImages' }, (response) => {
        const r = response as { images: Array<{ src: string }>; pageUrl?: string } | undefined;
        resolve(r ?? { images: [] });
      });
    });
  }, tabUrlSubstring);

  return result;
}

/**
 * Opens a long-lived options.html page for use as a chrome.tabs API bridge.
 */
async function openHelperPage(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('domcontentloaded');
  return page;
}

test.describe('Extension loads and works', () => {
  test('popup renders with download button', async ({ context, extensionId }) => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popupPage.locator('button')).toBeVisible();
    await popupPage.close();
  });

  test('page.html loads and renders UI', async ({ context, extensionId }) => {
    const pagePage = await context.newPage();
    await pagePage.goto(`chrome-extension://${extensionId}/page.html`);
    await pagePage.waitForLoadState('domcontentloaded');

    await expect(pagePage.locator('#root')).not.toBeEmpty();

    await pagePage.close();
  });

  test('options page renders', async ({ context, extensionId }) => {
    const optionsPage = await context.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
    await optionsPage.waitForLoadState('domcontentloaded');

    await expect(optionsPage.locator('body')).not.toBeEmpty();

    await optionsPage.close();
  });
});

test.describe('Image detection', () => {
  test('detects correct image types from fixture page', async ({
    context,
    extensionId,
    fixtureUrl,
  }) => {
    const testPage = await context.newPage();
    await testPage.goto(fixtureUrl);
    await testPage.waitForLoadState('networkidle');
    await testPage.waitForTimeout(2000);

    const helper = await openHelperPage(context, extensionId);
    const result = await grabImagesFromTab(helper, 'test-page');
    await helper.close();

    expect(result).toHaveProperty('images');
    expect(result.images.length).toBe(9);

    const srcs = result.images.map((img) => img.src);

    // Basic <img> should be detected
    expect(srcs.some((s) => s.includes('basic-photo'))).toBe(true);
    expect(srcs.some((s) => s.includes('basic-icon'))).toBe(true);

    // srcset: highest resolution should be selected
    expect(srcs.some((s) => s.includes('srcset-large'))).toBe(true);

    // <picture>: webp source should be detected
    expect(srcs.some((s) => s.includes('picture-webp'))).toBe(true);

    // Background images should be detected
    expect(srcs.some((s) => s.includes('bg-hero'))).toBe(true);
    expect(srcs.some((s) => s.includes('bg-card'))).toBe(true);

    // Lazy-loaded images should be detected via data-src / data-lazy / data-original
    expect(srcs.some((s) => s.includes('lazy-photo.jpg'))).toBe(true);
    expect(srcs.some((s) => s.includes('lazy-photo-2'))).toBe(true);
    expect(srcs.some((s) => s.includes('data-original-photo'))).toBe(true);

    // Tiny images should NOT be in results (filtered by all collection paths)
    expect(srcs.some((s) => s.includes('tiny-spacer'))).toBe(false);
    expect(srcs.some((s) => s.includes('tiny-tracker'))).toBe(false);

    // Duplicates should be removed (basic-photo appears twice in HTML)
    const basicPhotoCount = srcs.filter((s) => s.includes('basic-photo')).length;
    expect(basicPhotoCount).toBe(1);

    await testPage.close();
  });

  test('canvas-heavy page: detects images loaded via fetch/XHR', async ({
    context,
    extensionId,
  }) => {
    const canvasPage = await context.newPage();
    await canvasPage.goto(`${FIXTURE_BASE}/canvas-page.html`);
    await canvasPage.waitForLoadState('networkidle');
    await canvasPage.waitForTimeout(3000);

    const helper = await openHelperPage(context, extensionId);
    const result = await grabImagesFromTab(helper, 'canvas-page');
    await helper.close();

    const srcs = result.images.map((img) => img.src);

    expect(result.images.length).toBe(5);

    // All fetched images should be detected via Performance API
    expect(srcs.some((s) => s.includes('basic-photo'))).toBe(true);
    expect(srcs.some((s) => s.includes('bg-hero'))).toBe(true);
    expect(srcs.some((s) => s.includes('srcset-large'))).toBe(true);
    expect(srcs.some((s) => s.includes('lazy-photo'))).toBe(true);

    await canvasPage.close();
  });

  test('flutter page: detects images loaded via fetch', async ({
    context,
    extensionId,
  }) => {
    const flutterPage = await context.newPage();
    await flutterPage.goto(`${FIXTURE_BASE}/flutter-page.html`);
    await flutterPage.waitForLoadState('networkidle');
    await flutterPage.waitForTimeout(3000);

    const helper = await openHelperPage(context, extensionId);
    const result = await grabImagesFromTab(helper, 'flutter-page');
    await helper.close();

    const srcs = result.images.map((img) => img.src);

    expect(result.images.length).toBe(4);

    // All Flutter assets fetched via XHR should be detected
    expect(srcs.some((s) => s.includes('basic-photo'))).toBe(true);
    expect(srcs.some((s) => s.includes('basic-icon'))).toBe(true);
    expect(srcs.some((s) => s.includes('data-original-photo'))).toBe(true);

    await flutterPage.close();
  });
});

import { expect, FIXTURE_BASE, test } from './extension-fixture';

import type { BrowserContext, Page } from '@playwright/test';

interface GrabbedImage {
  src: string;
  originalSrc?: string;
  enhanced?: boolean;
  linkedPageUrl?: string;
}

/**
 * Generic helper: sends a message to a tab matched by URL substring
 * via the extension's chrome.tabs messaging API.
 */
async function sendMessageToTab(
  helperPage: Page,
  tabUrlSubstring: string,
  message: Record<string, unknown>,
): Promise<{ images: GrabbedImage[]; pageUrl?: string }> {
  const result = await helperPage.evaluate(
    async ({ urlMatch, msg }: { urlMatch: string; msg: Record<string, unknown> }) => {
      const tabs = await chrome.tabs.query({});
      const targetTab = tabs.find((t) => t.url?.includes(urlMatch));
      if (!targetTab?.id) return { images: [] as Array<Record<string, unknown>> };

      return new Promise<{ images: Array<Record<string, unknown>>; pageUrl?: string }>(
        (resolve) => {
          chrome.tabs.sendMessage(targetTab.id!, msg, (response) => {
            const r = response as
              | { images: Array<Record<string, unknown>>; pageUrl?: string }
              | undefined;
            resolve(r ?? { images: [] });
          });
        },
      );
    },
    { urlMatch: tabUrlSubstring, msg: message },
  );

  return result as unknown as { images: GrabbedImage[]; pageUrl?: string };
}

const grabImagesFromTab = (helperPage: Page, tabUrlSubstring: string) =>
  sendMessageToTab(helperPage, tabUrlSubstring, { action: 'grabImages' });

const enhanceImagesInTab = (helperPage: Page, tabUrlSubstring: string, images: GrabbedImage[]) =>
  sendMessageToTab(helperPage, tabUrlSubstring, { action: 'enhanceImages', images });

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

    const srcs = result.images.map((img) => img.src);

    expect(result.images.length).toBe(9);

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

  test('flutter page: detects images loaded via fetch', async ({ context, extensionId }) => {
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

test.describe('Full-size image resolution (auto)', () => {
  test.describe.configure({ mode: 'serial' });
  // Shared state: all auto-resolution tests use the same page grab
  let sharedResult: { images: GrabbedImage[] };
  let sharedSrcs: string[];
  let sharedPage: Page;

  test.beforeAll(async ({ context, extensionId }) => {
    sharedPage = await context.newPage();
    await sharedPage.goto(`${FIXTURE_BASE}/fullsize-test-page.html`);
    await sharedPage.waitForLoadState('networkidle');
    await sharedPage.waitForTimeout(2000);

    const helper = await openHelperPage(context, extensionId);
    sharedResult = await grabImagesFromTab(helper, 'fullsize-test-page');
    await helper.close();
    sharedSrcs = sharedResult.images.map((img) => img.src);
  });

  test.afterAll(async () => {
    await sharedPage?.close();
  });

  test('auto-resolves direct image links (Case 2)', async () => {
    // Strategy A: parent <a href="images/IMG_0003.jpg"> should resolve the thumbnail
    expect(sharedSrcs.some((s) => s.includes('IMG_0003.jpg') && !s.includes('tn_'))).toBe(true);
    // The thumbnail URL should NOT appear as a src
    expect(sharedSrcs.some((s) => s.includes('tn_IMG_0003'))).toBe(false);
  });

  test('auto-resolves URL suffix patterns (Case 1 & 5)', async () => {
    // Case 1 (Imgur): Strategy B strips _d suffix from filename
    // photo_d.webp → photo.webp (suffix stripped from pathname)
    expect(sharedSrcs.some((s) => s.includes('/photo.webp') && !s.includes('_d'))).toBe(true);
    expect(sharedSrcs.some((s) => s.includes('photo_d'))).toBe(false);

    // Case 5: Strategy B strips _thumb suffix
    // landscape_thumb.jpg → landscape.jpg
    expect(sharedSrcs.some((s) => s.includes('/landscape.jpg') && !s.includes('_thumb'))).toBe(
      true,
    );
    expect(sharedSrcs.some((s) => s.includes('landscape_thumb'))).toBe(false);
  });

  test('auto-resolves data attributes (Case 4)', async () => {
    // Strategy C: data-high-res attribute should resolve to full image
    expect(sharedSrcs.some((s) => s.includes('photo-full.png'))).toBe(true);
    expect(sharedSrcs.some((s) => s.includes('photo-thumb.png'))).toBe(false);
  });

  test('stores linkedPageUrl for Flickr-style layouts (Case 3)', async () => {
    // The Flickr-style image should have linkedPageUrl set by Strategy A container search
    const flickrImage = sharedResult.images.find((img) => img.src.includes('55145287496'));
    expect(flickrImage).toBeDefined();
    expect(flickrImage!.linkedPageUrl).toBeDefined();
    expect(flickrImage!.linkedPageUrl).toContain('/photos/125877475/55145287496/');
  });

  test('stores linkedPageUrl and keeps thumbnail src for page links (Case 6)', async () => {
    // Strategy A finds <a href="imgpages/IMG_0006.html"> → sets linkedPageUrl
    // Strategy B should NOT run (linkedPageUrl is set), so src stays as thumbnail
    const case6Image = sharedResult.images.find((img) => img.src.includes('tn_IMG_0006'));
    expect(case6Image).toBeDefined();
    expect(case6Image!.linkedPageUrl).toBeDefined();
    expect(case6Image!.linkedPageUrl).toContain('imgpages/IMG_0006.html');
    // src should NOT be mangled by Strategy B
    expect(case6Image!.src).toContain('tn_IMG_0006');
  });
});

test.describe('Full-size image resolution (enhance)', () => {
  test('Enhance resolves OG images (Case 3)', async ({ context, extensionId }) => {
    const testPage = await context.newPage();
    await testPage.goto(`${FIXTURE_BASE}/fullsize-test-page.html`);
    await testPage.waitForLoadState('networkidle');
    await testPage.waitForTimeout(2000);

    const helper = await openHelperPage(context, extensionId);
    const result = await grabImagesFromTab(helper, 'fullsize-test-page');

    // Run enhance (Strategy D) on the grabbed images
    const enhanced = await enhanceImagesInTab(helper, 'fullsize-test-page', result.images);
    await helper.close();

    // The Flickr-style image should now be upgraded via OG meta
    const flickrImage = enhanced.images.find(
      (img) => img.src.includes('55145287496_full') || img.originalSrc?.includes('55145287496'),
    );
    expect(flickrImage).toBeDefined();
    expect(flickrImage!.src).toContain('55145287496_full.jpg');
    expect(flickrImage!.enhanced).toBe(true);

    await testPage.close();
  });

  test('Enhance resolves via page <img> fallback when no OG meta (Case 6)', async ({
    context,
    extensionId,
  }) => {
    const testPage = await context.newPage();
    await testPage.goto(`${FIXTURE_BASE}/fullsize-test-page.html`);
    await testPage.waitForLoadState('networkidle');
    await testPage.waitForTimeout(2000);

    const helper = await openHelperPage(context, extensionId);
    const result = await grabImagesFromTab(helper, 'fullsize-test-page');

    // Run enhance (Strategy D) on the grabbed images
    const enhanced = await enhanceImagesInTab(helper, 'fullsize-test-page', result.images);
    await helper.close();

    // The Case 6 image should be upgraded via the <img> on the linked page
    const case6Image = enhanced.images.find(
      (img) => img.src.includes('IMG_0006') || img.originalSrc?.includes('tn_IMG_0006'),
    );
    expect(case6Image).toBeDefined();
    expect(case6Image!.src).toContain('/images/IMG_0006.jpg');
    expect(case6Image!.src).not.toContain('tn_');
    expect(case6Image!.enhanced).toBe(true);

    await testPage.close();
  });
});

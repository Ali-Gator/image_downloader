import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ImageCandidate } from '@types';

import { collectImages } from '../contentScript/collectImages';

// Mock scanBackgroundImages — returns nothing by default
vi.mock('../utils/backgroundImageScanner', () => ({
  scanBackgroundImages: vi.fn(() => []),
}));

// Mock performance scanner — returns nothing by default
vi.mock('../utils/performanceImageScanner', () => ({
  scanPerformanceEntries: vi.fn(() => ({ urls: [], sizeMap: new Map() })),
  performanceUrlsToImageData: vi.fn(async () => []),
}));

const noopOptions = {
  includeXhrInPerf: false,
  drainPerfObserverCache: () => [] as ImageCandidate[],
};

/** Helper: create an <img> with controllable naturalWidth/naturalHeight */
function createImg(src: string, naturalWidth: number, naturalHeight: number): HTMLImageElement {
  const img = document.createElement('img');
  img.src = src;
  Object.defineProperty(img, 'naturalWidth', { value: naturalWidth, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { value: naturalHeight, configurable: true });
  return img;
}

describe('collectImages', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array when no images on the page', async () => {
    const result = await collectImages(noopOptions);
    expect(result.images).toHaveLength(0);
    expect(result.pageUrl).toBe(window.location.href);
  });

  it('collects img elements that meet size threshold', async () => {
    const img = createImg('https://example.com/photo.jpg', 500, 400);
    document.body.appendChild(img);

    const result = await collectImages(noopOptions);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].src).toBe('https://example.com/photo.jpg');
    expect(result.images[0].width).toBe(500);
    expect(result.images[0].height).toBe(400);
  });

  it('filters images smaller than MIN_SIZE_PX (10)', async () => {
    const img = createImg('https://example.com/icon.png', 5, 5);
    document.body.appendChild(img);

    const result = await collectImages(noopOptions);
    expect(result.images).toHaveLength(0);
  });

  it('deduplicates images with the same src', async () => {
    for (let i = 0; i < 3; i++) {
      const img = createImg('https://example.com/photo.jpg', 100, 100);
      document.body.appendChild(img);
    }

    const result = await collectImages(noopOptions);
    expect(result.images).toHaveLength(1);
  });

  it('collects multiple distinct images', async () => {
    document.body.appendChild(createImg('https://example.com/a.jpg', 200, 200));
    document.body.appendChild(createImg('https://example.com/b.jpg', 300, 300));
    document.body.appendChild(createImg('https://example.com/c.jpg', 100, 100));

    const result = await collectImages(noopOptions);
    expect(result.images).toHaveLength(3);
  });

  it('sorts images by area descending (largest first)', async () => {
    document.body.appendChild(createImg('https://example.com/small.jpg', 50, 50));
    document.body.appendChild(createImg('https://example.com/large.jpg', 500, 500));
    document.body.appendChild(createImg('https://example.com/medium.jpg', 200, 200));

    const result = await collectImages(noopOptions);
    expect(result.images[0].src).toBe('https://example.com/large.jpg');
    expect(result.images[1].src).toBe('https://example.com/medium.jpg');
    expect(result.images[2].src).toBe('https://example.com/small.jpg');
  });

  it('filters out placeholder data URLs', async () => {
    // data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7
    // is a common 1x1 transparent GIF placeholder
    const img = createImg(
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      100,
      100,
    );
    document.body.appendChild(img);

    const result = await collectImages(noopOptions);
    expect(result.images).toHaveLength(0);
  });

  it('collects SVG elements with data-src', async () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('data-src', 'https://example.com/icon.svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    document.body.appendChild(svg);

    const result = await collectImages(noopOptions);
    expect(result.images).toHaveLength(1);
    expect(result.images[0].src).toBe('https://example.com/icon.svg');
  });

  it('drains perfObserverCache via options', async () => {
    const cachedImage: ImageCandidate = {
      id: 'cached-1',
      src: 'https://example.com/perf-cached.jpg',
      alt: '',
      width: 300,
      height: 300,
      aspectRatio: 1,
      filename: 'perf-cached.jpg',
      fileSize: 1000,
      qualityScore: 0,
    };

    const drainMock = vi.fn(() => [cachedImage]);

    const result = await collectImages({
      includeXhrInPerf: false,
      drainPerfObserverCache: drainMock,
    });

    expect(drainMock).toHaveBeenCalledOnce();
    expect(result.images.some((img) => img.src === 'https://example.com/perf-cached.jpg')).toBe(
      true,
    );
  });

  it('does not include perfObserverCache duplicates of DOM images', async () => {
    document.body.appendChild(createImg('https://example.com/photo.jpg', 200, 200));

    const cachedImage: ImageCandidate = {
      id: 'cached-dup',
      src: 'https://example.com/photo.jpg',
      alt: '',
      width: 200,
      height: 200,
      aspectRatio: 1,
      filename: 'photo.jpg',
      fileSize: 1000,
      qualityScore: 0,
    };

    const result = await collectImages({
      includeXhrInPerf: false,
      drainPerfObserverCache: () => [cachedImage],
    });

    expect(result.images).toHaveLength(1);
  });

  it('limits results to MAX_FINAL_IMAGES (2000)', async () => {
    // Add 2001 images to test the cap — but jsdom is slow with many elements.
    // Instead, verify by adding perfObserverCache entries that push over the limit.
    const cached: ImageCandidate[] = [];
    for (let i = 0; i < 2001; i++) {
      cached.push({
        id: `img-${i}`,
        src: `https://example.com/img-${i}.jpg`,
        alt: '',
        width: 100,
        height: 100,
        aspectRatio: 1,
        filename: `img-${i}.jpg`,
        fileSize: 100,
        qualityScore: 0,
      });
    }

    const result = await collectImages({
      includeXhrInPerf: false,
      drainPerfObserverCache: () => cached,
    });

    expect(cached).toHaveLength(2001);
    expect(result.images).toHaveLength(2000);
  });
});

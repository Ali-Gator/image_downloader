import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

import {
  isFlutterApp,
  isCanvasHeavyApp,
  scanPerformanceEntries,
  performanceUrlsToImageData,
} from '../utils/performanceImageScanner';

describe('isFlutterApp', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('returns false on regular page', () => {
    expect(isFlutterApp()).toBe(false);
  });

  it('detects flt-glass-pane', () => {
    document.body.innerHTML = '<flt-glass-pane></flt-glass-pane>';
    expect(isFlutterApp()).toBe(true);
  });

  it('detects main.dart.js script', () => {
    const script = document.createElement('script');
    script.src = '/build/main.dart.js';
    document.head.appendChild(script);
    expect(isFlutterApp()).toBe(true);
  });

  it('detects flutter_service_worker script', () => {
    const script = document.createElement('script');
    script.src = '/flutter_service_worker.js';
    document.head.appendChild(script);
    expect(isFlutterApp()).toBe(true);
  });
});

describe('isCanvasHeavyApp', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns false when more images than canvases', () => {
    document.body.innerHTML = '<img/><img/><img/><canvas/>';
    expect(isCanvasHeavyApp()).toBe(false);
  });

  it('returns true when only canvases and no images', () => {
    document.body.innerHTML = '<canvas/><canvas/>';
    expect(isCanvasHeavyApp()).toBe(true);
  });

  it('returns false on a normal page with no canvas', () => {
    document.body.innerHTML = '<img/><img/>';
    expect(isCanvasHeavyApp()).toBe(false);
  });

  it('returns true for Flutter app regardless of img/canvas counts', () => {
    document.body.innerHTML = '<flt-glass-pane></flt-glass-pane><img/><img/><img/>';
    expect(isCanvasHeavyApp()).toBe(true);
  });
});

describe('scanPerformanceEntries', () => {
  let getEntriesByTypeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getEntriesByTypeSpy = vi.spyOn(window.performance, 'getEntriesByType');
  });

  afterEach(() => {
    getEntriesByTypeSpy.mockRestore();
  });

  it('returns empty when performance API unavailable', () => {
    const orig = window.performance;
    // @ts-expect-error — testing missing API
    delete (window as Record<string, unknown>).performance;
    expect(scanPerformanceEntries()).toEqual({ urls: [], sizeMap: new Map() });
    window.performance = orig;
  });

  it('includes img-initiated image resources always', () => {
    getEntriesByTypeSpy.mockReturnValue([
      {
        name: 'https://ex.com/photo.jpg',
        initiatorType: 'img',
        transferSize: 1000,
        encodedBodySize: 0,
      },
    ] as unknown as PerformanceResourceTiming[]);
    const { urls } = scanPerformanceEntries();
    expect(urls).toContain('https://ex.com/photo.jpg');
  });

  it('includes css-initiated image resources always', () => {
    getEntriesByTypeSpy.mockReturnValue([
      {
        name: 'https://ex.com/bg.png',
        initiatorType: 'css',
        transferSize: 0,
        encodedBodySize: 500,
      },
    ] as unknown as PerformanceResourceTiming[]);
    const { urls, sizeMap } = scanPerformanceEntries();
    expect(urls).toContain('https://ex.com/bg.png');
    expect(sizeMap.get('https://ex.com/bg.png')).toBe(500);
  });

  it('excludes xmlhttprequest resources by default', () => {
    getEntriesByTypeSpy.mockReturnValue([
      {
        name: 'https://ex.com/flutter-asset.jpg',
        initiatorType: 'xmlhttprequest',
        transferSize: 0,
        encodedBodySize: 0,
      },
    ] as unknown as PerformanceResourceTiming[]);
    const { urls } = scanPerformanceEntries({ includeXhr: false });
    expect(urls).toHaveLength(0);
  });

  it('includes xmlhttprequest resources when includeXhr=true', () => {
    getEntriesByTypeSpy.mockReturnValue([
      {
        name: 'https://ex.com/flutter-asset.jpg',
        initiatorType: 'xmlhttprequest',
        transferSize: 0,
        encodedBodySize: 0,
      },
    ] as unknown as PerformanceResourceTiming[]);
    const { urls } = scanPerformanceEntries({ includeXhr: true });
    expect(urls).toContain('https://ex.com/flutter-asset.jpg');
  });

  it('excludes non-image URLs', () => {
    getEntriesByTypeSpy.mockReturnValue([
      { name: 'https://ex.com/app.js', initiatorType: 'img', transferSize: 0, encodedBodySize: 0 },
      {
        name: 'https://ex.com/font.woff2',
        initiatorType: 'css',
        transferSize: 0,
        encodedBodySize: 0,
      },
      {
        name: 'https://ex.com/photo.jpg',
        initiatorType: 'img',
        transferSize: 0,
        encodedBodySize: 0,
      },
    ] as unknown as PerformanceResourceTiming[]);
    const { urls } = scanPerformanceEntries();
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://ex.com/photo.jpg');
  });

  it('deduplicates URLs', () => {
    getEntriesByTypeSpy.mockReturnValue([
      {
        name: 'https://ex.com/photo.jpg',
        initiatorType: 'img',
        transferSize: 0,
        encodedBodySize: 0,
      },
      {
        name: 'https://ex.com/photo.jpg',
        initiatorType: 'img',
        transferSize: 0,
        encodedBodySize: 0,
      },
    ] as unknown as PerformanceResourceTiming[]);
    const { urls } = scanPerformanceEntries();
    expect(urls).toHaveLength(1);
  });

  it('excludes blob and data URLs', () => {
    getEntriesByTypeSpy.mockReturnValue([
      {
        name: 'blob:https://ex.com/abc123',
        initiatorType: 'img',
        transferSize: 0,
        encodedBodySize: 0,
      },
      {
        name: 'data:image/png;base64,abc',
        initiatorType: 'img',
        transferSize: 0,
        encodedBodySize: 0,
      },
    ] as unknown as PerformanceResourceTiming[]);
    const { urls } = scanPerformanceEntries();
    expect(urls).toHaveLength(0);
  });

  it('builds sizeMap from transferSize', () => {
    getEntriesByTypeSpy.mockReturnValue([
      {
        name: 'https://ex.com/a.jpg',
        initiatorType: 'img',
        transferSize: 5000,
        encodedBodySize: 4000,
      },
      {
        name: 'https://ex.com/b.png',
        initiatorType: 'img',
        transferSize: 0,
        encodedBodySize: 3000,
      },
    ] as unknown as PerformanceResourceTiming[]);
    const { sizeMap } = scanPerformanceEntries();
    expect(sizeMap.get('https://ex.com/a.jpg')).toBe(5000);
    expect(sizeMap.get('https://ex.com/b.png')).toBe(3000);
  });
});

describe('performanceUrlsToImageData', () => {
  it('returns ImageData with probed dimensions (from cache)', async () => {
    // In jsdom, new Image() won't actually load, so dimensions will be 0x0 (timeout)
    const result = await performanceUrlsToImageData(
      ['https://ex.com/photo.jpg'],
      new Map([['https://ex.com/photo.jpg', 1234]]),
    );
    expect(result).toHaveLength(1);
    expect(result[0].src).toBe('https://ex.com/photo.jpg');
    expect(result[0].fileSize).toBe(1234);
    // Width/height will be 0 in jsdom since Image doesn't load
    expect(result[0].width).toBe(0);
    expect(result[0].height).toBe(0);
  }, 2000);

  it('generates a filename', async () => {
    const result = await performanceUrlsToImageData(['https://ex.com/my-photo.jpg']);
    expect(result[0].filename).toBeTruthy();
  }, 2000);

  it('uses sizeMap for fileSize', async () => {
    const sizeMap = new Map([
      ['https://ex.com/a.jpg', 5000],
      ['https://ex.com/b.png', 3000],
    ]);
    const result = await performanceUrlsToImageData(
      ['https://ex.com/a.jpg', 'https://ex.com/b.png'],
      sizeMap,
    );
    expect(result[0].fileSize).toBe(5000);
    expect(result[1].fileSize).toBe(3000);
  }, 2000);

  it('returns 0 fileSize when URL not in sizeMap', async () => {
    const result = await performanceUrlsToImageData(['https://ex.com/unknown.jpg'], new Map());
    expect(result[0].fileSize).toBe(0);
  }, 2000);
});

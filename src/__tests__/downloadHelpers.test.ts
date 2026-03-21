import { MessageActionType } from '../types';
import { debugLogger } from '../utils/debugLogger';
import { applyRenamePattern, downloadImage, extractDomain } from '../utils/downloadHelpers';

vi.mock('../utils/debugLogger', () => ({
  debugLogger: {
    log: vi.fn(),
    getEntries: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined),
    export: vi.fn().mockResolvedValue('[]'),
  },
}));

describe('extractDomain', () => {
  it('should extract domain from a URL with www prefix', () => {
    expect(extractDomain('https://www.example.com/path')).toBe('example.com');
  });

  it('should extract domain from a URL without www prefix', () => {
    expect(extractDomain('https://example.com')).toBe('example.com');
  });

  it('should preserve subdomains', () => {
    expect(extractDomain('https://sub.example.com')).toBe('sub.example.com');
  });

  it('should strip www from subdomain URLs', () => {
    expect(extractDomain('https://www.sub.example.com')).toBe('sub.example.com');
  });

  it('should return empty string for empty input', () => {
    expect(extractDomain('')).toBe('');
  });

  it('should return empty string for invalid URL', () => {
    expect(extractDomain('not a url at all')).toBe('');
  });

  it('should return empty string for chrome-extension:// URLs', () => {
    expect(extractDomain('chrome-extension://abcdefghijklmnop')).toBe('');
  });
});

describe('applyRenamePattern', () => {
  it('should return original name when pattern is empty', () => {
    expect(applyRenamePattern('photo.jpg', '')).toBe('photo.jpg');
  });

  it('should replace {name} with filename without extension', () => {
    expect(applyRenamePattern('photo.jpg', 'prefix_{name}')).toBe('prefix_photo.jpg');
  });

  it('should replace {site} with domain', () => {
    expect(applyRenamePattern('photo.jpg', '{site}_{name}', 'example.com')).toBe(
      'example.com_photo.jpg',
    );
  });

  it('should use "unknown" when domain is not provided and pattern has {site}', () => {
    expect(applyRenamePattern('photo.jpg', '{site}_{name}')).toBe('unknown_photo.jpg');
  });

  it('should use "unknown" when domain is empty string', () => {
    expect(applyRenamePattern('photo.jpg', '{site}_{name}', '')).toBe('unknown_photo.jpg');
  });

  it('should handle pattern with only {site}', () => {
    expect(applyRenamePattern('photo.jpg', '{site}', 'reddit.com')).toBe('reddit.com.jpg');
  });

  it('should handle pattern with only {name}', () => {
    expect(applyRenamePattern('photo.jpg', 'img_{name}')).toBe('img_photo.jpg');
  });

  it('should not double-append extension when {name} already included it conceptually', () => {
    // Pattern replaces {name} with name-without-ext, then appends original ext
    expect(applyRenamePattern('photo.jpg', '{name}')).toBe('photo.jpg');
  });

  it('should preserve extension when pattern has no dot', () => {
    expect(applyRenamePattern('image.png', '{site}_{name}', 'test.org')).toBe(
      'test.org_image.png',
    );
  });

  it('should handle filename without extension', () => {
    expect(applyRenamePattern('photo', '{site}_{name}', 'example.com')).toBe(
      'example.com_photo',
    );
  });

  it('should handle both placeholders in complex pattern', () => {
    expect(applyRenamePattern('banner.webp', 'dl_{site}_{name}_hd', 'imgur.com')).toBe(
      'dl_imgur.com_banner_hd.webp',
    );
  });
});

describe('downloadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset lastError
    Object.defineProperty(chrome.runtime, 'lastError', {
      get: () => undefined,
      configurable: true,
    });
  });

  it('returns { success: true, downloadId } when chrome.downloads.download succeeds', async () => {
    (chrome.downloads.download as ReturnType<typeof vi.fn>).mockImplementation(
      (_options: unknown, cb: (id: number) => void) => cb(42),
    );
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (_msg: unknown, cb?: () => void) => cb?.(),
    );

    const result = await downloadImage({
      src: 'https://example.com/image.jpg',
      filename: 'test.jpg',
    });

    expect(result).toEqual({ success: true, downloadId: 42 });
  });

  it('retries with generic filename when first attempt fails', async () => {
    let callCount = 0;
    (chrome.downloads.download as ReturnType<typeof vi.fn>).mockImplementation(
      (_options: unknown, cb: (id?: number) => void) => {
        callCount++;
        if (callCount === 1) {
          // First attempt — simulate lastError
          Object.defineProperty(chrome.runtime, 'lastError', {
            get: () => ({ message: 'Invalid filename' }),
            configurable: true,
          });
          cb(undefined);
        } else {
          // Retry — succeed
          Object.defineProperty(chrome.runtime, 'lastError', {
            get: () => undefined,
            configurable: true,
          });
          cb(99);
        }
      },
    );
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (_msg: unknown, cb?: () => void) => cb?.(),
    );

    const result = await downloadImage({
      src: 'https://example.com/image.jpg',
      filename: 'test.jpg',
    });

    expect(result.success).toBe(true);
    expect(callCount).toBe(2);
  });

  it('tries CORS fallback when both filename attempts fail', async () => {
    let downloadCallCount = 0;
    (chrome.downloads.download as ReturnType<typeof vi.fn>).mockImplementation(
      (_options: unknown, cb: (id?: number) => void) => {
        downloadCallCount++;
        if (downloadCallCount <= 2) {
          Object.defineProperty(chrome.runtime, 'lastError', {
            get: () => ({ message: 'Failed' }),
            configurable: true,
          });
          cb(undefined);
        } else {
          // CORS fallback download succeeds — clear lastError first
          Object.defineProperty(chrome.runtime, 'lastError', {
            get: () => undefined,
            configurable: true,
          });
          cb(200);
        }
      },
    );

    // sendMessage handles both REGISTER_FILENAME and FETCH_IMAGE
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (msg: Record<string, unknown>, cb?: (response?: unknown) => void) => {
        // Clear lastError for sendMessage calls
        Object.defineProperty(chrome.runtime, 'lastError', {
          get: () => undefined,
          configurable: true,
        });
        if (msg.msg === MessageActionType.FETCH_IMAGE) {
          cb?.({ dataUrl: 'data:image/jpeg;base64,/9j/4AAQ' });
        } else {
          cb?.();
        }
      },
    );

    const result = await downloadImage({
      src: 'https://example.com/image.jpg',
      filename: 'test.jpg',
    });

    expect(result.success).toBe(true);
    expect(result.downloadId).toBe(200);
  });

  it('rejects when all methods fail', async () => {
    (chrome.downloads.download as ReturnType<typeof vi.fn>).mockImplementation(
      (_options: unknown, cb: (id?: number) => void) => {
        Object.defineProperty(chrome.runtime, 'lastError', {
          get: () => ({ message: 'Blocked' }),
          configurable: true,
        });
        cb(undefined);
      },
    );

    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (msg: Record<string, unknown>, cb?: (response?: unknown) => void) => {
        if (msg.msg === MessageActionType.FETCH_IMAGE) {
          cb?.({ error: true, message: 'Network error' });
        } else {
          cb?.();
        }
      },
    );

    await expect(
      downloadImage({
        src: 'https://example.com/image.jpg',
        filename: 'test.jpg',
      }),
    ).rejects.toThrow();
  });

  it('logs error to debugLogger on failure', async () => {
    (chrome.downloads.download as ReturnType<typeof vi.fn>).mockImplementation(
      (_options: unknown, cb: (id?: number) => void) => {
        Object.defineProperty(chrome.runtime, 'lastError', {
          get: () => ({ message: 'Blocked' }),
          configurable: true,
        });
        cb(undefined);
      },
    );

    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (msg: Record<string, unknown>, cb?: (response?: unknown) => void) => {
        if (msg.msg === MessageActionType.FETCH_IMAGE) {
          cb?.({ error: true, message: 'Network error' });
        } else {
          cb?.();
        }
      },
    );

    await expect(
      downloadImage({
        src: 'https://example.com/image.jpg',
        filename: 'test.jpg',
      }),
    ).rejects.toThrow();

    expect(debugLogger.log).toHaveBeenCalledWith(
      'error',
      'download',
      expect.stringContaining('All download methods failed'),
      expect.objectContaining({ url: 'https://example.com/image.jpg' }),
    );
  });
});

import { MessageActionType } from '../types';
import { debugLogger } from '../utils/debugLogger';
import { downloadImage } from '../utils/downloadHelpers';

vi.mock('../utils/debugLogger', () => ({
  debugLogger: {
    log: vi.fn(),
    getEntries: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined),
    export: vi.fn().mockResolvedValue('[]'),
  },
}));

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

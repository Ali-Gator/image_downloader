import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ImageData } from '../types';
import { setupImageListener } from '../utils/messaging';

const makeImage = (id: string, src: string): ImageData => ({
  id,
  src,
  alt: '',
  width: 200,
  height: 200,
  aspectRatio: 1,
  filename: `${id}.jpg`,
  fileSize: 5000,
});

describe('setupImageListener', () => {
  let registeredListener: (...args: unknown[]) => unknown;
  const setImages = vi.fn();
  const setIsLoading = vi.fn();
  const setPageUrl = vi.fn();
  const setSourceTabId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Capture the listener registered with chrome.runtime.onMessage.addListener
    (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (listener: (...args: unknown[]) => unknown) => {
        registeredListener = listener;
      },
    );
  });

  it('calls setSourceTabId when payload has sourceTabId', () => {
    setupImageListener(setImages, setIsLoading, setPageUrl, setSourceTabId);

    const payload = {
      images: [makeImage('1', 'https://example.com/photo.jpg')],
      pageUrl: 'https://example.com',
      sourceTabId: 42,
    };
    const sendResponse = vi.fn();

    registeredListener(payload, {}, sendResponse);

    expect(setImages).toHaveBeenCalledWith(payload.images);
    expect(setPageUrl).toHaveBeenCalledWith('https://example.com');
    expect(setSourceTabId).toHaveBeenCalledWith(42);
    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(sendResponse).toHaveBeenCalledWith('OK');
  });

  it('does not crash when setSourceTabId is not provided', () => {
    setupImageListener(setImages, setIsLoading, setPageUrl);

    const payload = {
      images: [makeImage('1', 'https://example.com/photo.jpg')],
      pageUrl: 'https://example.com',
      sourceTabId: 42,
    };
    const sendResponse = vi.fn();

    registeredListener(payload, {}, sendResponse);

    expect(setImages).toHaveBeenCalled();
    expect(setSourceTabId).not.toHaveBeenCalled();
  });

  it('ignores empty payloads', () => {
    setupImageListener(setImages, setIsLoading, setPageUrl, setSourceTabId);

    const sendResponse = vi.fn();
    const result = registeredListener({ images: [], pageUrl: '' }, {}, sendResponse);

    expect(result).toBe(false);
    expect(setImages).not.toHaveBeenCalled();
    expect(setSourceTabId).not.toHaveBeenCalled();
  });

  it('returns cleanup function that removes listener', () => {
    const removeListener = setupImageListener(setImages, setIsLoading, setPageUrl);

    removeListener();

    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalled();
  });
});

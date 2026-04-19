import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  convertImageElementToFormat,
  convertImageUrlToFormat,
} from '../utils/imageConverter';

const makeCanvas = (toDataUrl = vi.fn().mockReturnValue('data:image/png;base64,abc')) => ({
  getContext: vi.fn().mockReturnValue({
    drawImage: vi.fn(),
  }),
  toDataURL: toDataUrl,
  width: 0,
  height: 0,
});

describe('convertImageElementToFormat', () => {
  let canvasMock: ReturnType<typeof makeCanvas>;

  beforeEach(() => {
    canvasMock = makeCanvas();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return canvasMock as unknown as HTMLElement;
      return document.createElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves with data URL for a supported format', async () => {
    canvasMock.toDataURL.mockReturnValue('data:image/jpeg;base64,xyz');
    const img = { naturalWidth: 100, naturalHeight: 50, width: 100, height: 50 } as HTMLImageElement;
    const result = await convertImageElementToFormat(img, 'jpeg');
    expect(result).toBe('data:image/jpeg;base64,xyz');
    expect(canvasMock.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.9);
  });

  it('rejects for an unsupported format', async () => {
    const img = {} as HTMLImageElement;
    await expect(convertImageElementToFormat(img, 'gif')).rejects.toThrow(
      'Unsupported target format: gif',
    );
  });

  it('rejects when canvas context is unavailable', async () => {
    canvasMock.getContext.mockReturnValue(null);
    const img = { naturalWidth: 10, naturalHeight: 10 } as HTMLImageElement;
    await expect(convertImageElementToFormat(img, 'png')).rejects.toThrow(
      'Failed to get canvas context',
    );
  });
});

describe('convertImageUrlToFormat', () => {
  let canvasMock: ReturnType<typeof makeCanvas>;
  const originalImage = global.Image;

  beforeEach(() => {
    canvasMock = makeCanvas(vi.fn().mockReturnValue('data:image/png;base64,converted'));
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return canvasMock as unknown as HTMLElement;
      return document.createElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.Image = originalImage;
  });

  const makeImageConstructor = (opts: { failLoad?: boolean } = {}) => {
    // Returns a constructor function that, when called with `new`, produces a stub
    // with onload/onerror triggered by setting .src
    return vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      Object.defineProperty(this, 'src', {
        set: (_url: string) => {
          if (opts.failLoad) (this.onerror as () => void)?.();
          else (this.onload as () => void)?.();
        },
      });
      this.naturalWidth = 100;
      this.naturalHeight = 80;
      this.width = 100;
      this.height = 80;
      this.crossOrigin = '';
    });
  };

  it('converts via direct load when crossOrigin succeeds', async () => {
    global.Image = makeImageConstructor() as unknown as typeof Image;

    const fetchFn = vi.fn();
    const result = await convertImageUrlToFormat('https://example.com/img.png', 'png', fetchFn);
    expect(result).toBe('data:image/png;base64,converted');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('falls back to fetchAsDataUrl when direct load fails', async () => {
    let callCount = 0;
    const constructors = [makeImageConstructor({ failLoad: true }), makeImageConstructor()];
    global.Image = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      const ctor = constructors[callCount++];
      ctor.call(this);
    }) as unknown as typeof Image;

    const fetchFn = vi.fn().mockResolvedValue('data:image/png;base64,proxied');
    const result = await convertImageUrlToFormat('https://cors.example/img.png', 'webp', fetchFn);
    expect(fetchFn).toHaveBeenCalledWith('https://cors.example/img.png');
    expect(result).toBe('data:image/png;base64,converted');
  });

  it('rejects for an unsupported format', async () => {
    const fetchFn = vi.fn();
    await expect(
      // @ts-expect-error — intentionally passing an unsupported format to hit the runtime guard
      convertImageUrlToFormat('https://example.com/img.gif', 'gif', fetchFn),
    ).rejects.toThrow('Unsupported target format: gif');
  });

  it('rejects when both direct load and proxy fail', async () => {
    global.Image = makeImageConstructor({ failLoad: true }) as unknown as typeof Image;
    const fetchFn = vi.fn().mockRejectedValue(new Error('proxy error'));
    await expect(
      convertImageUrlToFormat('https://cors.example/img.png', 'png', fetchFn),
    ).rejects.toThrow('proxy error');
  });
});

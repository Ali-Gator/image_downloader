import { useRatingStore, useSettingsStore } from '../store';
import { ImageData } from '../types';
import { debugLogger } from '../utils/debugLogger';
import { downloadImage } from '../utils/downloadHelpers';
import { downloadImagesWithConversion } from '../utils/downloadWithConversion';
import { createAndDownloadZipArchive } from '../utils/zipArchive';

// Mock downloadImage via downloadHelpers
vi.mock('../utils/downloadHelpers', () => ({
  downloadImage: vi.fn(),
  sanitizeFileName: vi.fn((name: string) => name),
}));

// Mock other deps to isolate
vi.mock('../utils/domImageUtils', () => ({
  getImageSrcFromDOM: vi.fn().mockResolvedValue(null),
}));

vi.mock('../utils/imageConverter', () => ({
  convertImageElementToFormat: vi.fn(),
}));

vi.mock('../utils/debugLogger', () => ({
  debugLogger: {
    log: vi.fn(),
    getEntries: vi.fn().mockResolvedValue([]),
    clear: vi.fn().mockResolvedValue(undefined),
    export: vi.fn().mockResolvedValue('[]'),
  },
}));

vi.mock('../utils/zipArchive', () => ({
  createAndDownloadZipArchive: vi.fn(),
}));

vi.mock('@utils/imageFormats', () => ({
  shouldConvertImage: vi.fn().mockReturnValue(false),
  updateFileExtension: vi.fn((name: string) => name),
}));

vi.mock('../utils/imageUtils', () => ({
  updateFilenameExtensionFromDataUrl: vi.fn((name: string) => name),
}));

const mockDownloadImage = downloadImage as ReturnType<typeof vi.fn>;
const mockCreateZip = createAndDownloadZipArchive as ReturnType<typeof vi.fn>;

const makeImage = (id: string): ImageData => ({
  id,
  src: `https://example.com/${id}.jpg`,
  alt: '',
  width: 100,
  height: 100,
  aspectRatio: 1,
  filename: `${id}.jpg`,
  fileSize: 1000,
});

describe('downloadImagesWithConversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock settings store
    const settingsState = {
      convertFrom: 'none',
      convertTo: 'none',
    };
    vi.spyOn(useSettingsStore, 'getState').mockReturnValue(
      settingsState as unknown as ReturnType<typeof useSettingsStore.getState>,
    );

    // Mock rating store
    const ratingState = {
      setHasSuccessfulDownload: vi.fn(),
    };
    vi.spyOn(useRatingStore, 'getState').mockReturnValue(
      ratingState as unknown as ReturnType<typeof useRatingStore.getState>,
    );
  });

  it('returns correct successCount and failCount', async () => {
    const images = [makeImage('a'), makeImage('b'), makeImage('c')];

    let callIdx = 0;
    mockDownloadImage.mockImplementation(async () => {
      callIdx++;
      if (callIdx === 2) throw new Error('fail');
      return { success: true, downloadId: callIdx };
    });

    const result = await downloadImagesWithConversion(images);

    expect(result.successCount).toBe(2);
    expect(result.failCount).toBe(1);
    expect(result.totalCount).toBe(3);
  });

  it('does not call setHasSuccessfulDownload when all fail', async () => {
    const images = [makeImage('a'), makeImage('b')];
    mockDownloadImage.mockRejectedValue(new Error('fail'));

    await downloadImagesWithConversion(images);

    expect(useRatingStore.getState().setHasSuccessfulDownload).not.toHaveBeenCalled();
  });

  it('calls setHasSuccessfulDownload when at least one succeeds', async () => {
    const images = [makeImage('a'), makeImage('b')];

    let callIdx = 0;
    mockDownloadImage.mockImplementation(async () => {
      callIdx++;
      if (callIdx === 1) throw new Error('fail');
      return { success: true, downloadId: 2 };
    });

    await downloadImagesWithConversion(images);

    expect(useRatingStore.getState().setHasSuccessfulDownload).toHaveBeenCalledWith(true);
  });

  it('logs failures to debugLogger', async () => {
    const images = [makeImage('a')];
    mockDownloadImage.mockRejectedValue(new Error('network error'));

    await downloadImagesWithConversion(images);

    expect(debugLogger.log).toHaveBeenCalledWith(
      'error',
      'download',
      'Bulk download item failed',
      expect.objectContaining({ src: 'https://example.com/a.jpg' }),
    );
  });

  it('calls createAndDownloadZipArchive when createZipArchive param is true', async () => {
    const images = [makeImage('a'), makeImage('b')];
    mockCreateZip.mockResolvedValue({ successCount: 2, totalCount: 2 });

    const result = await downloadImagesWithConversion(images, true);

    expect(mockCreateZip).toHaveBeenCalledWith(images, undefined);
    expect(result.successCount).toBe(2);
    expect(result.failCount).toBe(0);
    expect(mockDownloadImage).not.toHaveBeenCalled();
  });

  it('downloads individually when createZipArchive param is false', async () => {
    const images = [makeImage('a')];
    mockDownloadImage.mockResolvedValue({ success: true, downloadId: 1 });

    await downloadImagesWithConversion(images, false);

    expect(mockCreateZip).not.toHaveBeenCalled();
    expect(mockDownloadImage).toHaveBeenCalled();
  });

  describe('abort signal', () => {
    it('stops individual downloads when signal is already aborted', async () => {
      const images = [makeImage('a'), makeImage('b')];
      mockDownloadImage.mockResolvedValue({ success: true, downloadId: 1 });
      const controller = new AbortController();
      controller.abort();

      const result = await downloadImagesWithConversion(images, false, controller.signal);

      expect(result.cancelled).toBe(true);
      expect(result.successCount).toBe(0);
      expect(result.totalCount).toBe(2);
      expect(mockDownloadImage).not.toHaveBeenCalled();
    });

    it('stops remaining individual downloads when aborted mid-loop', async () => {
      const images = [makeImage('a'), makeImage('b'), makeImage('c')];
      const controller = new AbortController();

      mockDownloadImage.mockImplementation(async () => {
        controller.abort();
        return { success: true, downloadId: 1 };
      });

      const result = await downloadImagesWithConversion(images, false, controller.signal);

      expect(result.cancelled).toBe(true);
      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(2);
      expect(result.totalCount).toBe(3);
      expect(mockDownloadImage).toHaveBeenCalledTimes(1);
    });

    it('passes signal to createAndDownloadZipArchive in ZIP mode', async () => {
      const images = [makeImage('a')];
      const controller = new AbortController();
      mockCreateZip.mockResolvedValue({ successCount: 1, totalCount: 1 });

      await downloadImagesWithConversion(images, true, controller.signal);

      expect(mockCreateZip).toHaveBeenCalledWith(images, controller.signal);
    });

    it('forwards cancelled from ZIP result', async () => {
      const images = [makeImage('a'), makeImage('b')];
      mockCreateZip.mockResolvedValue({ successCount: 1, totalCount: 2, cancelled: true });

      const result = await downloadImagesWithConversion(images, true);

      expect(result.cancelled).toBe(true);
      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(1);
    });

    it('does not set cancelled when completing normally', async () => {
      const images = [makeImage('a')];
      mockDownloadImage.mockResolvedValue({ success: true, downloadId: 1 });

      const result = await downloadImagesWithConversion(images, false);

      expect(result.cancelled).toBeUndefined();
      expect(result.successCount).toBe(1);
    });
  });
});

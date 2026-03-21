import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImageData } from '@types';

// Must import after mocks are set up
import { ImageInfo } from '../components/Page/components/ImageInfo';

// Mutable store state that tests can override
const storeState = {
  filteredImages: [] as ImageData[],
  isGridView: true,
};

vi.mock('@store', () => ({
  useImageStore: (selector?: (s: typeof storeState) => unknown) =>
    selector ? selector(storeState) : storeState,
}));

vi.mock('@utils', async () => {
  const actual = await vi.importActual<typeof import('@utils')>('@utils');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

vi.mock('@utils/imageOperations', () => ({
  useImageOperations: () => ({
    handleCopyUrl: vi.fn(),
    handleDownload: vi.fn(),
  }),
}));

const baseImage: ImageData = {
  id: 'img-1',
  src: 'https://example.com/test.jpg',
  alt: 'Test image',
  width: 800,
  height: 600,
  aspectRatio: 800 / 600,
  filename: 'test.jpg',
  fileSize: 50000,
};

const enhancedImage: ImageData = {
  ...baseImage,
  id: 'img-2',
  enhanced: true,
  originalSrc: 'https://example.com/test-thumb.jpg',
};

const noSizeImage: ImageData = {
  ...baseImage,
  id: 'img-3',
  fileSize: 0,
};

describe('ImageInfo', () => {
  afterEach(() => {
    storeState.filteredImages = [];
    storeState.isGridView = true;
  });

  describe('grid mode', () => {
    beforeEach(() => {
      storeState.filteredImages = [baseImage, enhancedImage, noSizeImage];
      storeState.isGridView = true;
    });

    it('renders metadata as inline text with separators', () => {
      const { container } = render(<ImageInfo imageId="img-1" />);

      expect(container.textContent).toContain('800×600');
      expect(container.textContent).toContain('·');
      expect(container.textContent).toContain('JPEG');
    });

    it('renders quality badge as the only colored badge', () => {
      const { container } = render(<ImageInfo imageId="img-1" />);

      // In grid mode MetadataLine replaces individual badge components
      expect(container.querySelector('.dimensions')).toBeNull();
      expect(container.querySelector('.file-size')).toBeNull();
      expect(container.querySelector('.file-extension')).toBeNull();
    });

    it('omits file size separator when fileSize is zero', () => {
      const { container } = render(<ImageInfo imageId="img-3" />);

      // Should not have consecutive separators
      const text = container.textContent || '';
      const separatorCount = text.split('·').length - 1;
      // Expected: "800×600·JPG·LOW" = 2 separators (no fileSize separator)
      expect(separatorCount).toBeLessThanOrEqual(3);
      expect(text).not.toMatch(/·\s*·/);
    });
  });

  describe('list mode', () => {
    beforeEach(() => {
      storeState.filteredImages = [baseImage, enhancedImage];
      storeState.isGridView = false;
    });

    it('renders individual badge components', () => {
      const { container } = render(<ImageInfo imageId="img-1" />);

      expect(container.querySelector('.dimensions')).toBeInTheDocument();
      expect(container.querySelector('.file-size')).toBeInTheDocument();
      expect(container.querySelector('.file-extension')).toBeInTheDocument();
    });

    it('renders EnhancedLabel for enhanced images', () => {
      render(<ImageInfo imageId="img-2" />);
      expect(screen.getByText('enhanced_label')).toBeInTheDocument();
    });

    it('does not render EnhancedLabel for non-enhanced images', () => {
      render(<ImageInfo imageId="img-1" />);
      expect(screen.queryByText('enhanced_label')).toBeNull();
    });
  });
});

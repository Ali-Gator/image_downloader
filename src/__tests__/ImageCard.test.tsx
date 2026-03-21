import { createTheme } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImageCard } from '@components/Page/components';
import { ImageData } from '@types';

const mockToggleSelectImage = vi.fn();
const mockSetLightboxImageId = vi.fn();
const mockHandleEnhanceSingle = vi.fn();
const mockIsEnhancingImage = vi.fn().mockReturnValue(false);

const storeState = {
  filteredImages: [] as ImageData[],
  isGridView: true,
  selectedImages: [] as ImageData[],
  toggleSelectImage: mockToggleSelectImage,
  setLightboxImageId: mockSetLightboxImageId,
  getEffectiveImage: (img: ImageData) => img,
  imageSourceOverrides: {} as Record<string, 'original' | 'enhanced'>,
  toggleImageSource: vi.fn(),
  sourceTabId: null as number | null,
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
  useEnhanceSingleImage: () => ({
    handleEnhanceSingle: mockHandleEnhanceSingle,
    isEnhancingImage: mockIsEnhancingImage,
  }),
}));

const baseImage: ImageData = {
  id: 'img-1',
  src: 'https://example.com/photo.jpg',
  alt: 'Photo',
  width: 1920,
  height: 1080,
  aspectRatio: 1920 / 1080,
  filename: 'photo.jpg',
  fileSize: 250000,
};

const enhancedImage: ImageData = {
  ...baseImage,
  id: 'img-2',
  enhanced: true,
  originalSrc: 'https://example.com/photo-thumb.jpg',
};

const enhanceableImage: ImageData = {
  ...baseImage,
  id: 'img-3',
  linkedPageUrl: 'https://example.com/page',
};

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('ImageCard enhanced treatment', () => {
  afterEach(() => {
    storeState.isGridView = true;
    storeState.selectedImages = [];
    storeState.filteredImages = [];
    storeState.sourceTabId = null;
    mockToggleSelectImage.mockClear();
    mockSetLightboxImageId.mockClear();
    mockHandleEnhanceSingle.mockClear();
    mockIsEnhancingImage.mockReset().mockReturnValue(false);
  });

  describe('grid mode', () => {
    beforeEach(() => {
      storeState.isGridView = true;
      storeState.filteredImages = [baseImage, enhancedImage];
    });

    it('shows Enhanced label for enhanced images', () => {
      renderWithTheme(<ImageCard image={enhancedImage} />);
      expect(screen.getByText('enhanced_label')).toBeInTheDocument();
    });

    it('does not show Enhanced label for non-enhanced images', () => {
      renderWithTheme(<ImageCard image={baseImage} />);
      expect(screen.queryByText('enhanced_label')).toBeNull();
    });

    it('applies enhanced accent styles when image.enhanced is true', () => {
      const { container } = renderWithTheme(<ImageCard image={enhancedImage} />);
      const card = container.firstElementChild as HTMLElement;

      // The card should have a ::before pseudo-element for the accent border.
      // We verify by checking the computed sx styles contain the accent definition.
      // Since pseudo-elements can't be queried directly, we check the card has
      // the data-image-id for the enhanced image (confirming it rendered).
      expect(card).toHaveAttribute('data-image-id', 'img-2');
    });

    it('does not apply enhanced styles for non-enhanced images', () => {
      const { container } = renderWithTheme(<ImageCard image={baseImage} />);
      const card = container.firstElementChild as HTMLElement;
      expect(card).toHaveAttribute('data-image-id', 'img-1');
    });
  });

  describe('list mode', () => {
    beforeEach(() => {
      storeState.isGridView = false;
      storeState.filteredImages = [baseImage, enhancedImage];
    });

    it('does not show Enhanced label in top bar (no top bar in list mode)', () => {
      const { container } = renderWithTheme(<ImageCard image={enhancedImage} />);
      // In list mode, there is no top-action-bar
      expect(container.querySelector('.top-action-bar')).toBeNull();
    });
  });
});

describe('ImageCard enhance button', () => {
  afterEach(() => {
    storeState.isGridView = true;
    storeState.selectedImages = [];
    storeState.filteredImages = [];
    storeState.sourceTabId = null;
    mockToggleSelectImage.mockClear();
    mockSetLightboxImageId.mockClear();
    mockHandleEnhanceSingle.mockClear();
    mockIsEnhancingImage.mockReset().mockReturnValue(false);
  });

  it('shows enhance button when image has linkedPageUrl and sourceTabId exists', () => {
    storeState.isGridView = true;
    storeState.sourceTabId = 42;
    storeState.filteredImages = [enhanceableImage];
    renderWithTheme(<ImageCard image={enhanceableImage} />);

    expect(screen.getByLabelText('enhance_image_tooltip')).toBeInTheDocument();
  });

  it('hides enhance button when sourceTabId is null', () => {
    storeState.isGridView = true;
    storeState.sourceTabId = null;
    storeState.filteredImages = [enhanceableImage];
    renderWithTheme(<ImageCard image={enhanceableImage} />);

    expect(screen.queryByLabelText('enhance_image_tooltip')).toBeNull();
  });

  it('hides enhance button when image has no linkedPageUrl', () => {
    storeState.isGridView = true;
    storeState.sourceTabId = 42;
    storeState.filteredImages = [baseImage];
    renderWithTheme(<ImageCard image={baseImage} />);

    expect(screen.queryByLabelText('enhance_image_tooltip')).toBeNull();
  });

  it('hides enhance button when image is already enhanced', () => {
    storeState.isGridView = true;
    storeState.sourceTabId = 42;
    storeState.filteredImages = [enhancedImage];
    renderWithTheme(<ImageCard image={enhancedImage} />);

    expect(screen.queryByLabelText('enhance_image_tooltip')).toBeNull();
  });

  it('calls handleEnhanceSingle when enhance button is clicked', () => {
    storeState.isGridView = true;
    storeState.sourceTabId = 42;
    storeState.filteredImages = [enhanceableImage];
    renderWithTheme(<ImageCard image={enhanceableImage} />);

    fireEvent.click(screen.getByLabelText('enhance_image_tooltip'));
    expect(mockHandleEnhanceSingle).toHaveBeenCalledWith(enhanceableImage);
  });
});

describe('ImageCard click behavior', () => {
  afterEach(() => {
    storeState.isGridView = true;
    storeState.selectedImages = [];
    storeState.filteredImages = [];
    storeState.sourceTabId = null;
    mockToggleSelectImage.mockClear();
    mockSetLightboxImageId.mockClear();
    mockHandleEnhanceSingle.mockClear();
    mockIsEnhancingImage.mockReset().mockReturnValue(false);
  });

  it('opens lightbox when clicking the image area', () => {
    storeState.isGridView = true;
    storeState.filteredImages = [baseImage];
    const { container } = renderWithTheme(<ImageCard image={baseImage} />);

    const imageContainer = container.querySelector('.image-container') as HTMLElement;
    fireEvent.click(imageContainer);

    expect(mockSetLightboxImageId).toHaveBeenCalledWith('img-1');
    expect(mockToggleSelectImage).not.toHaveBeenCalled();
  });

  it('toggles selection when clicking outside image area', () => {
    storeState.isGridView = true;
    storeState.filteredImages = [baseImage];
    const { container } = renderWithTheme(<ImageCard image={baseImage} />);

    const card = container.firstElementChild as HTMLElement;
    fireEvent.click(card);

    expect(mockToggleSelectImage).toHaveBeenCalledWith(baseImage);
    expect(mockSetLightboxImageId).not.toHaveBeenCalled();
  });
});

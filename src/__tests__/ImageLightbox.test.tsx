import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImageData } from '@types';

import { ImageLightbox } from '../components/Page/components/ImageLightbox';

const mockSetLightboxImageId = vi.fn();
const mockToggleImageSource = vi.fn();

const images: ImageData[] = [
  {
    id: 'img-1',
    src: 'https://example.com/photo1.jpg',
    alt: 'Photo 1',
    width: 1920,
    height: 1080,
    aspectRatio: 1920 / 1080,
    filename: 'photo1.jpg',
    fileSize: 2500000,
  },
  {
    id: 'img-2',
    src: 'https://example.com/photo2.png',
    alt: 'Photo 2',
    width: 800,
    height: 600,
    aspectRatio: 800 / 600,
    filename: 'photo2.png',
    fileSize: 150000,
  },
  {
    id: 'img-3',
    src: 'https://example.com/photo3.webp',
    alt: 'Photo 3',
    width: 640,
    height: 480,
    aspectRatio: 640 / 480,
    filename: 'photo3.webp',
    fileSize: 80000,
  },
];

const storeState = {
  lightboxImageId: null as string | null,
  setLightboxImageId: mockSetLightboxImageId,
  filteredImages: images,
  toggleImageSource: mockToggleImageSource,
  imageSourceOverrides: {} as Record<string, 'original' | 'enhanced'>,
  getEffectiveImage: (img: ImageData) => {
    if (
      storeState.imageSourceOverrides[img.id] === 'original' &&
      img.enhanced &&
      img.originalSrc
    ) {
      return {
        ...img,
        src: img.originalSrc,
        width: img.originalWidth ?? img.width,
        height: img.originalHeight ?? img.height,
      };
    }
    return img;
  },
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

describe('ImageLightbox', () => {
  afterEach(() => {
    storeState.lightboxImageId = null;
    storeState.filteredImages = images;
    storeState.imageSourceOverrides = {};
    mockSetLightboxImageId.mockClear();
    mockToggleImageSource.mockClear();
  });

  it('renders nothing when lightboxImageId is null', () => {
    storeState.lightboxImageId = null;
    render(<ImageLightbox />);
    expect(screen.queryByTestId('lightbox-backdrop')).toBeNull();
  });

  it('renders image and metadata when lightboxImageId is set', () => {
    storeState.lightboxImageId = 'img-1';
    render(<ImageLightbox />);

    expect(screen.getByTestId('lightbox-backdrop')).toBeInTheDocument();
    expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
      'src',
      'https://example.com/photo1.jpg',
    );
    expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
    expect(screen.getByText(/1920×1080/)).toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    storeState.lightboxImageId = 'img-1';
    render(<ImageLightbox />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockSetLightboxImageId).toHaveBeenCalledWith(null);
  });

  it('closes on backdrop click', () => {
    storeState.lightboxImageId = 'img-1';
    render(<ImageLightbox />);

    fireEvent.click(screen.getByTestId('lightbox-backdrop'));
    expect(mockSetLightboxImageId).toHaveBeenCalledWith(null);
  });

  it('does not close when clicking the image itself', () => {
    storeState.lightboxImageId = 'img-1';
    render(<ImageLightbox />);

    fireEvent.click(screen.getByTestId('lightbox-image'));
    expect(mockSetLightboxImageId).not.toHaveBeenCalled();
  });

  it('navigates to next image on ArrowRight', () => {
    storeState.lightboxImageId = 'img-1';
    render(<ImageLightbox />);

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(mockSetLightboxImageId).toHaveBeenCalledWith('img-2');
  });

  it('navigates to previous image on ArrowLeft', () => {
    storeState.lightboxImageId = 'img-2';
    render(<ImageLightbox />);

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(mockSetLightboxImageId).toHaveBeenCalledWith('img-1');
  });

  it('hides left arrow on first image', () => {
    storeState.lightboxImageId = 'img-1';
    render(<ImageLightbox />);

    expect(screen.queryByTestId('lightbox-prev')).toBeNull();
    expect(screen.getByTestId('lightbox-next')).toBeInTheDocument();
  });

  it('hides right arrow on last image', () => {
    storeState.lightboxImageId = 'img-3';
    render(<ImageLightbox />);

    expect(screen.queryByTestId('lightbox-next')).toBeNull();
    expect(screen.getByTestId('lightbox-prev')).toBeInTheDocument();
  });

  it('shows image counter', () => {
    storeState.lightboxImageId = 'img-2';
    render(<ImageLightbox />);

    expect(screen.getByTestId('lightbox-counter')).toHaveTextContent('2 / 3');
  });

  it('does not navigate past first image on ArrowLeft', () => {
    storeState.lightboxImageId = 'img-1';
    render(<ImageLightbox />);

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(mockSetLightboxImageId).not.toHaveBeenCalled();
  });

  it('does not navigate past last image on ArrowRight', () => {
    storeState.lightboxImageId = 'img-3';
    render(<ImageLightbox />);

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(mockSetLightboxImageId).not.toHaveBeenCalled();
  });

  it('closes on X button click', () => {
    storeState.lightboxImageId = 'img-1';
    render(<ImageLightbox />);

    fireEvent.click(screen.getByTestId('lightbox-close'));
    expect(mockSetLightboxImageId).toHaveBeenCalledWith(null);
  });
});

describe('ImageLightbox — resolution toggle', () => {
  const enhancedImages: ImageData[] = [
    {
      id: 'enh-1',
      src: 'https://example.com/enhanced.jpg',
      alt: 'Enhanced',
      width: 1920,
      height: 1080,
      aspectRatio: 1920 / 1080,
      filename: 'enhanced.jpg',
      fileSize: 5000000,
      enhanced: true,
      originalSrc: 'https://example.com/thumb.jpg',
      originalWidth: 200,
      originalHeight: 150,
    },
    {
      id: 'normal-1',
      src: 'https://example.com/normal.jpg',
      alt: 'Normal',
      width: 800,
      height: 600,
      aspectRatio: 800 / 600,
      filename: 'normal.jpg',
      fileSize: 100000,
    },
  ];

  afterEach(() => {
    storeState.lightboxImageId = null;
    storeState.filteredImages = images;
    storeState.imageSourceOverrides = {};
    mockSetLightboxImageId.mockClear();
    mockToggleImageSource.mockClear();
  });

  it('shows toggle pills for enhanced images', () => {
    storeState.filteredImages = enhancedImages;
    storeState.lightboxImageId = 'enh-1';
    render(<ImageLightbox />);

    expect(screen.getByTestId('resolution-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-original')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-enhanced')).toBeInTheDocument();
  });

  it('does not show toggle for non-enhanced images', () => {
    storeState.filteredImages = enhancedImages;
    storeState.lightboxImageId = 'normal-1';
    render(<ImageLightbox />);

    expect(screen.queryByTestId('resolution-toggle')).toBeNull();
  });

  it('shows original dimensions in Original pill', () => {
    storeState.filteredImages = enhancedImages;
    storeState.lightboxImageId = 'enh-1';
    render(<ImageLightbox />);

    expect(screen.getByTestId('toggle-original')).toHaveTextContent('200×150');
  });

  it('shows enhanced dimensions in Enhanced pill', () => {
    storeState.filteredImages = enhancedImages;
    storeState.lightboxImageId = 'enh-1';
    render(<ImageLightbox />);

    expect(screen.getByTestId('toggle-enhanced')).toHaveTextContent('1920×1080');
  });

  it('switches displayed image when toggling to original', () => {
    storeState.filteredImages = enhancedImages;
    storeState.lightboxImageId = 'enh-1';
    storeState.imageSourceOverrides = { 'enh-1': 'original' };
    render(<ImageLightbox />);

    expect(screen.getByTestId('lightbox-image')).toHaveAttribute(
      'src',
      'https://example.com/thumb.jpg',
    );
    // Metadata line should show original dimensions
    const metadataBar = screen.getByTestId('lightbox-metadata');
    expect(metadataBar).toHaveTextContent('200×150');
  });
});

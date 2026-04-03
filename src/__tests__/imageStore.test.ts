import { beforeEach, describe, expect, it } from 'vitest';

import { useImageStore } from '../store/imageStore';
import { ImageData } from '../types';
import { QualityLevel } from '../utils/constants';

const makeImage = (id: string, src: string, overrides?: Partial<ImageData>): ImageData => ({
  id,
  src,
  alt: '',
  width: 100,
  height: 100,
  aspectRatio: 1,
  filename: `${id}.jpg`,
  fileSize: 1000,
  ...overrides,
});

describe('imageStore — sourceTabId', () => {
  beforeEach(() => {
    useImageStore.setState({
      images: [],
      filteredImages: [],
      selectedImages: [],
      pageUrl: null,
      sourceTabId: null,
    });
  });

  it('defaults to null', () => {
    expect(useImageStore.getState().sourceTabId).toBeNull();
  });

  it('stores and retrieves sourceTabId', () => {
    useImageStore.getState().setSourceTabId(42);
    expect(useImageStore.getState().sourceTabId).toBe(42);
  });

  it('can be reset to null', () => {
    useImageStore.getState().setSourceTabId(42);
    useImageStore.getState().setSourceTabId(null);
    expect(useImageStore.getState().sourceTabId).toBeNull();
  });
});

describe('imageStore — quality filter hides unknown dimensions', () => {
  const hdImage = makeImage('hd', 'https://example.com/hd.jpg', {
    width: 1920,
    height: 1080,
  });
  const medImage = makeImage('med', 'https://example.com/med.jpg', {
    width: 600,
    height: 600,
  });
  const lowImage = makeImage('low', 'https://example.com/low.jpg', {
    width: 50,
    height: 50,
  });
  const unknownImage = makeImage('unknown', 'https://example.com/unknown.jpg', {
    width: 0,
    height: 0,
  });

  beforeEach(() => {
    useImageStore.setState({
      images: [],
      filteredImages: [],
      selectedImages: [],
      qualityFilters: [QualityLevel.ALL],
    });
  });

  it('shows unknown dimension images when ALL is selected', () => {
    useImageStore.getState().setImages([hdImage, unknownImage]);
    const ids = useImageStore.getState().filteredImages.map((i) => i.id);
    expect(ids).toContain('unknown');
  });

  it('hides unknown dimension images when filtering by HD', () => {
    useImageStore.getState().setImages([hdImage, unknownImage]);
    useImageStore.getState().setQualityFilters([QualityLevel.HD]);
    const ids = useImageStore.getState().filteredImages.map((i) => i.id);
    expect(ids).toContain('hd');
    expect(ids).not.toContain('unknown');
  });

  it('hides unknown dimension images when filtering by Medium', () => {
    useImageStore.getState().setImages([medImage, unknownImage]);
    useImageStore.getState().setQualityFilters([QualityLevel.MEDIUM]);
    const ids = useImageStore.getState().filteredImages.map((i) => i.id);
    expect(ids).toContain('med');
    expect(ids).not.toContain('unknown');
  });

  it('hides unknown dimension images when filtering by Low', () => {
    useImageStore.getState().setImages([lowImage, unknownImage]);
    useImageStore.getState().setQualityFilters([QualityLevel.LOW]);
    const ids = useImageStore.getState().filteredImages.map((i) => i.id);
    expect(ids).toContain('low');
    expect(ids).not.toContain('unknown');
  });
});

describe('imageStore — imageSourceOverrides', () => {
  beforeEach(() => {
    useImageStore.setState({
      images: [],
      filteredImages: [],
      selectedImages: [],
      imageSourceOverrides: {},
    });
  });

  it('defaults to empty overrides', () => {
    expect(useImageStore.getState().imageSourceOverrides).toEqual({});
  });

  it('toggles image source between original and enhanced', () => {
    useImageStore.getState().toggleImageSource('img-1');
    expect(useImageStore.getState().imageSourceOverrides['img-1']).toBe('original');

    useImageStore.getState().toggleImageSource('img-1');
    expect(useImageStore.getState().imageSourceOverrides['img-1']).toBe('enhanced');
  });

  it('toggles independently for different images', () => {
    useImageStore.getState().toggleImageSource('img-1');
    useImageStore.getState().toggleImageSource('img-2');
    expect(useImageStore.getState().imageSourceOverrides['img-1']).toBe('original');
    expect(useImageStore.getState().imageSourceOverrides['img-2']).toBe('original');

    useImageStore.getState().toggleImageSource('img-1');
    expect(useImageStore.getState().imageSourceOverrides['img-1']).toBe('enhanced');
    expect(useImageStore.getState().imageSourceOverrides['img-2']).toBe('original');
  });
});

describe('imageStore — getEffectiveImage', () => {
  const enhancedImage = makeImage('enh-1', 'https://example.com/enhanced.jpg', {
    width: 1920,
    height: 1080,
    enhanced: true,
    originalSrc: 'https://example.com/thumb.jpg',
    originalWidth: 200,
    originalHeight: 150,
  });

  const normalImage = makeImage('norm-1', 'https://example.com/normal.jpg', {
    width: 800,
    height: 600,
  });

  beforeEach(() => {
    useImageStore.setState({
      images: [],
      filteredImages: [],
      selectedImages: [],
      imageSourceOverrides: {},
    });
  });

  it('returns original image when no override', () => {
    const result = useImageStore.getState().getEffectiveImage(enhancedImage);
    expect(result.src).toBe('https://example.com/enhanced.jpg');
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  it('swaps to original src/dimensions when override is original', () => {
    useImageStore.getState().toggleImageSource('enh-1');
    const result = useImageStore.getState().getEffectiveImage(enhancedImage);
    expect(result.src).toBe('https://example.com/thumb.jpg');
    expect(result.width).toBe(200);
    expect(result.height).toBe(150);
  });

  it('returns enhanced after toggling back', () => {
    useImageStore.getState().toggleImageSource('enh-1');
    useImageStore.getState().toggleImageSource('enh-1');
    const result = useImageStore.getState().getEffectiveImage(enhancedImage);
    expect(result.src).toBe('https://example.com/enhanced.jpg');
    expect(result.width).toBe(1920);
  });

  it('does not affect non-enhanced images', () => {
    useImageStore.getState().toggleImageSource('norm-1');
    const result = useImageStore.getState().getEffectiveImage(normalImage);
    expect(result.src).toBe('https://example.com/normal.jpg');
    expect(result.width).toBe(800);
  });
});

describe('imageStore — setImages auto-selects all', () => {
  beforeEach(() => {
    useImageStore.setState({
      images: [],
      filteredImages: [],
      selectedImages: [],
      qualityFilters: [QualityLevel.ALL],
    });
  });

  it('selects all images after setImages', () => {
    const images = [
      makeImage('a', 'https://example.com/a.jpg'),
      makeImage('b', 'https://example.com/b.jpg'),
    ];
    useImageStore.getState().setImages(images);
    const { selectedImages, filteredImages } = useImageStore.getState();
    expect(selectedImages).toHaveLength(2);
    expect(selectedImages.map((i) => i.id)).toEqual(filteredImages.map((i) => i.id));
  });

  it('selects only filtered images when quality filter is active', () => {
    useImageStore.setState({ qualityFilters: [QualityLevel.HD] });
    const hdImage = makeImage('hd', 'https://example.com/hd.jpg', { width: 1920, height: 1080 });
    const lowImage = makeImage('low', 'https://example.com/low.jpg', { width: 50, height: 50 });
    useImageStore.getState().setImages([hdImage, lowImage]);
    const { selectedImages } = useImageStore.getState();
    expect(selectedImages).toHaveLength(1);
    expect(selectedImages[0].id).toBe('hd');
  });

  it('selects all on rescan when all were previously selected', () => {
    const img1 = makeImage('a', 'https://example.com/a.jpg');
    const img2 = makeImage('b', 'https://example.com/b.jpg');
    useImageStore.getState().setImages([img1]);
    expect(useImageStore.getState().selectedImages).toHaveLength(1);

    const img3 = makeImage('c', 'https://example.com/c.jpg');
    useImageStore.getState().setImages([img1, img2, img3]);
    const ids = useImageStore.getState().selectedImages.map((i) => i.id);
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('preserves partial selection on rescan', () => {
    const img1 = makeImage('a', 'https://example.com/a.jpg');
    const img2 = makeImage('b', 'https://example.com/b.jpg');
    useImageStore.getState().setImages([img1, img2]);
    // Deselect one — partial selection
    useImageStore.getState().toggleSelectImage(img2);
    expect(useImageStore.getState().selectedImages).toHaveLength(1);

    const img3 = makeImage('c', 'https://example.com/c.jpg');
    useImageStore.getState().setImages([img1, img2, img3]);
    const ids = useImageStore.getState().selectedImages.map((i) => i.id);
    expect(ids).toEqual(['a']);
  });

  it('drops selection for images removed on rescan', () => {
    const img1 = makeImage('a', 'https://example.com/a.jpg');
    const img2 = makeImage('b', 'https://example.com/b.jpg');
    const img3 = makeImage('c', 'https://example.com/c.jpg');
    useImageStore.getState().setImages([img1, img2, img3]);
    // Deselect one — partial selection
    useImageStore.getState().toggleSelectImage(img3);
    expect(useImageStore.getState().selectedImages.map((i) => i.id)).toEqual(['a', 'b']);

    // Rescan returns only img1 and img3 (img2 gone)
    useImageStore.getState().setImages([img1, img3]);
    const ids = useImageStore.getState().selectedImages.map((i) => i.id);
    expect(ids).toEqual(['a']);
  });
});

describe('imageStore — setImages preserves sourceTabId', () => {
  beforeEach(() => {
    useImageStore.setState({
      images: [],
      filteredImages: [],
      selectedImages: [],
      pageUrl: null,
      sourceTabId: 99,
    });
  });

  it('setImages does not clear sourceTabId', () => {
    const img = makeImage('1', 'https://example.com/a.jpg');
    useImageStore.getState().setImages([img]);
    expect(useImageStore.getState().sourceTabId).toBe(99);
    expect(useImageStore.getState().images).toHaveLength(1);
  });
});

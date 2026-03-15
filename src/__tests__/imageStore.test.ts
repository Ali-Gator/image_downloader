import { describe, it, expect, beforeEach } from 'vitest';

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

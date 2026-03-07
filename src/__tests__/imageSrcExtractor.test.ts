import {
  parseSrcset,
  normalizeImageUrl,
  getBestSrcFromElement,
  getPictureSourceUrl,
  extractBackgroundImageUrls,
  isPlaceholderDataUrl,
} from '../utils/imageSrcExtractor';

describe('parseSrcset', () => {
  it('returns highest width-descriptor URL', () => {
    const result = parseSrcset('img-400.jpg 400w, img-800.jpg 800w, img-1600.jpg 1600w');
    expect(result).toBe('img-1600.jpg');
  });

  it('returns highest pixel-ratio URL', () => {
    const result = parseSrcset('img.jpg 1x, img@2x.jpg 2x');
    expect(result).toBe('img@2x.jpg');
  });

  it('handles single URL without descriptor', () => {
    expect(parseSrcset('img.jpg')).toBe('img.jpg');
  });

  it('returns null for empty input', () => {
    expect(parseSrcset('')).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    expect(parseSrcset('   ')).toBeNull();
  });

  it('handles URLs with commas in query params without crashing', () => {
    expect(() => parseSrcset('bad,input,here')).not.toThrow();
  });

  it('handles mixed width and pixel-ratio descriptors', () => {
    const result = parseSrcset('small.jpg 1x, large.jpg 1200w');
    // 1200w > 1x*1000=1000, so large.jpg wins
    expect(result).toBe('large.jpg');
  });
});

describe('normalizeImageUrl', () => {
  it('removes width param', () => {
    expect(normalizeImageUrl('https://cdn.ex.com/img.jpg?w=400')).toBe(
      'https://cdn.ex.com/img.jpg',
    );
  });

  it('removes multiple resize params but keeps others', () => {
    const url = 'https://cdn.ex.com/img.jpg?w=400&quality=80&token=abc123';
    expect(normalizeImageUrl(url)).toBe('https://cdn.ex.com/img.jpg?token=abc123');
  });

  it('returns original URL if parsing fails', () => {
    expect(normalizeImageUrl('not-a-url')).toBe('not-a-url');
  });

  it('removes trailing ? when all params removed', () => {
    const result = normalizeImageUrl('https://ex.com/img.jpg?w=400&h=300');
    expect(result).not.toContain('?');
  });

  it('is case-insensitive for param names', () => {
    expect(normalizeImageUrl('https://cdn.ex.com/img.jpg?Width=400')).toBe(
      'https://cdn.ex.com/img.jpg',
    );
  });
});

describe('getBestSrcFromElement', () => {
  it('prefers srcset over src', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/thumb.jpg';
    img.srcset = 'https://example.com/small.jpg 400w, https://example.com/large.jpg 1200w';
    expect(getBestSrcFromElement(img)).toBe('https://example.com/large.jpg');
  });

  it('falls back to data-src when srcset is empty', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/placeholder.gif';
    img.dataset.src = 'https://example.com/real-image.jpg';
    expect(getBestSrcFromElement(img)).toBe('https://example.com/real-image.jpg');
  });

  it('falls back to img.src as last resort', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/real-image.jpg';
    expect(getBestSrcFromElement(img)).toBe('https://example.com/real-image.jpg');
  });

  it('skips placeholder data URLs in srcset', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/real.jpg';
    img.srcset = 'data:image/gif;base64,R0lGOD 1x';
    expect(getBestSrcFromElement(img)).toBe('https://example.com/real.jpg');
  });

  it('uses data-lazy attribute', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/placeholder.gif';
    img.dataset.lazy = 'https://example.com/lazy-loaded.jpg';
    expect(getBestSrcFromElement(img)).toBe('https://example.com/lazy-loaded.jpg');
  });

  it('uses data-original attribute', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/placeholder.gif';
    img.dataset.original = 'https://example.com/original.jpg';
    expect(getBestSrcFromElement(img)).toBe('https://example.com/original.jpg');
  });
});

describe('getPictureSourceUrl', () => {
  it('returns null when parent is not picture', () => {
    const img = document.createElement('img');
    document.body.appendChild(img);
    expect(getPictureSourceUrl(img)).toBeNull();
    document.body.removeChild(img);
  });

  it('returns best source URL from picture element', () => {
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.setAttribute(
      'srcset',
      'https://example.com/small.webp 400w, https://example.com/large.webp 1200w',
    );
    const img = document.createElement('img');
    img.src = 'https://example.com/fallback.jpg';
    picture.appendChild(source);
    picture.appendChild(img);
    document.body.appendChild(picture);

    expect(getPictureSourceUrl(img)).toBe('https://example.com/large.webp');

    document.body.removeChild(picture);
  });

  it('handles data-srcset on source elements', () => {
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.setAttribute('data-srcset', 'https://example.com/lazy.webp 800w');
    const img = document.createElement('img');
    picture.appendChild(source);
    picture.appendChild(img);
    document.body.appendChild(picture);

    expect(getPictureSourceUrl(img)).toBe('https://example.com/lazy.webp');

    document.body.removeChild(picture);
  });
});

describe('isPlaceholderDataUrl', () => {
  it('returns true for short gif data URLs', () => {
    expect(
      isPlaceholderDataUrl(
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      ),
    ).toBe(true);
  });

  it('returns false for long gif data URLs', () => {
    const longData = 'data:image/gif;base64,' + 'A'.repeat(300);
    expect(isPlaceholderDataUrl(longData)).toBe(false);
  });

  it('returns true for short svg data URLs', () => {
    expect(isPlaceholderDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).toBe(true);
  });

  it('returns false for non-gif/svg data URLs', () => {
    expect(isPlaceholderDataUrl('data:image/png;base64,short')).toBe(false);
  });

  it('returns false for regular URLs', () => {
    expect(isPlaceholderDataUrl('https://example.com/image.gif')).toBe(false);
  });
});

describe('extractBackgroundImageUrls', () => {
  it('returns empty array for elements without background', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(extractBackgroundImageUrls(div)).toEqual([]);
    document.body.removeChild(div);
  });
});

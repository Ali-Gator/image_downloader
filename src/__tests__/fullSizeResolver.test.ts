import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  extractMainImageFromHtml,
  extractOgImageFromHtml,
  resolveDataAttributes,
  resolveParentAnchorUrl,
  resolveUrlPatternCleanup,
} from '../utils/fullSizeResolver';

// Mock debugLogger to avoid chrome.storage dependency in tests
vi.mock('../utils/debugLogger', () => ({
  debugLogger: {
    log: vi.fn(),
  },
}));

describe('resolveParentAnchorUrl (Strategy A)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves when parent <a> has direct image href', () => {
    document.body.innerHTML = `
      <a href="https://example.com/full.jpg">
        <img src="https://example.com/thumb.jpg" id="target">
      </a>
    `;
    const img = document.getElementById('target') as HTMLImageElement;
    const result = resolveParentAnchorUrl(img);
    expect(result).toEqual({ imageUrl: 'https://example.com/full.jpg' });
  });

  it('returns pageUrl when parent <a> href is not an image', () => {
    document.body.innerHTML = `
      <a href="https://example.com/gallery">
        <img src="https://example.com/thumb.jpg" id="target">
      </a>
    `;
    const img = document.getElementById('target') as HTMLImageElement;
    const result = resolveParentAnchorUrl(img);
    expect(result).toEqual({ pageUrl: 'https://example.com/gallery' });
  });

  it('finds sibling <a> via container search', () => {
    document.body.innerHTML = `
      <div class="photo-container">
        <img src="https://example.com/thumb.jpg" id="target">
        <a href="https://example.com/full.jpg">View</a>
      </div>
    `;
    const img = document.getElementById('target') as HTMLImageElement;
    const result = resolveParentAnchorUrl(img);
    expect(result).toEqual({ imageUrl: 'https://example.com/full.jpg' });
  });

  it('finds <a> deep in sibling subtree (Flickr-style)', () => {
    document.body.innerHTML = `
      <div class="photo-container">
        <img src="https://example.com/thumb.jpg" id="target">
        <div class="interaction-view">
          <div class="photo-interaction">
            <a href="https://example.com/photos/123/456/">View</a>
          </div>
        </div>
      </div>
    `;
    const img = document.getElementById('target') as HTMLImageElement;
    const result = resolveParentAnchorUrl(img);
    expect(result).toEqual({ pageUrl: 'https://example.com/photos/123/456/' });
  });

  it('returns null when no links found', () => {
    document.body.innerHTML = `
      <div>
        <img src="https://example.com/photo.jpg" id="target">
      </div>
    `;
    const img = document.getElementById('target') as HTMLImageElement;
    expect(resolveParentAnchorUrl(img)).toBeNull();
  });

  it('ignores # and javascript: hrefs', () => {
    document.body.innerHTML = `
      <a href="#">
        <img src="https://example.com/thumb.jpg" id="target">
      </a>
    `;
    const img = document.getElementById('target') as HTMLImageElement;
    expect(resolveParentAnchorUrl(img)).toBeNull();
  });

  it('prefers direct image URL over page URL in container', () => {
    document.body.innerHTML = `
      <div class="card">
        <img src="https://example.com/thumb.jpg" id="target">
        <a href="https://example.com/gallery/1">Gallery</a>
        <a href="https://example.com/full.png">Full</a>
      </div>
    `;
    const img = document.getElementById('target') as HTMLImageElement;
    const result = resolveParentAnchorUrl(img);
    expect(result).toEqual({ imageUrl: 'https://example.com/full.png' });
  });
});

describe('resolveUrlPatternCleanup (Strategy B)', () => {
  it('strips _thumb suffix', () => {
    const result = resolveUrlPatternCleanup('https://example.com/photo_thumb.jpg');
    expect(result).toBe('https://example.com/photo.jpg');
  });

  it('strips _500 numeric suffix', () => {
    const result = resolveUrlPatternCleanup('https://example.com/photo_500.jpg');
    expect(result).toBe('https://example.com/photo.jpg');
  });

  it('strips _150x150 dimension suffix', () => {
    const result = resolveUrlPatternCleanup('https://example.com/photo_150x150.jpg');
    expect(result).toBe('https://example.com/photo.jpg');
  });

  it('strips -small suffix', () => {
    const result = resolveUrlPatternCleanup('https://example.com/photo-small.jpg');
    expect(result).toBe('https://example.com/photo.jpg');
  });

  it('strips /thumbs/ path segment', () => {
    const result = resolveUrlPatternCleanup('https://example.com/thumbs/photo.jpg');
    expect(result).toBe('https://example.com/photo.jpg');
  });

  it('strips /thumbnails/ path segment', () => {
    const result = resolveUrlPatternCleanup('https://example.com/images/thumbnails/photo.jpg');
    expect(result).toBe('https://example.com/images/photo.jpg');
  });

  it('does NOT modify thumb_drive.jpg (no false positive)', () => {
    const result = resolveUrlPatternCleanup('https://example.com/thumb_drive.jpg');
    expect(result).toBeNull();
  });

  it('does NOT modify christmas.jpg', () => {
    const result = resolveUrlPatternCleanup('https://example.com/christmas.jpg');
    expect(result).toBeNull();
  });

  it('returns null when URL is unchanged', () => {
    const result = resolveUrlPatternCleanup('https://example.com/photo.jpg');
    expect(result).toBeNull();
  });

  it('strips _d suffix (imgur style)', () => {
    const result = resolveUrlPatternCleanup('https://i.imgur.com/photo_d.webp');
    expect(result).toBe('https://i.imgur.com/photo.webp');
  });

  it('strips _medium suffix', () => {
    const result = resolveUrlPatternCleanup('https://example.com/photo_medium.jpg');
    expect(result).toBe('https://example.com/photo.jpg');
  });

  it('strips -preview suffix', () => {
    const result = resolveUrlPatternCleanup('https://example.com/photo-preview.png');
    expect(result).toBe('https://example.com/photo.png');
  });

  it('strips small two-digit size suffix like _10', () => {
    const result = resolveUrlPatternCleanup('https://example.com/photo_10.jpg');
    expect(result).toBe('https://example.com/photo.jpg');
  });

  it('does NOT strip leading-zero numeric IDs like _0024', () => {
    const result = resolveUrlPatternCleanup('https://example.com/IMG_0024.jpg');
    expect(result).toBeNull();
  });

  it('does NOT strip _0001 (sequential ID, not size)', () => {
    const result = resolveUrlPatternCleanup('https://example.com/photo_0001.jpg');
    expect(result).toBeNull();
  });

  it('handles invalid URLs gracefully', () => {
    expect(resolveUrlPatternCleanup('not a url')).toBeNull();
  });
});

describe('resolveDataAttributes (Strategy C)', () => {
  it('returns data-high-res value', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/thumb.jpg';
    img.setAttribute('data-high-res', 'https://example.com/full.jpg');
    expect(resolveDataAttributes(img)).toBe('https://example.com/full.jpg');
  });

  it('returns data-large value', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/thumb.jpg';
    img.setAttribute('data-large', 'https://example.com/large.jpg');
    expect(resolveDataAttributes(img)).toBe('https://example.com/large.jpg');
  });

  it('finds wildcard data attr matching pattern', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/thumb.jpg';
    img.setAttribute('data-fullsize-url', 'https://example.com/fullsize.jpg');
    expect(resolveDataAttributes(img)).toBe('https://example.com/fullsize.jpg');
  });

  it('finds data-original-large via wildcard', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/thumb.jpg';
    img.setAttribute('data-original-large', 'https://example.com/original-large.jpg');
    expect(resolveDataAttributes(img)).toBe('https://example.com/original-large.jpg');
  });

  it('ignores attribute with same value as src', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/photo.jpg';
    img.setAttribute('data-high-res', 'https://example.com/photo.jpg');
    expect(resolveDataAttributes(img)).toBeNull();
  });

  it('returns null when no relevant attributes', () => {
    const img = document.createElement('img');
    img.src = 'https://example.com/photo.jpg';
    expect(resolveDataAttributes(img)).toBeNull();
  });
});

describe('extractOgImageFromHtml (Strategy D parser)', () => {
  it('extracts og:image from standard meta tag', () => {
    const html = `
      <html><head>
        <meta property="og:image" content="https://example.com/og-image.jpg">
      </head><body></body></html>
    `;
    expect(extractOgImageFromHtml(html)).toBe('https://example.com/og-image.jpg');
  });

  it('extracts og:image with reversed attribute order', () => {
    const html = `
      <html><head>
        <meta content="https://example.com/og-image.jpg" property="og:image">
      </head><body></body></html>
    `;
    expect(extractOgImageFromHtml(html)).toBe('https://example.com/og-image.jpg');
  });

  it('extracts twitter:image when og:image is absent', () => {
    const html = `
      <html><head>
        <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
      </head><body></body></html>
    `;
    expect(extractOgImageFromHtml(html)).toBe('https://example.com/twitter-image.jpg');
  });

  it('prefers og:image over twitter:image', () => {
    const html = `
      <html><head>
        <meta property="og:image" content="https://example.com/og.jpg">
        <meta name="twitter:image" content="https://example.com/twitter.jpg">
      </head><body></body></html>
    `;
    expect(extractOgImageFromHtml(html)).toBe('https://example.com/og.jpg');
  });

  it('returns null for HTML without meta tags', () => {
    const html = '<html><head><title>No images</title></head><body></body></html>';
    expect(extractOgImageFromHtml(html)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractOgImageFromHtml('')).toBeNull();
  });

  it('handles single-quoted content attribute', () => {
    const html = `<meta property='og:image' content='https://example.com/img.jpg'>`;
    expect(extractOgImageFromHtml(html)).toBe('https://example.com/img.jpg');
  });
});

describe('extractMainImageFromHtml (Strategy D fallback)', () => {
  it('extracts first image with valid extension', () => {
    const html = `
      <html><body>
        <img src="../images/IMG_0024.JPG">
      </body></html>
    `;
    const result = extractMainImageFromHtml(html, 'https://example.com/imgpages/IMG_0024.html');
    expect(result).toBe('https://example.com/images/IMG_0024.JPG');
  });

  it('resolves relative URLs against page URL', () => {
    const html = `<img src="photos/big.jpg">`;
    const result = extractMainImageFromHtml(html, 'https://example.com/gallery/page1.html');
    expect(result).toBe('https://example.com/gallery/photos/big.jpg');
  });

  it('returns absolute URLs as-is', () => {
    const html = `<img src="https://cdn.example.com/photo.jpg">`;
    const result = extractMainImageFromHtml(html, 'https://example.com/page.html');
    expect(result).toBe('https://cdn.example.com/photo.jpg');
  });

  it('skips icon/logo/spacer images', () => {
    const html = `
      <img src="icon-nav.png">
      <img src="logo.jpg">
      <img src="photos/real.jpg">
    `;
    const result = extractMainImageFromHtml(html, 'https://example.com/page.html');
    expect(result).toBe('https://example.com/photos/real.jpg');
  });

  it('skips non-image extensions', () => {
    const html = `<img src="widget.html"><img src="photo.jpg">`;
    const result = extractMainImageFromHtml(html, 'https://example.com/page.html');
    expect(result).toBe('https://example.com/photo.jpg');
  });

  it('returns null when no valid images found', () => {
    const html = `<html><body><p>No images here</p></body></html>`;
    expect(extractMainImageFromHtml(html, 'https://example.com/page.html')).toBeNull();
  });

  it('returns null for empty HTML', () => {
    expect(extractMainImageFromHtml('', 'https://example.com/page.html')).toBeNull();
  });
});

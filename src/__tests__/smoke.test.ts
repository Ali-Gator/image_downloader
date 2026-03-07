import { describe, expect, it } from 'vitest';

import { sanitizeFileName } from '../utils/downloadHelpers';
import { getQualityFromDimensions } from '../utils/imageUtils';

describe('smoke tests — verify test setup works', () => {
  it('sanitizeFileName removes unsafe chars', () => {
    expect(sanitizeFileName('my:file?.jpg')).toBe('my_file_.jpg');
  });

  it('getQualityFromDimensions returns HD for large images', () => {
    expect(getQualityFromDimensions(1920, 1080)).toBe('hd');
  });

  it('chrome mock is available', () => {
    expect(chrome.runtime.id).toBe('test-extension-id');
  });
});

import { describe, expect, it } from 'vitest';

import { CONTEXT_MENU_FORMAT_BY_ID, ContextMenuIds } from '../utils/constants';

describe('ContextMenuIds', () => {
  it('no longer has SAVE_THIS_IMAGE', () => {
    expect(Object.values(ContextMenuIds)).not.toContain('save-this-image');
  });

  it('has three format item ids', () => {
    expect(ContextMenuIds.SAVE_AS_JPG).toBe('save-as-jpg');
    expect(ContextMenuIds.SAVE_AS_PNG).toBe('save-as-png');
    expect(ContextMenuIds.SAVE_AS_WEBP).toBe('save-as-webp');
  });
});

describe('CONTEXT_MENU_FORMAT_BY_ID', () => {
  it('maps each id to the correct format', () => {
    expect(CONTEXT_MENU_FORMAT_BY_ID['save-as-jpg']).toBe('jpeg');
    expect(CONTEXT_MENU_FORMAT_BY_ID['save-as-png']).toBe('png');
    expect(CONTEXT_MENU_FORMAT_BY_ID['save-as-webp']).toBe('webp');
  });

  it('returns undefined for unknown ids', () => {
    expect(CONTEXT_MENU_FORMAT_BY_ID['save-this-image']).toBeUndefined();
    expect(CONTEXT_MENU_FORMAT_BY_ID['open-image-downloader']).toBeUndefined();
  });
});

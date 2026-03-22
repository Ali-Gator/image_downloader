import { describe, expect, it } from 'vitest';

import { isSidePanelContext, isSidePanelSupported } from '../utils/sidePanelUtils';

describe('isSidePanelSupported', () => {
  it('returns true when chrome.sidePanel is defined', () => {
    expect(isSidePanelSupported()).toBe(true);
  });

  it('returns false when chrome.sidePanel is undefined', () => {
    const original = (chrome as Record<string, unknown>).sidePanel;
    delete (chrome as Record<string, unknown>).sidePanel;
    expect(isSidePanelSupported()).toBe(false);
    (chrome as Record<string, unknown>).sidePanel = original;
  });
});

describe('isSidePanelContext', () => {
  it('returns false when pathname is not sidepanel.html', () => {
    // In jsdom test environment, pathname is '/'
    expect(isSidePanelContext()).toBe(false);
  });

  it('returns a boolean', () => {
    expect(typeof isSidePanelContext()).toBe('boolean');
  });

  it('returns the same value on repeated calls (memoized)', () => {
    expect(isSidePanelContext()).toBe(isSidePanelContext());
  });
});

import { describe, it, expect } from 'vitest';

import { MessageActionType } from '../types';

describe('MessageActionType', () => {
  it('includes RESCAN_IMAGES', () => {
    expect(MessageActionType.RESCAN_IMAGES).toBe('rescanImages');
  });

  it('includes GRAB_IMAGES', () => {
    expect(MessageActionType.GRAB_IMAGES).toBe('grabImages');
  });
});

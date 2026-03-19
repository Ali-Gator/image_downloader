import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StorageKeys } from '../utils/constants';
import { getSettingFromStorage } from '../utils/settingsReader';

describe('getSettingFromStorage', () => {
  beforeEach(() => {
    vi.mocked(chrome.storage.local.get).mockImplementation((_keys) => {
      return Promise.resolve({}) as unknown as ReturnType<typeof chrome.storage.local.get>;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default when storage is empty', async () => {
    const result = await getSettingFromStorage('maxOgFetches', 50);
    expect(result).toBe(50);
  });

  it('returns stored value from Zustand {state: {...}} format', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementation(() => {
      return Promise.resolve({
        [StorageKeys.SETTINGS_STORE_KEY]: JSON.stringify({
          state: { maxOgFetches: 100 },
          version: 0,
        }),
      }) as unknown as ReturnType<typeof chrome.storage.local.get>;
    });

    const result = await getSettingFromStorage('maxOgFetches', 50);
    expect(result).toBe(100);
  });

  it('returns stored value from raw object format', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementation(() => {
      return Promise.resolve({
        [StorageKeys.SETTINGS_STORE_KEY]: { maxBgImages: 300 },
      }) as unknown as ReturnType<typeof chrome.storage.local.get>;
    });

    const result = await getSettingFromStorage('maxBgImages', 200);
    expect(result).toBe(300);
  });

  it('returns default on storage error', async () => {
    vi.mocked(chrome.storage.local.get).mockImplementation(() => {
      throw new Error('Storage error');
    });

    const result = await getSettingFromStorage('maxOgFetches', 50);
    expect(result).toBe(50);
  });
});

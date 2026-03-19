import { DEFAULT_OPTIONS, StorageKeys } from './constants';

/**
 * Reads a single setting from chrome.storage.local (Zustand persist format).
 * Used by content scripts that cannot access the Zustand store directly.
 */
export async function getSettingFromStorage<T>(
  field: keyof typeof DEFAULT_OPTIONS,
  defaultValue: T,
): Promise<T> {
  try {
    const result = await chrome.storage.local.get(StorageKeys.SETTINGS_STORE_KEY);
    const raw = result[StorageKeys.SETTINGS_STORE_KEY];
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const data = parsed?.state ?? parsed;
    return (data?.[field] as T) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

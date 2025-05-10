import { chromeStorage } from './chromeStorage';

const isChromeStorageAvailable =
  typeof chrome !== 'undefined' &&
  chrome.storage &&
  chrome.storage.local &&
  typeof chrome.storage.local.get === 'function';

export const fallbackStorage = isChromeStorageAvailable
  ? chromeStorage
  : {
      getItem: (name: string): Promise<string | null> =>
        Promise.resolve(localStorage.getItem(name)),
      setItem: (name: string, value: string): Promise<void> => {
        localStorage.setItem(name, value);
        return Promise.resolve();
      },
      removeItem: (name: string): Promise<void> => {
        localStorage.removeItem(name);
        return Promise.resolve();
      },
    }; 
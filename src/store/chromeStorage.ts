import { captureMessage } from '../utils/sentryCapturer';

export const chromeStorage = {
  getItem: (name: string): Promise<string | null> =>
    new Promise((resolve) => {
      if (!chrome.storage?.local) {
        captureMessage('chrome.storage.local is not available in getItem', 'error');
        return resolve(null);
      }
      chrome.storage.local.get([name], (result) => {
        resolve(result[name] ?? null);
      });
    }),
  setItem: (name: string, value: string): Promise<void> =>
    new Promise((resolve) => {
      if (!chrome.storage?.local) {
        captureMessage('chrome.storage.local is not available in setItem', 'error');
        return resolve();
      }
      chrome.storage.local.set({ [name]: value }, () => resolve());
    }),
  removeItem: (name: string): Promise<void> =>
    new Promise((resolve) => {
      if (!chrome.storage?.local) {
        captureMessage('chrome.storage.local is not available in removeItem', 'error');
        return resolve();
      }
      chrome.storage.local.remove([name], () => resolve());
    }),
}; 
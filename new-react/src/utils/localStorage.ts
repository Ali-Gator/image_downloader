/* eslint-disable no-undef */
import { isChromeExtension } from './utils';

export const storageSet = (key: string, value: string | number | boolean) => {
  if (isChromeExtension()) {
    chrome.storage.local.set({ [key]: value });
  } else {
    localStorage.setItem(key, value.toString());
  }
};

export const storageGet = (key: string, callback: (arg: any) => void) => {
  if (isChromeExtension()) {
    chrome.storage.local.get(key, (result) => {
      const value = result[key];

      if (typeof callback === 'function') {
        callback(value);
      }
    });
  } else {
    const value = localStorage.getItem(key);
    if (typeof callback === 'function') {
      callback(value);
    }
  }
};

export const storageWatch = (key: string, callback: (data: string) => any) => {
  if (isChromeExtension()) {
    chrome.storage.onChanged.addListener((changes) => {
      if (typeof callback === 'function' && changes[key]) {
        callback(changes[key].newValue);
      }
    });
  }
};

export function isChromeExtension() {
  // eslint-disable-next-line no-undef
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

import { PlaceholderImages } from '@utils/constants';

export function isChromeExtension() {
  // eslint-disable-next-line no-undef
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}
/**
 * Returns true when both dimensions are known (> 0) and at least one is
 * at or below the minimum size threshold.  0×0 means "unknown" and is
 * intentionally kept (probe timeout ≠ tiny image).
 */
export function isTinyImage(width: number, height: number): boolean {
  return (
    width > 0 &&
    height > 0 &&
    (width <= PlaceholderImages.MIN_SIZE_PX || height <= PlaceholderImages.MIN_SIZE_PX)
  );
}

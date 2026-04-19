/**
 * Image conversion utilities for content script context
 * Works directly with DOM image elements to avoid CORS issues
 */

import { CANVAS_MIME_TYPES, FORMAT_QUALITY, isOutputFormatSupported } from './imageFormats';

const loadImage = (src: string, crossOrigin?: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });

const drawImageToDataUrl = (
  img: HTMLImageElement,
  mimeType: string,
  quality: number,
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL(mimeType, quality);
};

export const convertImageElementToFormat = async (
  imgElement: HTMLImageElement,
  targetFormat: string,
  quality?: number,
): Promise<string> => {
  if (!isOutputFormatSupported(targetFormat)) {
    throw new Error(`Unsupported target format: ${targetFormat}`);
  }
  const mimeType = CANVAS_MIME_TYPES[targetFormat as keyof typeof CANVAS_MIME_TYPES];
  if (!mimeType) {
    throw new Error(`No MIME type found for format: ${targetFormat}`);
  }
  const finalQuality = quality ?? FORMAT_QUALITY[targetFormat as keyof typeof FORMAT_QUALITY];
  return drawImageToDataUrl(imgElement, mimeType, finalQuality);
};

/**
 * Tries crossOrigin anonymous load first; falls back to a proxied fetch through the background
 * FETCH_IMAGE handler when CORS blocks direct access or the canvas taints.
 */
export const convertImageUrlToFormat = async (
  url: string,
  targetFormat: 'jpeg' | 'png' | 'webp',
  fetchAsDataUrl: (u: string) => Promise<string>,
): Promise<string> => {
  if (!isOutputFormatSupported(targetFormat)) {
    throw new Error(`Unsupported target format: ${targetFormat}`);
  }

  const mimeType = CANVAS_MIME_TYPES[targetFormat];
  const quality = FORMAT_QUALITY[targetFormat];

  try {
    const img = await loadImage(url, 'anonymous');
    return drawImageToDataUrl(img, mimeType, quality);
  } catch {
    const proxiedDataUrl = await fetchAsDataUrl(url);
    const img = await loadImage(proxiedDataUrl);
    return drawImageToDataUrl(img, mimeType, quality);
  }
};

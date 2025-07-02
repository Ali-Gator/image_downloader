/**
 * Image conversion utilities for content script context
 * Works directly with DOM image elements to avoid CORS issues
 */

import { CANVAS_MIME_TYPES, FORMAT_QUALITY, isOutputFormatSupported } from './imageFormats';

/**
 * Convert image element to different format using Canvas API
 * @param imgElement HTML Image element from the page
 * @param targetFormat Target format (jpeg, png, webp)
 * @param quality Quality setting (0-1), optional
 * @returns Promise with converted image data URL
 */
export const convertImageElementToFormat = async (
  imgElement: HTMLImageElement,
  targetFormat: string,
  quality?: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate target format
    if (!isOutputFormatSupported(targetFormat)) {
      reject(new Error(`Unsupported target format: ${targetFormat}`));
      return;
    }

    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas dimensions to match image
      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;

      // Draw image on canvas
      ctx.drawImage(imgElement, 0, 0);

      // Get MIME type for target format
      const mimeType = CANVAS_MIME_TYPES[targetFormat as keyof typeof CANVAS_MIME_TYPES];
      if (!mimeType) {
        reject(new Error(`No MIME type found for format: ${targetFormat}`));
        return;
      }

      // Use provided quality or default for format
      const finalQuality = quality ?? FORMAT_QUALITY[targetFormat as keyof typeof FORMAT_QUALITY];

      // Convert to target format
      const convertedDataUrl = canvas.toDataURL(mimeType, finalQuality);

      // Cleanup
      canvas.remove();

      resolve(convertedDataUrl);
    } catch (error) {
      reject(error);
    }
  });
};

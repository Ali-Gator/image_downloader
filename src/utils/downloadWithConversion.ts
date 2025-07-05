import { shouldConvertImage, updateFileExtension } from '@utils/imageFormats';

import { getImageSrcFromDOM } from './domImageUtils';
import { downloadImage } from './downloadHelpers';
import { convertImageElementToFormat } from './imageConverter';
import { updateFilenameExtensionFromDataUrl } from './imageUtils';
import { useSettingsStore } from '../store';
import { ImageData } from '../types';

/**
 * Downloads an image with conversion if needed
 * Handles both single image downloads and bulk downloads
 * @param image Image data object
 * @param options Optional download options
 * @returns Promise that resolves when download is complete
 */
export const downloadImageWithConversion = async (
  image: ImageData | { src: string; filename: string; id?: string },
  options?: {
    skipConversion?: boolean;
  },
): Promise<void> => {
  const { skipConversion = false } = options || {};
  const { src, filename, id } = image;

  // Force refresh settings from storage to get latest values
  await useSettingsStore.getState().refreshSettings();

  // Get conversion settings (fresh read each time)
  const { convertFrom, convertTo } = useSettingsStore.getState();

  // Check if conversion is needed
  const needsConversion = shouldConvertImage(filename, convertFrom);
  const conversionEnabled = !skipConversion && convertFrom !== 'none' && convertTo !== 'none';
  const willConvert = conversionEnabled && needsConversion;

  // ALWAYS try to get image from DOM first (this was the original working behavior)
  try {
    if (willConvert) {
      // Need conversion - get image element for conversion
      const imgElement = document.querySelector(`[data-image-id="${id}"] img`) as HTMLImageElement;
      if (imgElement) {
        try {
          const convertedDataUrl = await convertImageElementToFormat(imgElement, convertTo);
          const newFilename = updateFileExtension(filename, convertTo);

          await downloadImage({
            src: convertedDataUrl,
            filename: newFilename,
          });
          return;
        } catch (conversionError) {
          // Remove all console.log and console.warn except for real errors (console.error)
        }
      }
    }

    // No conversion needed or conversion failed - use original image src
    const originalSrc = await getImageSrcFromDOM({ id, filename });

    if (originalSrc) {
      // Update filename extension based on actual format if it's a data URL
      const correctedFilename = originalSrc.startsWith('data:')
        ? updateFilenameExtensionFromDataUrl(filename, originalSrc)
        : filename;

      await downloadImage({
        src: originalSrc,
        filename: correctedFilename,
      });
      return;
    }
  } catch (domError) {
    // Remove all console.log and console.warn except for real errors (console.error)
  }

  // Fallback to original download
  await downloadImage({ src, filename });
};

/**
 * Downloads multiple images with conversion
 * @param images Array of image data
 * @returns Promise with download results
 */
export const downloadImagesWithConversion = async (
  images: ImageData[],
): Promise<{ successCount: number; totalCount: number }> => {
  let successCount = 0;
  const totalCount = images.length;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    try {
      await downloadImageWithConversion(image);
      successCount++;
    } catch (error) {
      // Remove all console.log and console.warn except for real errors (console.error)
    }
  }

  return { successCount, totalCount };
};

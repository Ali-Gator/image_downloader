import { shouldConvertImage, updateFileExtension } from '@utils/imageFormats';

import { debugLogger } from './debugLogger';
import { getImageSrcFromDOM } from './domImageUtils';
import { downloadImage } from './downloadHelpers';
import { convertImageElementToFormat } from './imageConverter';
import { updateFilenameExtensionFromDataUrl } from './imageUtils';
import { createAndDownloadZipArchive } from './zipArchive';
import { useImageStore, useRatingStore, useSettingsStore } from '../store';
import { BulkDownloadResult, DownloadResult, ImageData } from '../types';

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
): Promise<DownloadResult> => {
  const { skipConversion = false } = options || {};
  const { src, filename, id } = image;

  debugLogger.log('info', 'download', 'Download initiated', { src, filename, id });

  // Read conversion settings (caller is responsible for refreshSettings before calling)
  const { convertFrom, convertTo } = useSettingsStore.getState();
  const pageUrl = useImageStore.getState().pageUrl || undefined;

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

          return await downloadImage({
            src: convertedDataUrl,
            filename: newFilename,
            pageUrl,
          });
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

      return await downloadImage({
        src: originalSrc,
        filename: correctedFilename,
        pageUrl,
      });
    }
  } catch (domError) {
    // Remove all console.log and console.warn except for real errors (console.error)
  }

  // Fallback to original download
  return await downloadImage({ src, filename, pageUrl });
};

/**
 * Downloads multiple images with conversion or as ZIP archive
 * @param images Array of image data
 * @param createZipArchive Whether to create a ZIP archive
 * @returns Promise with download results
 */
export const downloadImagesWithConversion = async (
  images: ImageData[],
  createZipArchive = false,
): Promise<BulkDownloadResult> => {
  // If ZIP archive is enabled and we have multiple images, create ZIP
  if (createZipArchive && images.length > 0) {
    const zipResult = await createAndDownloadZipArchive(images);
    return { ...zipResult, failCount: zipResult.totalCount - zipResult.successCount };
  }

  // Otherwise, download images individually (original behavior)
  let successCount = 0;
  const totalCount = images.length;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    try {
      const result = await downloadImageWithConversion(image);
      if (result.success) {
        successCount++;
      }
    } catch (error) {
      debugLogger.log('error', 'download', 'Bulk download item failed', {
        src: image.src,
        error: String(error),
      });
    }
  }

  // Notify store about successful downloads
  if (successCount > 0) {
    useRatingStore.getState().setHasSuccessfulDownload(true);
  }

  return { successCount, failCount: totalCount - successCount, totalCount };
};

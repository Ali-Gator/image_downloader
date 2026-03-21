// Local JSZip types
interface JSZipFileOptions {
  base64?: boolean;
  binary?: boolean;
  date?: Date;
  compression?: string;
  compressionOptions?: Record<string, unknown>;
  comment?: string;
  optimizedBinaryString?: boolean;
  createFolders?: boolean;
  unixPermissions?: number;
  dosPermissions?: number;
}

interface JSZipGenerateOptions {
  type?: 'base64' | 'binarystring' | 'array' | 'uint8array' | 'arraybuffer' | 'blob' | 'nodebuffer';
  compression?: 'STORE' | 'DEFLATE';
  compressionOptions?: {
    level?: number;
  };
  comment?: string;
  mimeType?: string;
  encodeFileName?: (filename: string) => string;
  streamFiles?: boolean;
  platform?: 'DOS' | 'UNIX';
}

interface JSZipObject {
  name: string;
  dir: boolean;
  date: Date;
  comment: string;
  unixPermissions?: number;
  dosPermissions?: number;
  options: JSZipFileOptions;
}

interface JSZipInstance {
  file(path: string): JSZipObject | null;
  file(
    path: string,
    data:
      | string
      | ArrayBuffer
      | Uint8Array
      | Blob
      | Promise<string | ArrayBuffer | Uint8Array | Blob>,
    options?: JSZipFileOptions,
  ): JSZipInstance;
  folder(name: string): JSZipInstance | null;
  remove(path: string): JSZipInstance;
  generateAsync(options?: JSZipGenerateOptions): Promise<Blob>;
  loadAsync(
    data: string | ArrayBuffer | Uint8Array | Blob,
    options?: Record<string, unknown>,
  ): Promise<JSZipInstance>;
  forEach(callback: (relativePath: string, file: JSZipObject) => void): void;
  filter(predicate: (relativePath: string, file: JSZipObject) => boolean): JSZipObject[];
  files: { [key: string]: JSZipObject };
}

interface JSZipClass {
  new (): JSZipInstance;
}

// Dynamic import function to load JSZip
const loadJSZip = async (): Promise<JSZipClass> => {
  // Use the npm package JSZip
  const JSZip = (await import('jszip')).default;
  return JSZip as JSZipClass;
};

import { useImageStore, useRatingStore, useSettingsStore } from '@store';
import { ImageData, MessageActionType } from '@types';

import { getImageSrcFromDOM } from './domImageUtils';
import { sanitizeFileName, applyRenamePattern, extractDomain } from './downloadHelpers';
import { convertImageElementToFormat } from './imageConverter';
import { shouldConvertImage, updateFileExtension } from './imageFormats';
import { updateFilenameExtensionFromDataUrl } from './imageUtils';

/**
 * Generates a ZIP archive filename based on settings and current context
 * @param imageCount Number of images in the archive
 * @returns Sanitized ZIP filename
 */
export const generateZipArchiveName = (imageCount: number): string => {
  const settings = useSettingsStore.getState();
  const { folderName } = settings;

  // Get current date and time for filename
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss

  // Create filename components
  const folderPart = folderName || 'images';
  const countPart = imageCount > 1 ? `_${imageCount}_items` : '';
  const datePart = `${dateStr}_${timeStr}`;

  // Combine all parts
  const filename = `${folderPart}${countPart}_${datePart}.zip`;

  return sanitizeFileName(filename, 100);
};

interface ZipBatchOptions {
  convertFrom: string;
  convertTo: string;
  renamePattern: string;
  domain: string;
}

/**
 * Downloads an image as a blob for adding to ZIP archive
 * @param image Image data object
 * @param options Batch-level settings (shared across all images)
 * @returns Promise with blob data and processed filename
 */
const downloadImageAsBlob = async (
  image: ImageData,
  options: ZipBatchOptions,
): Promise<{ blob: Blob; filename: string }> => {
  const { src, filename, id } = image;
  const { convertFrom, convertTo, renamePattern, domain } = options;

  // Check if conversion is needed
  const needsConversion = shouldConvertImage(filename, convertFrom);
  const conversionEnabled = convertFrom !== 'none' && convertTo !== 'none';
  const willConvert = conversionEnabled && needsConversion;

  let finalSrc = src;
  let finalFilename = filename;

  // Apply rename pattern if specified
  if (renamePattern) {
    finalFilename = applyRenamePattern(finalFilename, renamePattern, domain);
  }

  try {
    // Try to get image from DOM first (for better quality)
    if (willConvert && id) {
      const imgElement = document.querySelector(`[data-image-id="${id}"] img`) as HTMLImageElement;
      if (imgElement) {
        try {
          const convertedDataUrl = await convertImageElementToFormat(imgElement, convertTo);
          finalSrc = convertedDataUrl;
          finalFilename = updateFileExtension(finalFilename, convertTo);
        } catch (conversionError) {
          // Fallback to original if conversion fails
        }
      }
    }

    // If no conversion or conversion failed, try to get original from DOM
    if (finalSrc === src && id) {
      try {
        const originalSrc = await getImageSrcFromDOM({ id, filename });
        if (originalSrc) {
          finalSrc = originalSrc;
          // Update filename extension if it's a data URL
          if (originalSrc.startsWith('data:')) {
            finalFilename = updateFilenameExtensionFromDataUrl(finalFilename, originalSrc);
          }
        }
      } catch (domError) {
        // Continue with original src
      }
    }

    // Fetch the image data
    const response = await fetch(finalSrc);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    return { blob, filename: finalFilename };
  } catch (error) {
    // If direct fetch fails, try through background script
    try {
      const bgResponse = await new Promise<{ dataUrl?: string; error?: boolean; message?: string }>(
        (resolve) => {
          chrome.runtime.sendMessage(
            {
              msg: MessageActionType.FETCH_IMAGE,
              url: src,
              referrer: window.location.href,
            },
            (response) =>
              resolve(response || { error: true, message: 'No response from background script' }),
          );
        },
      );

      if (bgResponse.error) {
        throw new Error(bgResponse.message || 'Background script fetch failed');
      }

      if (bgResponse.dataUrl) {
        const response = await fetch(bgResponse.dataUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch data URL: ${response.status}`);
        }

        const blob = await response.blob();

        // Update filename extension based on data URL
        if (bgResponse.dataUrl.startsWith('data:')) {
          finalFilename = updateFilenameExtensionFromDataUrl(finalFilename, bgResponse.dataUrl);
        }

        return { blob, filename: finalFilename };
      }

      throw new Error('No data URL in background response');
    } catch (bgError) {
      console.error('Background script fetch also failed:', bgError);
      throw new Error(
        `Failed to download image "${filename}": ${bgError instanceof Error ? bgError.message : String(bgError)}`,
      );
    }
  }
};

/**
 * Creates and downloads a ZIP archive with selected images
 * @param images Array of image data objects
 * @returns Promise with download results
 */
export const createAndDownloadZipArchive = async (
  images: ImageData[],
): Promise<{ successCount: number; totalCount: number }> => {
  try {
    // Load JSZip
    const JSZipClass = await loadJSZip();
    const zip = new JSZipClass();

    const totalCount = images.length;
    let successCount = 0;
    const failures: string[] = [];
    const usedFilenames = new Set<string>();

    // Pre-compute batch-level options (invariant across all images)
    const settings = useSettingsStore.getState();
    const pageUrl = useImageStore.getState().pageUrl;
    const batchOptions: ZipBatchOptions = {
      convertFrom: settings.convertFrom,
      convertTo: settings.convertTo,
      renamePattern: settings.renamePattern,
      domain: pageUrl ? extractDomain(pageUrl) : '',
    };

    // Add images to ZIP archive
    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      try {
        const { blob, filename } = await downloadImageAsBlob(image, batchOptions);

        // Add to ZIP with sanitized and deduplicated filename
        let sanitizedFilename = sanitizeFileName(filename);
        const lowerName = sanitizedFilename.toLowerCase();
        if (usedFilenames.has(lowerName)) {
          const dotIdx = sanitizedFilename.lastIndexOf('.');
          const base = dotIdx > 0 ? sanitizedFilename.slice(0, dotIdx) : sanitizedFilename;
          const ext = dotIdx > 0 ? sanitizedFilename.slice(dotIdx) : '';
          let counter = 1;
          while (usedFilenames.has(`${base}_${counter}${ext}`.toLowerCase())) {
            counter++;
          }
          sanitizedFilename = `${base}_${counter}${ext}`;
        }
        usedFilenames.add(sanitizedFilename.toLowerCase());
        zip.file(sanitizedFilename, blob);
        successCount++;
      } catch (error) {
        // Skip failed images but continue processing
        const errorMessage = error instanceof Error ? error.message : String(error);
        failures.push(`${image.filename}: ${errorMessage}`);
      }
    }

    if (successCount === 0) {
      const failureDetails = failures.length > 0 ? `\n\nDetails:\n${failures.join('\n')}` : '';
      throw new Error(`No images could be added to the ZIP archive${failureDetails}`);
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9,
      },
    });

    // Create download filename
    const archiveName = generateZipArchiveName(successCount);

    // Create download link
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = archiveName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    URL.revokeObjectURL(downloadUrl);

    // Уведомляем store об успешной загрузке
    if (successCount > 0) {
      useRatingStore.getState().setHasSuccessfulDownload(true);
    }

    return { successCount, totalCount };
  } catch (error) {
    console.error('ZIP archive creation failed:', error);
    throw error;
  }
};

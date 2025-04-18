import { ImageData } from '@types';

import { handleError } from './errorHandlers';
import { getFileExtension } from './imageUtils';

/**
 * Extracts a filename from a URL
 * @param url - The URL to extract the filename from
 * @returns The extracted filename or a fallback
 */
export const getFileNameFromUrl = (url: string): string => {
  try {
    // Для data:URL используем generic имя
    if (url.startsWith('data:')) {
      return 'image';
    }

    // Try to create a URL object to parse the URL
    const urlObj = new URL(url);

    // Get the pathname
    const pathname = urlObj.pathname;

    // Удаляем параметры запроса, если они есть
    const pathWithoutQuery = pathname.split('?')[0];

    // Extract the filename from the path
    const segments = pathWithoutQuery.split('/');
    let lastSegment = segments[segments.length - 1];

    // Если последний сегмент пустой, используем предпоследний (для URL с / в конце)
    if (!lastSegment && segments.length > 1) {
      lastSegment = segments[segments.length - 2];
    }

    // Удаляем параметры после имени файла (если есть = в имени)
    if (lastSegment.includes('=')) {
      lastSegment = lastSegment.split('=')[0];
    }

    // Return the filename if it exists, or a fallback
    if (lastSegment && lastSegment.length > 0) {
      // Decode URI components to handle encoded characters
      try {
        return decodeURIComponent(lastSegment);
      } catch (e) {
        // Если декодирование не удалось, используем как есть
        return lastSegment;
      }
    }

    // If no filename found, generate a name based on hostname
    return `image_from_${urlObj.hostname.replace(/\./g, '_')}`;
  } catch (e) {
    // Тихая обработка ошибки - без уведомления пользователя
    handleError(e);
    // If the URL is invalid, return a generic name
    return 'image';
  }
};

/**
 * Gets a smart file name based on image data
 * This function should only be used at image creation time in content-script.ts
 * After that, the UI components directly access 'image.filename' from the store
 * @param image The image data object
 * @returns A meaningful file name
 */
export const getSmartFileName = (image: ImageData): string => {
  const { src, alt } = image;

  // Получаем базовое имя файла из URL
  const defaultName = getFileNameFromUrl(src);

  // Определяем расширение на основе источника изображения
  const extension = `.${getFileExtension(src).toLowerCase()}`;

  // Если alt текст содержит значимую информацию, используем его
  if (
    alt &&
    alt.trim() &&
    !src.includes(alt) &&
    !['image', 'picture', 'photo'].includes(alt.toLowerCase())
  ) {
    // Обрабатываем alt текст для создания валидного имени файла
    const sanitizedAlt = alt
      .trim()
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30); // Ограничиваем длину

    return `${sanitizedAlt}${extension}`;
  }

  // Проверяем, содержит ли имя файла уже расширение
  if (defaultName.includes('.')) {
    const dotIndex = defaultName.lastIndexOf('.');
    if (dotIndex > 0) {
      const nameWithoutExt = defaultName.substring(0, dotIndex);
      const currentExt = defaultName.substring(dotIndex).toLowerCase();

      // Проверяем, является ли текущее расширение валидным
      if (/^\.[a-z0-9]+$/i.test(currentExt)) {
        // Если расширение в имени совпадает с определенным из URL/content-type, используем его
        if (currentExt === extension) {
          return defaultName;
        }

        // Если они отличаются, заменяем расширение на правильное
        return nameWithoutExt + extension;
      }

      // Если текущее расширение невалидное, добавляем правильное
      return defaultName + extension;
    }
  }

  // Если имя файла не содержит расширение, добавляем его
  return defaultName + extension;
};

/**
 * Formats file size in human-readable format
 * @param bytes Number of bytes
 * @returns Formatted string (e.g. "1.5 KB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

// Cache for storing file sizes to avoid repeated requests
const fileSizeCache: Record<string, string | null> = {};

/**
 * Gets file size for an image URL
 * @param url Image URL
 * @returns Promise that resolves to the file size as a formatted string, or null if the size can't be determined
 */
export const getFileSize = async (url: string): Promise<string | null> => {
  // Check if we have cached result
  if (fileSizeCache[url] !== undefined) {
    return fileSizeCache[url];
  }

  // First, try to get size from already loaded resources using Performance API
  try {
    // This only works for http/https URLs that have been loaded in the browser
    if (
      (url.startsWith('http:') || url.startsWith('https:')) &&
      typeof performance !== 'undefined' &&
      performance.getEntriesByName
    ) {
      const entries = performance.getEntriesByName(url, 'resource');

      if (entries.length > 0) {
        // Use transferSize if available (actual size over network)
        // or encodedBodySize (size before decoding)
        const entry = entries[0] as PerformanceResourceTiming;
        if (entry.transferSize && entry.transferSize > 0) {
          const size = formatFileSize(entry.transferSize);
          fileSizeCache[url] = size;
          return size;
        }
        if (entry.encodedBodySize && entry.encodedBodySize > 0) {
          const size = formatFileSize(entry.encodedBodySize);
          fileSizeCache[url] = size;
          return size;
        }
      }
    }
  } catch (e) {
    // Silent fail and continue with other methods
  }

  // For data URLs, calculate size from the encoded data
  if (url.startsWith('data:')) {
    try {
      // Get the base64 part after the comma
      const base64 = url.split(',')[1];
      if (!base64) {
        fileSizeCache[url] = null;
        return null;
      }

      // Calculate size in bytes (base64 encodes 3 bytes in 4 characters, except padding)
      const padding = (base64.match(/=/g) || []).length;
      const bytes = Math.floor((base64.length - padding) * 0.75);

      const size = formatFileSize(bytes);
      fileSizeCache[url] = size;
      return size;
    } catch (e) {
      handleError(e);
      fileSizeCache[url] = null;
      return null;
    }
  }

  // For regular URLs where Performance API didn't have the info, use HEAD request
  if (url.startsWith('http:') || url.startsWith('https:')) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        // Add credentials to handle same-origin cookies
        credentials: 'same-origin',
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        fileSizeCache[url] = null;
        return null;
      }

      const contentLength = response.headers.get('Content-Length');
      if (!contentLength) {
        fileSizeCache[url] = null;
        return null;
      }

      const bytes = parseInt(contentLength, 10);
      if (isNaN(bytes)) {
        fileSizeCache[url] = null;
        return null;
      }

      const size = formatFileSize(bytes);
      fileSizeCache[url] = size;
      return size;
    } catch (e) {
      handleError(e);
      fileSizeCache[url] = null;
      return null;
    }
  }

  // For blob URLs, we can't easily get the size without the original blob
  fileSizeCache[url] = null;
  return null;
};

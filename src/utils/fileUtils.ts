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

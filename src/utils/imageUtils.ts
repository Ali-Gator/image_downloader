import { getFormatFromDomainRules, getDisplayFormat, VALID_IMAGE_EXTENSIONS } from './imageFormats';

/**
 * Truncates a URL for display
 * Shows beginning and end of URL, replacing the middle with ellipsis
 */
export const truncateUrl = (url: string, length: number = 40): string => {
  if (url.length <= length) {
    return url;
  }
  return `${url.substring(0, length / 2)}...${url.substring(url.length - length / 2)}`;
};

/**
 * Get file extension in uppercase format for display
 * @param fileName File name or path
 * @returns File extension in uppercase (PNG by default if extension not found)
 */
export const getFileExtension = (fileName: string): string => {
  // Проверяем, является ли входная строка data URL
  if (fileName.startsWith('data:')) {
    // Извлекаем MIME тип из data URL
    const mimeMatch = fileName.match(/data:([a-z]+)\/([a-z0-9.+-]+);/i);
    if (mimeMatch && mimeMatch[1] === 'image') {
      // Для изображений возвращаем тип из MIME
      return getDisplayFormat(mimeMatch[2]);
    }
  }

  try {
    // Если это URL, попробуем правильно извлечь имя файла
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
      // Создаем URL объект для разбора
      const url = new URL(fileName);

      // Применяем правила для специфических доменов
      const domainFormat = getFormatFromDomainRules(fileName);
      if (domainFormat) {
        return getDisplayFormat(domainFormat);
      }

      // Удаляем параметры запроса
      const pathWithoutQuery = url.pathname.split('?')[0];

      // Извлекаем последний сегмент пути
      const segments = pathWithoutQuery.split('/');
      let lastSegment = segments[segments.length - 1];

      // Если есть параметры в имени файла (часть с =), удаляем их
      if (lastSegment.includes('=')) {
        lastSegment = lastSegment.split('=')[0];
      }

      // Извлекаем расширение из последнего сегмента
      const dotIndex = lastSegment.lastIndexOf('.');
      if (dotIndex > 0 && dotIndex < lastSegment.length - 1) {
        const ext = lastSegment
          .slice(dotIndex + 1)
          .split('&')[0]
          .split('#')[0];
        if (
          ext &&
          /^[a-z0-9]+$/i.test(ext) &&
          (VALID_IMAGE_EXTENSIONS as readonly string[]).includes(ext.toLowerCase())
        ) {
          // Convert jpg to jpeg for consistent display
          const normalizedExt = ext.toLowerCase() === 'jpg' ? 'jpeg' : ext.toLowerCase();
          return getDisplayFormat(normalizedExt);
        }
      }

      // Проверяем параметры запроса на наличие информации о типе файла
      if (url.searchParams.has('type')) {
        const type = url.searchParams.get('type')?.toLowerCase();
        if (type?.startsWith('image/')) {
          const format = type.substring(6);
          if (format) return getDisplayFormat(format);
        } else if (
          type &&
          (VALID_IMAGE_EXTENSIONS as readonly string[]).includes(type.toLowerCase())
        ) {
          const normalizedType = type!.toLowerCase() === 'jpg' ? 'jpeg' : type!.toLowerCase();
          return getDisplayFormat(normalizedType);
        }
      }

      // Если не удалось определить из URL, проверяем, содержит ли pathname указание на формат
      if (pathWithoutQuery.toLowerCase().includes('/png/')) return getDisplayFormat('png');
      if (
        pathWithoutQuery.toLowerCase().includes('/jpg/') ||
        pathWithoutQuery.toLowerCase().includes('/jpeg/')
      )
        return getDisplayFormat('jpeg');
      if (pathWithoutQuery.toLowerCase().includes('/webp/')) return getDisplayFormat('webp');
      if (pathWithoutQuery.toLowerCase().includes('/gif/')) return getDisplayFormat('gif');

      // Не удалось определить расширение из URL
      return getDisplayFormat('png');
    }
  } catch (e) {
    // Ошибка разбора URL, продолжаем со стандартной логикой
  }

  // Стандартная логика для файлов с расширением
  // Удаляем параметры запроса, если они есть
  const fileNameWithoutParams = fileName.split('?')[0].split('#')[0];

  // Извлекаем расширение
  const dotIndex = fileNameWithoutParams.lastIndexOf('.');
  if (dotIndex > 0 && dotIndex < fileNameWithoutParams.length - 1) {
    const ext = fileNameWithoutParams.slice(dotIndex + 1);
    // Проверяем, что расширение состоит только из букв и цифр и является одним из стандартных форматов изображений
    if (/^[a-z0-9]+$/i.test(ext)) {
      const lowerExt = ext.toLowerCase();
      if ((VALID_IMAGE_EXTENSIONS as readonly string[]).includes(lowerExt)) {
        // Convert jpg to jpeg for consistent display
        const normalizedExt = lowerExt === 'jpg' ? 'jpeg' : lowerExt;
        return getDisplayFormat(normalizedExt);
      }
    }
  }

  // Если не найдено валидное расширение, используем PNG по умолчанию
  return getDisplayFormat('png');
};

/**
 * Determines URL type and returns user-friendly display text
 */
export const getFriendlyUrlDisplay = (url: string): { text: string; tooltip: string } => {
  if (url.startsWith('data:')) {
    return {
      text: 'Embedded image data',
      tooltip: 'This image contains embedded data, not a link to an external resource',
    };
  }

  if (url.startsWith('blob:')) {
    return {
      text: 'Temporary image URL',
      tooltip: 'This is a temporary URL generated by the browser',
    };
  }

  if (url.startsWith('file:')) {
    return {
      text: 'Local file',
      tooltip: url,
    };
  }

  return {
    text: truncateUrl(url),
    tooltip: url,
  };
};

/**
 * Convert blob to data URL
 * Universal function to avoid duplication
 */
export function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/**
 * Updates the file extension in filename based on actual data URL
 * This resolves the issue where display format (e.g., PNG) differs from actual format (e.g., JPEG)
 * @param filename Original filename
 * @param dataUrl Data URL with actual format information
 * @returns Filename with corrected extension
 */
export function updateFilenameExtensionFromDataUrl(filename: string, dataUrl: string): string {
  if (!dataUrl.startsWith('data:')) {
    return filename;
  }

  // Extract actual format from data URL
  const actualExtension = getFileExtension(dataUrl);

  // Get current extension from filename (but only if filename actually has an extension)
  const hasExtension = filename.includes('.');
  const currentExtension = hasExtension ? getFileExtension(filename) : null;

  // If filename has extension and extensions are the same, no change needed
  if (hasExtension && actualExtension === currentExtension) {
    return filename;
  }

  // Replace the extension with the actual one
  if (filename.includes('.')) {
    const lastDotIndex = filename.lastIndexOf('.');
    const nameWithoutExtension = filename.substring(0, lastDotIndex);
    return `${nameWithoutExtension}.${actualExtension.toLowerCase()}`;
  } else {
    // No extension found, add the actual one
    return `${filename}.${actualExtension.toLowerCase()}`;
  }
}

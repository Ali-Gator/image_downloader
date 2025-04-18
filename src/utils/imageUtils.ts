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
      return mimeMatch[2].toUpperCase();
    }
  }

  try {
    // Если это URL, попробуем правильно извлечь имя файла
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
      // Создаем URL объект для разбора
      const url = new URL(fileName);

      // Проверяем, содержит ли URL специфические пути изображений
      // Например, google/cloudinary и другие CDN изображений
      const hostname = url.hostname.toLowerCase();

      // Для некоторых фотохостингов определяем формат по URL или домену
      if (
        hostname.includes('googleusercontent.com') ||
        hostname.includes('gstatic.com') ||
        hostname.includes('lh3.google.com')
      ) {
        // Google обычно использует WebP или PNG, но проверяем параметры
        if (url.searchParams.has('format')) {
          const format = url.searchParams.get('format')?.toLowerCase();
          if (format) return format.toUpperCase();
        }

        // Если формат не указан явно, предполагаем PNG для иконок
        if (url.pathname.includes('s32-c-mo') || url.pathname.includes('favicon')) {
          return 'PNG';
        }
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
          ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext.toLowerCase())
        ) {
          return ext.toUpperCase();
        }
      }

      // Проверяем параметры запроса на наличие информации о типе файла
      if (url.searchParams.has('type')) {
        const type = url.searchParams.get('type')?.toLowerCase();
        if (type?.startsWith('image/')) {
          const format = type.substring(6);
          if (format) return format.toUpperCase();
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type?.toLowerCase() || '')) {
          return type!.toUpperCase();
        }
      }

      // Если не удалось определить из URL, проверяем, содержит ли pathname указание на формат
      if (pathWithoutQuery.toLowerCase().includes('/png/')) return 'PNG';
      if (
        pathWithoutQuery.toLowerCase().includes('/jpg/') ||
        pathWithoutQuery.toLowerCase().includes('/jpeg/')
      )
        return 'JPEG';
      if (pathWithoutQuery.toLowerCase().includes('/webp/')) return 'WEBP';
      if (pathWithoutQuery.toLowerCase().includes('/gif/')) return 'GIF';

      // Не удалось определить расширение из URL
      return 'PNG';
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
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(lowerExt)) {
        return ext.toUpperCase();
      }
    }
  }

  // Если не найдено валидное расширение, используем PNG по умолчанию
  return 'PNG';
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

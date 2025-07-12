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
 * Common patterns that indicate high-resolution images
 */
const HIGH_RESOLUTION_PATTERNS = [
  // Size indicators
  { pattern: /\bs1600\b/i, priority: 100 },
  { pattern: /\bs2048\b/i, priority: 95 },
  { pattern: /\bs1200\b/i, priority: 90 },
  { pattern: /\bs800\b/i, priority: 85 },
  { pattern: /\blarge\b/i, priority: 80 },
  { pattern: /\borig\b/i, priority: 75 },
  { pattern: /\boriginal\b/i, priority: 75 },
  { pattern: /\bfull\b/i, priority: 70 },
  { pattern: /\bmax\b/i, priority: 65 },
  { pattern: /\bhd\b/i, priority: 60 },
  { pattern: /\bhigh\b/i, priority: 55 },
  // Resolution patterns
  { pattern: /\d{4}x\d{4}/i, priority: 85 },
  { pattern: /\d{3,4}x\d{3,4}/i, priority: 80 },
  // Quality indicators
  { pattern: /\bq_auto\b/i, priority: 50 },
  { pattern: /\bq_100\b/i, priority: 45 },
  { pattern: /\bq_90\b/i, priority: 40 },
];

/**
 * Patterns that indicate thumbnails or low-resolution images
 */
const THUMBNAIL_PATTERNS = [
  // Size indicators
  { pattern: /\bthumb\b/i, penalty: -50 },
  { pattern: /\bthumbnail\b/i, penalty: -50 },
  { pattern: /\bsmall\b/i, penalty: -40 },
  { pattern: /\btiny\b/i, penalty: -45 },
  { pattern: /\bmini\b/i, penalty: -40 },
  { pattern: /\bicon\b/i, penalty: -60 },
  { pattern: /\bavatar\b/i, penalty: -35 },
  { pattern: /\bprofile\b/i, penalty: -30 },
  // Size patterns
  { pattern: /\bs150\b/i, penalty: -40 },
  { pattern: /\bs200\b/i, penalty: -35 },
  { pattern: /\bs300\b/i, penalty: -30 },
  { pattern: /\bs400\b/i, penalty: -25 },
  { pattern: /\bs500\b/i, penalty: -20 },
  // Resolution patterns
  { pattern: /\d{2}x\d{2}/i, penalty: -50 },
  { pattern: /\d{3}x\d{3}/i, penalty: -30 },
  // Quality indicators
  { pattern: /\bq_auto:low\b/i, penalty: -40 },
  { pattern: /\bq_30\b/i, penalty: -35 },
  { pattern: /\bq_50\b/i, penalty: -25 },
];

/**
 * Analyzes image URL to determine if it's likely a high-resolution image
 * @param url Image URL to analyze
 * @returns Quality score (higher is better, 0 is neutral)
 */
export const analyzeImageQuality = (url: string): number => {
  let score = 0;

  // Check for high-resolution patterns
  for (const { pattern, priority } of HIGH_RESOLUTION_PATTERNS) {
    if (pattern.test(url)) {
      score += priority;
    }
  }

  // Check for thumbnail patterns
  for (const { pattern, penalty } of THUMBNAIL_PATTERNS) {
    if (pattern.test(url)) {
      score += penalty;
    }
  }

  return score;
};

/**
 * Determines image quality level based on dimensions
 * @param width Image width in pixels
 * @param height Image height in pixels
 * @returns Quality level: 'high', 'medium', or 'low'
 */
export const getQualityFromDimensions = (
  width: number,
  height: number,
): 'high' | 'medium' | 'low' => {
  const area = width * height;
  if (area > 1000000) return 'high'; // 1MP+
  if (area > 300000) return 'medium'; // 300K pixels+
  return 'low';
};

/**
 * Attempts to construct a high-resolution URL from a thumbnail URL
 * @param thumbnailUrl Original thumbnail URL
 * @returns Potential high-resolution URL or null if no pattern matches
 */
export const constructHighResolutionUrl = (thumbnailUrl: string): string | null => {
  try {
    const url = new URL(thumbnailUrl);
    const hostname = url.hostname.toLowerCase();

    // Instagram CDN
    if (hostname.includes('cdninstagram.com')) {
      // Replace size parameters with higher resolution
      let newUrl = thumbnailUrl.replace(/\bs\d{3,4}\b/g, 's1080');
      newUrl = newUrl.replace(/\bc_fill,\s*w_\d+,\s*h_\d+/g, 'c_fill,w_1080,h_1080');
      return newUrl !== thumbnailUrl ? newUrl : null;
    }

    // Twitter images
    if (hostname.includes('twimg.com')) {
      // Replace size suffixes
      let newUrl = thumbnailUrl.replace(/:small$/, ':large');
      newUrl = newUrl.replace(/:medium$/, ':large');
      newUrl = newUrl.replace(/:thumb$/, ':large');
      newUrl = newUrl.replace(/&name=small/, '&name=large');
      newUrl = newUrl.replace(/&name=medium/, '&name=large');
      newUrl = newUrl.replace(/&name=thumb/, '&name=large');
      return newUrl !== thumbnailUrl ? newUrl : null;
    }

    // Facebook images
    if (hostname.includes('fbcdn.net')) {
      // Replace size parameters
      let newUrl = thumbnailUrl.replace(/\bs\d{3,4}\b/g, 's2048');
      newUrl = newUrl.replace(/\bc_fill,\s*w_\d+,\s*h_\d+/g, 'c_fill,w_2048,h_2048');
      return newUrl !== thumbnailUrl ? newUrl : null;
    }

    // Google Photos / Google services
    if (hostname.includes('googleusercontent.com') || hostname.includes('lh3.google.com')) {
      // Replace size parameters
      let newUrl = thumbnailUrl.replace(/=s\d{2,4}/, '=s1600');
      newUrl = newUrl.replace(/=w\d{2,4}-h\d{2,4}/, '=w1600-h1600');
      return newUrl !== thumbnailUrl ? newUrl : null;
    }

    // Generic patterns
    // Replace common thumbnail size patterns
    let newUrl = thumbnailUrl.replace(/\bthumb\b/gi, 'large');
    newUrl = newUrl.replace(/\bthumbnail\b/gi, 'original');
    newUrl = newUrl.replace(/\bsmall\b/gi, 'large');
    newUrl = newUrl.replace(/\bs150\b/gi, 's800');
    newUrl = newUrl.replace(/\bs200\b/gi, 's800');
    newUrl = newUrl.replace(/\bs300\b/gi, 's800');
    newUrl = newUrl.replace(/\bs400\b/gi, 's800');
    newUrl = newUrl.replace(/\bs500\b/gi, 's800');

    return newUrl !== thumbnailUrl ? newUrl : null;
  } catch (error) {
    return null;
  }
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
      let mimeType = mimeMatch[2];

      // Обрабатываем случай svg+xml -> svg
      if (mimeType === 'svg+xml') {
        mimeType = 'svg';
      }

      return getDisplayFormat(mimeType);
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

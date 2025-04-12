import { ImageData } from '@components/Popup/types';

import { handleError } from './errorHandlers';

/**
 * Extracts a filename from a URL
 * @param url - The URL to extract the filename from
 * @returns The extracted filename or a fallback
 */
export const getFileNameFromUrl = (url: string): string => {
  try {
    // Try to create a URL object to parse the URL
    const urlObj = new URL(url);

    // Get the pathname
    const pathname = urlObj.pathname;

    // Extract the filename from the path
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];

    // Return the filename if it exists, or a fallback
    if (lastSegment && lastSegment.length > 0) {
      // Decode URI components to handle encoded characters
      return decodeURIComponent(lastSegment);
    }

    // If no filename found, use domain + shortened pathname as a fallback
    return `${urlObj.hostname}${pathname.length > 20 ? pathname.substring(0, 20) + '...' : pathname}`;
  } catch (e) {
    // Тихая обработка ошибки - без уведомления пользователя
    handleError(e);
    // If the URL is invalid, return a portion of the URL
    return url.substring(0, 30) + (url.length > 30 ? '...' : '');
  }
};

/**
 * Gets a smart file name based on image data
 * Uses alt text if meaningful, otherwise falls back to URL-based name
 * @param image The image data object
 * @returns A meaningful file name
 */
export const getSmartFileName = (image: ImageData): string => {
  const { src, alt } = image;
  const defaultName = getFileNameFromUrl(src);

  // If alt text is meaningful (not empty, not equals URL, not generic), use it
  if (
    alt &&
    alt.trim() &&
    !src.includes(alt) &&
    !['image', 'picture', 'photo'].includes(alt.toLowerCase())
  ) {
    // Convert alt to suitable filename (remove invalid characters)
    const sanitizedAlt = alt
      .trim()
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30); // Limit length to 30 characters

    // Add extension from original file
    const extension = defaultName.includes('.')
      ? defaultName.substring(defaultName.lastIndexOf('.'))
      : '.jpg';

    return `${sanitizedAlt}${extension}`;
  }

  return defaultName;
};

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
    // If the URL is invalid, return a portion of the URL
    return url.substring(0, 30) + (url.length > 30 ? '...' : '');
  }
};

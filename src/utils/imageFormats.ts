/**
 * Image format constants and utilities for image conversion
 */

/**
 * Mapping of format names to their possible file extensions
 */
export const FORMAT_EXTENSIONS = {
  jpeg: ['jpg', 'jpeg'],
  png: ['png'],
  webp: ['webp'],
  gif: ['gif'],
  bmp: ['bmp'],
  tiff: ['tif', 'tiff'],
  svg: ['svg'],
} as const;

/**
 * Supported output formats for conversion
 */
export const SUPPORTED_OUTPUT_FORMATS = ['jpeg', 'png', 'webp'] as const;

/**
 * Canvas supported MIME types for conversion
 */
export const CANVAS_MIME_TYPES = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

/**
 * Default quality settings for different formats
 */
export const FORMAT_QUALITY = {
  jpeg: 0.9, // 90% quality for JPEG
  webp: 0.85, // 85% quality for WebP
  png: 1.0, // PNG is lossless
} as const;

/**
 * Get image format from file extension
 * @param extension File extension (with or without dot)
 * @returns Format name or 'unknown'
 */
export const getFormatFromExtension = (extension: string): string => {
  const ext = extension.toLowerCase().replace('.', '');

  for (const [format, extensions] of Object.entries(FORMAT_EXTENSIONS)) {
    if ((extensions as readonly string[]).includes(ext)) {
      return format;
    }
  }

  return 'unknown';
};

/**
 * Get image format from filename
 * @param filename Filename with extension
 * @returns Format name or 'unknown'
 */
export const getFormatFromFilename = (filename: string): string => {
  if (!filename.includes('.')) {
    return 'unknown';
  }

  const extension = filename.substring(filename.lastIndexOf('.') + 1);
  return getFormatFromExtension(extension);
};

/**
 * Get file extension for a given format
 * @param format Format name
 * @returns File extension (without dot)
 */
export const getExtensionForFormat = (format: string): string => {
  const formatExtensions = FORMAT_EXTENSIONS[format as keyof typeof FORMAT_EXTENSIONS];
  if (!formatExtensions) {
    return format; // fallback to format name
  }

  // Return the first (most common) extension for the format
  return formatExtensions[0];
};

/**
 * Check if format is supported for conversion output
 * @param format Format name to check
 * @returns True if format is supported as output
 */
export const isOutputFormatSupported = (format: string): boolean => {
  return (SUPPORTED_OUTPUT_FORMATS as readonly string[]).includes(format);
};

/**
 * Update file extension in filename to match new format
 * @param filename Original filename
 * @param newFormat New format name
 * @returns Filename with updated extension
 */
export const updateFileExtension = (filename: string, newFormat: string): string => {
  if (!filename.includes('.')) {
    // No extension, add one
    return `${filename}.${getExtensionForFormat(newFormat)}`;
  }

  // Replace extension
  const lastDotIndex = filename.lastIndexOf('.');
  const nameWithoutExtension = filename.substring(0, lastDotIndex);
  const newExtension = getExtensionForFormat(newFormat);

  return `${nameWithoutExtension}.${newExtension}`;
};

/**
 * Check if image should be converted based on settings
 * @param filename Original filename
 * @param convertFrom Source format setting ('none', 'all', 'webp', 'png', etc.)
 * @returns True if image should be converted
 */
export const shouldConvertImage = (filename: string, convertFrom: string): boolean => {
  // If convertFrom is 'none', never convert
  if (convertFrom === 'none') {
    return false;
  }

  // If convertFrom is 'all', convert everything
  if (convertFrom === 'all') {
    return true;
  }

  // Get format from filename
  const imageFormat = getFormatFromFilename(filename);

  // If we can't determine format, don't convert
  if (imageFormat === 'unknown') {
    return false;
  }

  // Check if this specific format should be converted
  return imageFormat === convertFrom;
};

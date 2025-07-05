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
 * URL-based format detection rules for different domains
 * Each rule can have conditions and the format to return
 */
export const DOMAIN_FORMAT_RULES = [
  {
    name: 'Instagram HEIC to JPEG',
    hostnameParts: ['cdninstagram.com'],
    conditions: [
      {
        type: 'filename_contains' as const,
        value: '.heic',
        format: 'jpeg',
      },
    ],
    urlParamOverrides: [
      {
        param: 'stp',
        contains: 'dst-jpg',
        format: 'jpeg',
      },
    ],
  },
  {
    name: 'Facebook images',
    hostnameParts: ['fbcdn.net', 'facebook.com'],
    conditions: [
      {
        type: 'default' as const,
        format: 'jpeg',
      },
    ],
    urlParamOverrides: undefined,
  },
  {
    name: 'Twitter images',
    hostnameParts: ['twimg.com', 'twitter.com', 'pbs.twimg.com'],
    conditions: [
      {
        type: 'default' as const,
        format: 'jpeg',
      },
    ],
    urlParamOverrides: undefined,
  },
  {
    name: 'Google services',
    hostnameParts: ['googleusercontent.com', 'gstatic.com', 'lh3.google.com'],
    conditions: [
      {
        type: 'path_contains' as const,
        value: 's32-c-mo',
        format: 'png',
      },
      {
        type: 'path_contains' as const,
        value: 'favicon',
        format: 'png',
      },
    ],
    urlParamOverrides: [
      {
        param: 'format',
        useParamValue: true,
      },
    ],
  },
] as const;

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
 * Display format names for user interface
 * Maps internal format names to user-friendly display names
 */
export const DISPLAY_FORMATS = {
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WEBP',
  gif: 'GIF',
  bmp: 'BMP',
  tiff: 'TIFF',
  svg: 'SVG',
} as const;

/**
 * Valid image file extensions for validation
 * Includes all extensions from FORMAT_EXTENSIONS plus common aliases
 */
export const VALID_IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'bmp',
  'ico',
  'tif',
  'tiff',
] as const;

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
 * Get display format name for user interface
 * Converts internal format names to user-friendly display names
 * @param format Internal format name
 * @returns User-friendly format name
 */
export const getDisplayFormat = (format: string): string => {
  return (
    DISPLAY_FORMATS[format.toLowerCase() as keyof typeof DISPLAY_FORMATS] || format.toUpperCase()
  );
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
 * Apply domain-specific format detection rules
 * @param url URL to analyze
 * @returns Detected format or null if no rules match
 */
export const getFormatFromDomainRules = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;

    // Find matching rule
    for (const rule of DOMAIN_FORMAT_RULES) {
      const hostnameMatches = rule.hostnameParts.some((part) =>
        hostname.includes(part.toLowerCase()),
      );

      if (!hostnameMatches) continue;

      // Check URL parameter overrides first
      if (rule.urlParamOverrides) {
        for (const override of rule.urlParamOverrides) {
          if (urlObj.searchParams.has(override.param)) {
            if ('useParamValue' in override && override.useParamValue) {
              const paramValue = urlObj.searchParams.get(override.param);
              if (paramValue && isOutputFormatSupported(paramValue.toLowerCase())) {
                return paramValue.toLowerCase();
              }
            } else if ('contains' in override && override.contains && 'format' in override) {
              const paramValue = urlObj.searchParams.get(override.param);
              if (paramValue && paramValue.includes(override.contains)) {
                return override.format;
              }
            }
          }
        }
      }

      // Check conditions
      for (const condition of rule.conditions) {
        switch (condition.type) {
          case 'filename_contains':
            if (pathname.includes(condition.value)) {
              return condition.format;
            }
            break;
          case 'path_contains':
            if (pathname.includes(condition.value)) {
              return condition.format;
            }
            break;
          case 'default':
            return condition.format;
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
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

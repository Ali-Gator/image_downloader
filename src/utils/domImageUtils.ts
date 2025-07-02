/**
 * Utility functions for finding and working with images in the DOM
 */

/**
 * Finds an image element in the DOM by various methods
 * @param id Image ID for data-image-id attribute lookup
 * @param filename Filename for alt attribute fallback lookup
 * @returns Found image element or null
 */
export const findImageInDOM = (id?: string, filename?: string): HTMLImageElement | null => {
  // Try to find image by ID first (most reliable)
  if (id) {
    const cardContainer = document.querySelector(`[data-image-id="${id}"]`);
    if (cardContainer) {
      const imgElement = cardContainer.querySelector('img') as HTMLImageElement;
      if (imgElement) {
        return imgElement;
      }
    }
  }

  // Fallback: find by alt attribute
  if (filename) {
    const allImages = document.querySelectorAll('img');
    for (const img of allImages) {
      if (img.alt && (img.alt.includes(filename) || filename.includes(img.alt))) {
        return img as HTMLImageElement;
      }
    }
  }

  return null;
};

/**
 * Waits for an image element to be fully loaded
 * @param imgElement Image element to wait for
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves when image is loaded
 */
export const waitForImageLoad = (imgElement: HTMLImageElement, timeout = 5000): Promise<void> => {
  if (imgElement.complete) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, timeout);

    imgElement.onload = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    imgElement.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Image failed to load'));
    };
  });
};

/**
 * Gets the original source URL from DOM element (preserves original format)
 * @param image Image data with id and filename
 * @returns Original src URL of the image or null if not found
 */
export const getImageSrcFromDOM = async (image: {
  id?: string;
  filename: string;
}): Promise<string | null> => {
  const { id, filename } = image;

  // Find image in DOM
  const imgElement = findImageInDOM(id, filename);
  if (!imgElement) {
    return null;
  }

  try {
    // Wait for image to be loaded
    await waitForImageLoad(imgElement);

    return imgElement.src;
  } catch (error) {
    return null;
  }
};

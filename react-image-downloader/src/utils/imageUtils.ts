import * as Sentry from '@sentry/react';

export interface ImageItem {
  url: string;
  filename: string;
  selected: boolean;
}

/**
 * Генерирует имя файла из URL изображения
 * @param url URL изображения
 * @returns Сгенерированное имя файла
 */
export const generateFilename = (url: string): string => {
  try {
    // Извлекаем имя файла из URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    
    // Если имя файла не найдено, генерируем случайное
    if (!filename || filename.trim() === '') {
      return `image_${Date.now()}.jpg`;
    }
    
    // Проверяем расширение
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
    if (!hasImageExtension) {
      return `${filename}.jpg`;
    }
    
    return filename;
  } catch (error) {
    console.error('Ошибка при генерации имени файла:', error);
    Sentry.captureException(error);
    return `image_${Date.now()}.jpg`;
  }
};

/**
 * Скачивает одно изображение
 * @param url URL изображения
 * @param filename Имя файла
 * @returns Promise, который разрешается, когда изображение начинает загружаться
 */
export const downloadSingleImage = (url: string, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Ошибка при скачивании:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}; 
import { ImageData, MessageActionType } from '@types';
import { handleError, PlaceholderImages } from '@utils';
import { getSmartFileName } from '@utils/fileUtils';

/**
 * Проверяет, является ли URL допустимым изображением
 *
 * @param url URL изображения для проверки
 * @returns true если URL валидный и не является плейсхолдером
 */
const isValidImage = (url: string): boolean => {
  // Проверяем, что URL не пустой и не является плейсхолдером
  // Spacer.gif - это обычные 1px прозрачные гифки, используемые для выравнивания
  // Data:image/gif - это встроенные маленькие изображения, часто используемые как плейсхолдеры
  if (
    !url ||
    url.trim() === '' ||
    url.startsWith(PlaceholderImages.DATA_GIF) ||
    url.includes(PlaceholderImages.SPACER_GIF)
  ) {
    return false;
  }

  // Проверяем наличие метода URL.canParse (добавлен в Chrome 108+)
  if (typeof URL.canParse === 'function') {
    // Используем современный метод canParse, если он доступен
    return URL.canParse(url);
  } else {
    // Фолбэк для старых браузеров - используем try/catch с конструктором URL
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
};

const generateImageId = (src: string, width: number, height: number): string => {
  return `${src}_${width}_${height}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Получает примерный размер изображения в байтах
 * @param img DOM элемент изображения
 * @returns Размер изображения в байтах (приблизительный)
 */
const estimateImageSize = (img: HTMLImageElement): number => {
  try {
    // Для data: URL можно примерно оценить размер из строки
    if (img.src.startsWith('data:')) {
      const base64 = img.src.split(',')[1];
      if (base64) {
        // Base64 кодирует 3 байта в 4 символа (плюс возможный padding)
        const padding = (base64.match(/=/g) || []).length;
        return Math.floor((base64.length - padding) * 0.75);
      }
    }

    // Используем информацию о загруженных ресурсах, если доступно
    if (window.performance && window.performance.getEntriesByName) {
      const entries = window.performance.getEntriesByName(img.src, 'resource');
      if (entries.length > 0) {
        const entry = entries[0] as PerformanceResourceTiming;
        if (entry.transferSize && entry.transferSize > 0) {
          return entry.transferSize;
        }
        if (entry.encodedBodySize && entry.encodedBodySize > 0) {
          return entry.encodedBodySize;
        }
      }
    }

    // Используем аппроксимацию на основе разрешения и формата
    // Предполагаем 3 байта на пиксель для PNG/JPEG (среднее сжатие)
    // WebP обычно имеет лучшее сжатие - примерно 2 байта на пиксель
    const pixelCount = img.naturalWidth * img.naturalHeight;
    const isWebP = img.src.toLowerCase().includes('webp') || img.src.startsWith('data:image/webp');

    return isWebP ? pixelCount * 2 : pixelCount * 3;
  } catch (e) {
    // Если что-то пошло не так, возвращаем оценку на основе разрешения
    return img.naturalWidth * img.naturalHeight * 3;
  }
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  try {
    if (message.action === MessageActionType.GRAB_IMAGES) {
      const allImgElements = Array.from(document.getElementsByTagName('img'));

      // Сразу отфильтровываем и создаем объекты с нужными свойствами
      const filteredImages = [];
      const seenUrls = new Set<string>();

      for (const img of allImgElements) {
        // Проверяем, является ли изображение допустимым и достаточно большим
        const isValid = isValidImage(img.src);
        const isBigEnough =
          img.naturalWidth > PlaceholderImages.MIN_SIZE_PX &&
          img.naturalHeight > PlaceholderImages.MIN_SIZE_PX;

        // Пропускаем невалидные изображения и дубликаты
        if (!isValid || !isBigEnough || seenUrls.has(img.src)) {
          continue;
        }

        // Добавляем URL в множество просмотренных
        seenUrls.add(img.src);

        // Создаем объект изображения с именем файла для поиска
        const imageData: ImageData = {
          id: generateImageId(img.src, img.naturalWidth, img.naturalHeight),
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          filename: '',
          fileSize: estimateImageSize(img),
        };

        // Генерируем умное имя файла, которое будет использоваться всеми компонентами
        imageData.filename = getSmartFileName(imageData);

        // Добавляем изображение в отфильтрованный список
        filteredImages.push(imageData);
      }

      sendResponse({ images: filteredImages });
      return true; // Указываем, что ответ будет асинхронным
    }
  } catch (error) {
    // Отправляем ошибку в Sentry, без показа пользователю
    handleError(error);
    // Send error response to avoid hanging the message port
    sendResponse({
      error: 'An error occurred while processing the request',
      details: error instanceof Error ? error.message : String(error),
    });
  }
  return true; // Нужно для асинхронных обработчиков
});

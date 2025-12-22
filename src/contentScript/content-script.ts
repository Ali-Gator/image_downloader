import { ImageCandidate, ImageData, MessageActionType } from '../types';
import { ContentScriptConstants, handleError, PlaceholderImages } from '../utils';
import { getSmartFileName } from '../utils/fileUtils';
import { blobToDataUrl } from '../utils/imageUtils';

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

/**
 * Simple fetch image as data URL (content script version)
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) return null;

    const blob = await response.blob();
    return blobToDataUrl(blob);
  } catch (error) {
    return null;
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  try {
    // Health check для проверки доступности content script
    if (message.action === MessageActionType.HEALTH_CHECK) {
      sendResponse({ available: true, timestamp: Date.now() });
      return true;
    }

    if (message.action === MessageActionType.FETCH_IMAGE_AS_DATA_URL) {
      // Handle image fetch request from popup/page
      fetchImageAsDataUrl(message.url)
        .then((dataUrl) => {
          sendResponse({ dataUrl });
        })
        .catch(() => {
          sendResponse({ dataUrl: null });
        });
      return true; // Indicate async response
    }

    if (message.action === MessageActionType.GRAB_IMAGES) {
      const allImgElements = Array.from(document.getElementsByTagName('img'));

      // Limit processing to avoid memory issues - process in batches
      const MAX_IMAGES_TO_PROCESS = 500;
      const imagesToProcess = allImgElements.slice(0, MAX_IMAGES_TO_PROCESS);

      // Сразу отфильтровываем и создаем объекты с нужными свойствами
      const candidateImages: ImageCandidate[] = [];
      const seenUrls = new Set<string>();

      for (const img of imagesToProcess) {
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
        const imageCandidate: ImageCandidate = {
          id: generateImageId(img.src, img.naturalWidth, img.naturalHeight),
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          filename: '',
          fileSize: estimateImageSize(img),
          qualityScore: 0, // Default quality score
        };

        // Генерируем умное имя файла, которое будет использоваться всеми компонентами
        imageCandidate.filename = getSmartFileName(imageCandidate);

        // Добавляем изображение в список кандидатов
        candidateImages.push(imageCandidate);
      }

      // Sort images by size (area) - larger images first
      candidateImages.sort((a, b) => {
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        return areaB - areaA;
      });

      // Remove quality score from final results as it's not part of ImageData type
      const filteredImages: ImageData[] = candidateImages.map((candidate) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { qualityScore, ...imageData } = candidate;
        return imageData;
      });

      // Limit final results to prevent UI overload and memory issues
      const MAX_FINAL_IMAGES = 200;
      const finalImages = filteredImages.slice(0, MAX_FINAL_IMAGES);

      sendResponse({ images: finalImages, pageUrl: window.location.href });
      return true; // Указываем, что ответ будет асинхронным
    }
  } catch (error) {
    // Отправляем ошибку в Sentry с подробным контекстом
    const contentScriptError = error instanceof Error ? error : new Error(String(error));
    Object.assign(contentScriptError, {
      context: ContentScriptConstants.CONTEXT.MESSAGE_HANDLER,
      messageAction: message.action,
      tabInfo: {
        url: window.location.href,
        domain: window.location.hostname,
        protocol: window.location.protocol,
        userAgent: navigator.userAgent,
      },
      timestamp: new Date().toISOString(),
    });
    handleError(contentScriptError);
    // Send error response to avoid hanging the message port
    sendResponse({
      error: 'An error occurred while processing the request',
      details: error instanceof Error ? error.message : String(error),
    });
  }
  return true; // Нужно для асинхронных обработчиков
});

import { MessageAction, PlaceholderImages } from '../utils/constants';
import { handleError } from '../utils/errorHandlers';

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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === MessageAction.GRAB_IMAGES) {
      const images = Array.from(document.getElementsByTagName('img'))
        // Фильтруем невалидные изображения и слишком маленькие (иконки)
        .filter((img) => {
          const isValid = isValidImage(img.src);
          const isBigEnough =
            img.naturalWidth > PlaceholderImages.MIN_SIZE_PX &&
            img.naturalHeight > PlaceholderImages.MIN_SIZE_PX;
          return isValid && isBigEnough;
        })
        .map((img) => ({
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth,
          height: img.naturalHeight,
          // Добавляем больше метаданных для будущей фильтрации
          aspectRatio: img.naturalWidth / img.naturalHeight,
        }));

      sendResponse({ images });
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

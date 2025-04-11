import { handleError } from '../utils/errorHandlers';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  try {
    if (message.action === 'grabImages') {
      const images = Array.from(document.getElementsByTagName('img')).map((img) => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }));

      sendResponse({ images });
    }
  } catch (error) {
    // Отправляем ошибку в Sentry, без показа пользователю
    handleError(error);
    // Send error response to avoid hanging the message port
    sendResponse({ error: 'An error occurred while processing the request' });
  }
});

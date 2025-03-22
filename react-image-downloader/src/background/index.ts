/**
 * Service worker для расширения Image Downloader
 * Обрабатывает события в фоновом режиме
 */

import * as Sentry from '@sentry/react';

// Инициализация Sentry для мониторинга ошибок
Sentry.init({
  dsn: 'https://815c4402aa7d273adbb56965901ea6d0@o4508841814130688.ingest.de.sentry.io/4509021769039952',
  tracesSampleRate: 1.0,
  environment: 'production',
  release: 'image-downloader@3.0.0',
  debug: false,
  integrations: [],
});

// Обработчик события установки расширения
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log(`Extension updated from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
  }
});

// Обработчик сообщений от других частей расширения
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureImages') {
    captureImages(sender.tab?.id || -1)
      .then(images => {
        sendResponse({ success: true, images });
      })
      .catch(error => {
        console.error('Error capturing images:', error);
        Sentry.captureException(error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Указываем, что ответ будет отправлен асинхронно
  }
});

// Функция для захвата изображений со страницы
async function captureImages(tabId: number): Promise<string[]> {
  if (tabId < 0) {
    throw new Error('Invalid tab ID');
  }
  
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: () => {
        // Функция, выполняемая в контексте страницы
        const images = document.querySelectorAll('img');
        return Array.from(images).map(image => image.src);
      }
    });
    
    return results.flatMap(frame => frame.result || []);
  } catch (error) {
    console.error('Error executing script:', error);
    Sentry.captureException(error);
    throw error;
  }
}

// Обработчик команды горячих клавиш
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-feature') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.create({ url: 'page.html' });
      }
    });
  }
});

// Сообщаем, что Service Worker запущен
console.log('Image Downloader Service Worker started'); 
import Sentry from './sentry.js';

// Initialize Sentry
Sentry.init({
  dsn: 'https://815c4402aa7d273adbb56965901ea6d0@js-de.sentry-cdn.com/815c4402aa7d273adbb56965901ea6d0',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const grabBtn = document.getElementById('grabBtn');

const showAlert = (any) => alert(JSON.stringify(any, undefined, 2));

/**
 * Выполняет функцию grabImages() на веб-странице указанной
 * вкладки и во всех ее фреймах,
 * @param tab {Tab} Объект вкладки браузера
 */
const execScript = (tab) => {
  try {
    // Выполнить функцию на странице указанной вкладки
    // и передать результат ее выполнения в функцию onResult
    chrome.scripting.executeScript(
      {
        target: {tabId: tab.id, allFrames: true},
        func: grabImages
      },
      onResult
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        event: 'execScript',
        tabId: tab.id
      }
    });
    showAlert('Error executing script: ' + error.message);
  }
};

/**
 * Функция исполняется на удаленной странице браузера,
 * получает список изображений и возвращает массив
 * путей к ним
 *
 *  @return string[]
 */
const grabImages = () => {
  try {
    const images = document.querySelectorAll('img');
    return Array.from(images).map(image => image.src);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        event: 'grabImages'
      }
    });
    return [];
  }
};

/**
 * Открывает новую вкладку браузера со списком изображений
 * @param {string[]} urls - Массив URL-ов изображений для построения страницы
 */
const openImagesPage = (urls) => {
  try {
    chrome.tabs.create({
      url: 'page.html',
      active: false
    }, (tab) => {
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, urls, (response) => {
          if (response === 'OK') {
            chrome.tabs.update(tab.id, {active: true});
          } else {
            Sentry.captureException(new Error('Failed to open images page'), {
              tags: {
                event: 'openImagesPage',
                response: response
              }
            });
            alert('Something went wrong');
          }
        });
      }, 500);
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        event: 'openImagesPage',
        urlsCount: urls.length
      }
    });
    showAlert('Error opening images page: ' + error.message);
  }
};

/**
 * Выполняется после того как вызовы grabImages
 * выполнены во всех фреймах удаленной web-страницы.
 * Функция объединяет результаты в строку и копирует
 * список путей к изображениям в буфер обмена
 *
 * @param {[]InjectionResult} frames Массив результатов
 * функции grabImages
 */
const onResult = (frames) => {
  try {
    // Если результатов нет
    if (!frames || !frames.length) {
      Sentry.captureMessage('No images found on page', {
        level: 'warning',
        tags: {
          event: 'onResult'
        }
      });
      alert('Could not retrieve images from specified page');
      return;
    }
    // Объединить списки URL из каждого фрейма в один массив
    const imageUrls = frames.map(frame => frame.result)
      .flat();

    openImagesPage(imageUrls);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        event: 'onResult',
        framesCount: frames ? frames.length : 0
      }
    });
    showAlert('Error processing results: ' + error.message);
  }
};

grabBtn.addEventListener('click', () => {
  try {
    chrome.tabs.query({active: true}, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        execScript(tab);
      } else {
        Sentry.captureMessage('No active tabs found', {
          level: 'warning',
          tags: {
            event: 'grabBtnClick'
          }
        });
        alert('There are no active tabs');
      }
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        event: 'grabBtnClick'
      }
    });
    showAlert('Error: ' + error.message);
  }
});

try {
  // Initialize popup UI
  document.addEventListener('DOMContentLoaded', () => {
    // Add your popup UI initialization code here
    console.log('Popup initialized');
  });
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      event: 'popupInitialization'
    }
  });
}

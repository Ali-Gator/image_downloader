const grabBtn = document.getElementById('grabBtn');

const showAlert = (any) => alert(JSON.stringify(any, undefined, 2));

/**
 * Выполняет функцию grabImages() на веб-странице указанной
 * вкладки и во всех ее фреймах,
 * @param tab {Tab} Объект вкладки браузера
 */
const execScript = (tab) => {
  // Выполнить функцию на странице указанной вкладки
  // и передать результат ее выполнения в функцию onResult
  chrome.scripting.executeScript(
    {
      target: {tabId: tab.id, allFrames: true},
      func: grabImages
    },
    onResult
  );
};

/**
 * Функция исполняется на удаленной странице браузера,
 * получает список изображений и возвращает массив
 * путей к ним
 *
 *  @return string[]
 */
const grabImages = () => {
  const images = document.querySelectorAll('img');
  return Array.from(images).map(image => image.src);
};

/**
 * Открывает новую вкладку браузера со списком изображений
 * @param {string[]} urls - Массив URL-ов изображений для построения страницы
 */
const openImagesPage = (urls) => {
  chrome.tabs.create({
    url: 'page.html',
    active: false
  }, (tab) => {
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, urls, (response) => {
        if (response === 'OK') {
          chrome.tabs.update(tab.id, {active: true});
        } else {
          alert('Something went wrong')
        }
      });
    }, 500);
  });
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
  // Если результатов нет
  if (!frames || !frames.length) {
    alert('Could not retrieve images from specified page');
    return;
  }
  // Объединить списки URL из каждого фрейма в один массив
  const imageUrls = frames.map(frame => frame.result)
    .flat();

  openImagesPage(imageUrls);
};

grabBtn.addEventListener('click', () => {

  chrome.tabs.query({active: true}, (tabs) => {
    const tab = tabs[0];
    if (tab) {
      execScript(tab);
    } else {
      alert('There are no active tabs');
    }
  });
});

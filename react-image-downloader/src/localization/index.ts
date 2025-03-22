/**
 * Модуль для локализации текстов расширения
 */

// Получаем языковой код из настроек Chrome
const getLanguage = (): string => {
  return chrome.i18n.getUILanguage();
};

// Получаем локализованную строку по ключу
const getMessage = (messageName: string): string => {
  return chrome.i18n.getMessage(messageName) || messageName;
};

// Локализуем все элементы с атрибутом id, соответствующие ключам в _locales
const localizeHtmlPage = (): void => {
  // Локализуем заголовок страницы
  document.title = getMessage(document.title);
  
  // Получаем все элементы с id
  const elements = document.querySelectorAll('[id]');
  
  // Проходим по каждому элементу
  elements.forEach(element => {
    const id = element.id;
    
    // Если есть локализованная строка для этого id
    const message = getMessage(id);
    if (message && message !== id) {
      // Если у элемента есть текстовый контент
      if ('textContent' in element && element.textContent) {
        element.textContent = message;
      }
    }
  });
};

export default {
  getLanguage,
  getMessage,
  localizeHtmlPage
}; 
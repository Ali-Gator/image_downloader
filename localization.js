// Функция для получения локализованной строки по ключу
function getLocalizedMessage(messageName) {
  return chrome.i18n.getMessage(messageName);
}

// Функция для локализации элемента по ID
function localizeElementById(elementId, messageName) {
  const element = document.getElementById(elementId);
  if (element) {
    const message = getLocalizedMessage(messageName);
    if (message) {
      element.textContent = message;
    }
  }
}

// Функция для локализации плейсхолдера элемента по ID
function localizePlaceholderById(elementId, messageName) {
  const element = document.getElementById(elementId);
  if (element) {
    const message = getLocalizedMessage(messageName);
    if (message) {
      element.placeholder = message;
    }
  }
}

// Функция для локализации атрибута title (подсказки) элемента по ID
function localizeTitleById(elementId, messageName) {
  const element = document.getElementById(elementId);
  if (element) {
    const message = getLocalizedMessage(messageName);
    if (message) {
      element.title = message;
    }
  }
}

// Функция для локализации заголовка страницы
function localizeTitle(messageName) {
  const message = getLocalizedMessage(messageName);
  if (message) {
    document.title = message;
  }
}

// Основная функция локализации для popup.html
function localizePopupUI() {
  // Заголовок страницы
  localizeTitle('popup_title');
  
  // Элементы интерфейса
  localizeElementById('popupTitle', 'popup_title');
  localizeElementById('downloadBtnText', 'download_btn');
  localizeElementById('helpText', 'help_text');
}

// Основная функция локализации для page.html
function localizePageUI() {
  // Заголовок страницы
  localizeTitle('popup_title');
  
  // Заголовок и основные кнопки
  localizeElementById('headerTitle', 'popup_title');
  localizeElementById('selectAllLabel', 'select_all_text');
  localizeElementById('downloadBtnLabel', 'download_btn');
  localizeElementById('resetBtnLabel', 'reset_btn');
  
  // Атрибуты title для кнопок
  localizeTitleById('clearFilters', 'reset_filters_title');
  
  // Фильтры и элементы управления
  localizePlaceholderById('filterImages', 'filter_text');
  localizeElementById('sizeFilterAll', 'size_filter_all');
  localizeElementById('sizeFilterSmall', 'size_filter_small');
  localizeElementById('sizeFilterMedium', 'size_filter_medium');
  localizeElementById('sizeFilterLarge', 'size_filter_large');
  
  // Счетчик изображений
  localizeElementById('ofText', 'of_text');
  localizeElementById('imagesSelectedText', 'images_selected_text');
  
  // Опции сортировки
  localizeElementById('sortDefault', 'sort_default');
  localizeElementById('sortNameAsc', 'sort_name_asc');
  localizeElementById('sortNameDesc', 'sort_name_desc');
  localizeElementById('sortSizeAsc', 'sort_size_asc');
  localizeElementById('sortSizeDesc', 'sort_size_desc');
  
  // Кнопки режимов просмотра
  localizeTitleById('gridViewBtn', 'grid_view_text');
  localizeTitleById('listViewBtn', 'list_view_text');
  
  // Текст загрузки
  localizeElementById('loadingText', 'loading_text');
}

// Запуск локализации при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
  // Определяем, какая страница открыта
  const isPopupPage = document.getElementById('popupTitle') !== null;
  const isMainPage = document.getElementById('headerTitle') !== null;
  
  if (isPopupPage) {
    localizePopupUI();
  }
  
  if (isMainPage) {
    localizePageUI();
  }
}); 
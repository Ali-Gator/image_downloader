/**
 * Проверяет валидность URL для изображения
 * @param {string} url - URL для проверки
 * @return {boolean} - true если URL потенциально может быть изображением
 */
const isValidImageUrl = (url) => {
  // Проверяем, является ли URL строкой
  if (typeof url !== 'string') return false;
  
  try {
    // Пытаемся создать URL объект
    const urlObj = new URL(url);
    
    // Проверяем протокол (должен быть http или https)
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Проверяем расширение файла (если есть)
    const pathname = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    
    // Если путь заканчивается известным расширением изображения, считаем URL валидным
    if (imageExtensions.some(ext => pathname.endsWith(ext))) {
      return true;
    }
    
    // Если нет расширения, проверяем наличие параметров, которые обычно есть у изображений
    if (pathname.includes('/image') || 
        urlObj.searchParams.has('image') || 
        url.includes('/img/') || 
        url.includes('/images/')) {
      return true;
    }
    
    // По умолчанию считаем URL потенциально валидным
    return true;
  } catch (e) {
    // Если URL некорректен синтаксически
    return false;
  }
};

/**
 * Функция, которая будет генерировать HTML-разметку
 * списка изображений
 * @param {} urls - Массив путей к изображениям
 */
const addImagesToContainer = (urls) => {
  // Показываем загрузочный экран
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'flex';
  
  const container = document.querySelector('.container');
  // Очищаем контейнер перед добавлением новых изображений
  container.innerHTML = '';
  
  // Проверяем наличие URL-адресов
  if (!urls || !urls.length) {
    updateImageCount(0);
    loadingOverlay.style.display = 'none';
    return;
  }
  
  // Фильтруем невалидные URL
  const validUrls = urls.filter(isValidImageUrl);
  
  if (validUrls.length === 0) {
    updateImageCount(0);
    loadingOverlay.style.display = 'none';
    return;
  }
  
  // Добавляем изображения
  validUrls.forEach(url => addImageNode(container, url));
  
  // Обновляем счетчик изображений
  updateImageCount(validUrls.length);
  
  // Обновляем состояние чекбокса "Выбрать все"
  updateSelectAllState();
  
  // Скрываем загрузочный экран
  setTimeout(() => {
    loadingOverlay.style.display = 'none';
  }, 500);
};

/**
 * Функция создает элемент DIV для каждого изображения
 * и добавляет его в родительский DIV.
 * Создаваемый блок содержит само изображение и флажок
 * чтобы его выбрать
 * @param {*} container - родительский DIV
 * @param {*} url - URL изображения
 */
const addImageNode = (container, url) => {
  const div = document.createElement('div');
  div.className = 'imageDiv';
  
  // Создаем и добавляем изображение
  const img = document.createElement('img');
  img.src = url;
  img.loading = 'lazy'; // Ленивая загрузка для оптимизации
  
  // Добавляем обработчик ошибок для изображений
  img.onerror = function() {
    // Полностью удаляем битые изображения из выдачи
    if (div.parentNode) {
      div.parentNode.removeChild(div);
      
      // Обновляем счетчик изображений
      const currentCount = parseInt(document.getElementById('imageCount').textContent) - 1;
      updateImageCount(currentCount);
      
      // Обновляем состояние чекбокса "Выбрать все"
      updateSelectAllState();
      
      // Если это было последнее изображение и счетчик стал 0, показываем сообщение
      if (currentCount === 0) {
        const noImagesMsg = document.createElement('div');
        noImagesMsg.className = 'no-images-message';
        noImagesMsg.id = 'noImagesMessage';
        noImagesMsg.textContent = chrome.i18n.getMessage('no_images_text');
        container.appendChild(noImagesMsg);
      }
    }
  };
  
  // В любом случае первым делом добавляем изображение
  div.appendChild(img);
  
  let tooltip;
  let imageSize;
  
  // Создаем элемент для отображения размеров в режиме плитки
  if (!container.classList.contains('list-view')) {
    tooltip = document.createElement('div');
    tooltip.className = 'image-tooltip';
    tooltip.textContent = chrome.i18n.getMessage('loading_dimension');
    div.appendChild(tooltip);
  }
  
  // Создаем элемент информации об изображении для режима списка
  const imageInfo = document.createElement('div');
  imageInfo.className = 'image-info';
  
  // Добавляем информацию о файле в зависимости от режима просмотра
  if (container.classList.contains('list-view')) {
    // Добавляем имя файла
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = getFileNameFromUrl(url);
    imageInfo.appendChild(fileName);
    
    // Добавляем размер (будет заполнен после загрузки изображения)
    imageSize = document.createElement('div');
    imageSize.className = 'image-size';
    imageSize.textContent = chrome.i18n.getMessage('loading_dimension');
    imageInfo.appendChild(imageSize);
  } else {
    // В режиме сетки просто добавляем имя файла
    imageInfo.textContent = getFileNameFromUrl(url);
  }
  
  // Добавляем информацию о файле после изображения
  div.appendChild(imageInfo);
  
  // Общий обработчик onload для обновления размеров
  img.onload = function() {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const dimensions = `${width} × ${height} px`;
    
    // Сохраняем размеры в data-атрибутах для сортировки и фильтрации
    div.dataset.width = width;
    div.dataset.height = height;
    div.dataset.fileName = getFileNameFromUrl(url);
    div.dataset.size = width * height; // площадь для сортировки по размеру
    
    if (tooltip) {
      tooltip.textContent = dimensions;
    }
    if (imageSize) {
      imageSize.textContent = dimensions;
    }
    
    // Проверяем текущие фильтры
    const sizeFilter = document.getElementById('sizeFilter');
    const textFilter = document.getElementById('filterImages').value;
    
    // Пересчитываем видимость этого конкретного изображения на основе текущих фильтров
    let shouldBeVisible = true;
    
    // Проверяем текстовый фильтр
    if (textFilter) {
      const fileName = getFileNameFromUrl(url).toLowerCase();
      shouldBeVisible = fileName.includes(textFilter.toLowerCase()) || 
                        url.toLowerCase().includes(textFilter.toLowerCase());
    }
    
    // Проверяем фильтр по размеру (только если изображение видимо после текстового фильтра)
    if (shouldBeVisible && sizeFilter && sizeFilter.value !== 'all') {
      const filterValue = sizeFilter.value;
      const maxDimension = Math.max(width, height);
      
      switch (filterValue) {
        case 'small':
          shouldBeVisible = maxDimension < 500;
          break;
        case 'medium':
          shouldBeVisible = maxDimension >= 500 && maxDimension <= 1000;
          break;
        case 'large':
          shouldBeVisible = maxDimension > 1000;
          break;
      }
    }
    
    // Применяем видимость
    if (!shouldBeVisible && div.style.display !== 'none') {
      div.style.display = 'none';
      
      // Обновляем счетчик изображений
      const currentCount = parseInt(document.getElementById('imageCount').textContent) - 1;
      if (currentCount >= 0) {
        updateImageCount(currentCount);
      }
    }
    
    // Если нужно сделать группу изображений видимыми, запускаем полную фильтрацию
    // Это более надежный способ, чем менять видимость одного изображения
    if (shouldBeVisible && sizeFilter && sizeFilter.value !== 'all') {
      // Устанавливаем таймаут, чтобы не запускать фильтрацию на каждую загрузку изображения
      if (!window.filterUpdateTimeout) {
        window.filterUpdateTimeout = setTimeout(() => {
          applySizeFilter();
          window.filterUpdateTimeout = null;
        }, 200);
      }
    }
    
    // Применяем текущие настройки сортировки
    applySorting();
  };
  
  // Создаем и добавляем чекбокс
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.name = url;
  checkbox.dataset.url = url; // Для поиска при фильтрации
  
  // Обработчик изменения состояния чекбокса
  checkbox.addEventListener('change', function() {
    updateSelectedCount();
  });
  
  // Делаем клик по div переключателем чекбокса
  div.addEventListener('click', (e) => {
    // Не переключаем чекбокс, если клик был по самому чекбоксу
    if (e.target !== checkbox) {
      checkbox.checked = !checkbox.checked;
      updateSelectedCount();
    }
  });
  
  // Добавляем чекбокс последним
  div.appendChild(checkbox);
  container.appendChild(div);
};

/**
 * Извлекает имя файла из URL
 * @param {string} url - URL изображения
 * @return {string} - Имя файла или укороченный URL
 */
const getFileNameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    return filename || url.substring(0, 30) + '...';
  } catch (e) {
    return url.substring(0, 30) + '...';
  }
};

/**
 * Обновляет счетчик найденных изображений
 * @param {number} count - Количество изображений
 */
const updateImageCount = (count) => {
  const imageCount = document.getElementById('imageCount');
  imageCount.textContent = count;
  
  // Если нет изображений, показываем соответствующее сообщение
  const container = document.querySelector('.container');
  const existingMsg = container.querySelector('.no-images-message');
  
  if (count === 0 && !existingMsg) {
    const noImagesMsg = document.createElement('div');
    noImagesMsg.className = 'no-images-message';
    noImagesMsg.id = 'noImagesMessage';
    noImagesMsg.textContent = chrome.i18n.getMessage('no_images_text');
    container.appendChild(noImagesMsg);
  } else if (count > 0 && existingMsg) {
    // Если изображения появились, убираем сообщение
    existingMsg.remove();
  }
};

/**
 * Обновляет счетчик выбранных изображений
 */
const updateSelectedCount = () => {
  const selectedCount = document.getElementById('selectedCount');
  const count = document.querySelectorAll('.container input:checked').length;
  selectedCount.textContent = count;
  
  // Обновляем состояние чекбокса "Выбрать все"
  updateSelectAllState();
};

/**
 * Сбрасывает все фильтры (текстовый и по размеру) и сортировку
 */
const clearAllFilters = () => {
  // Сбрасываем текстовый фильтр
  const filterInput = document.getElementById('filterImages');
  if (filterInput) {
    filterInput.value = '';
  }
  
  // Сбрасываем фильтр по размеру
  const sizeFilter = document.getElementById('sizeFilter');
  if (sizeFilter) {
    sizeFilter.value = 'all';
  }
  
  // Сбрасываем сортировку
  const sortSelect = document.getElementById('sortImages');
  if (sortSelect) {
    sortSelect.value = 'default';
  }
  
  // Отображаем все изображения
  document.querySelectorAll('.imageDiv').forEach(div => {
    div.style.display = '';
  });
  
  // Сбрасываем выделение всех изображений
  document.querySelectorAll('.container input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // Обновляем счетчик изображений
  updateImageCount(document.querySelectorAll('.imageDiv').length);
  
  // Обновляем счетчик выбранных изображений
  updateSelectedCount();
  
  // Возвращаем все элементы в исходный порядок DOM
  resetImageOrder();
};

/**
 * Обновляет состояние чекбокса "Выбрать все" на основе состояния остальных чекбоксов
 */
const updateSelectAllState = () => {
  const selectAllCheckbox = document.getElementById('selectAll');
  // Находим только видимые чекбоксы (не скрытые фильтрацией)
  const visibleCheckboxes = Array.from(document.querySelectorAll('.container .imageDiv:not([style*="display: none"]) input[type="checkbox"]'));
  const checkedVisibleCheckboxes = visibleCheckboxes.filter(checkbox => checkbox.checked);
  
  // Если нет видимых чекбоксов, сбрасываем состояние и блокируем "Выбрать все"
  if (visibleCheckboxes.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.disabled = true;
    return;
  } else {
    // Если есть видимые чекбоксы, снимаем блокировку
    selectAllCheckbox.disabled = false;
  }
  
  // Устанавливаем состояние "Выбрать все" в зависимости от того, 
  // все ли видимые чекбоксы выбраны
  selectAllCheckbox.checked = visibleCheckboxes.length === checkedVisibleCheckboxes.length && visibleCheckboxes.length > 0;
  
  // Также меняем состояние indeterminate (частично выбран)
  selectAllCheckbox.indeterminate = checkedVisibleCheckboxes.length > 0 && checkedVisibleCheckboxes.length < visibleCheckboxes.length;
};

/**
 * Фильтрует изображения по размеру
 */
const applySizeFilter = () => {
  const sizeFilter = document.getElementById('sizeFilter');
  if (!sizeFilter) return; // На случай, если элемент еще не существует
  
  const filterValue = sizeFilter.value;
  
  // Получаем текущий текстовый фильтр
  const textFilter = document.getElementById('filterImages').value;
  
  // Сбрасываем все фильтры и заново применяем их
  // Сначала делаем все изображения видимыми
  document.querySelectorAll('.imageDiv').forEach(div => {
    div.style.display = '';
  });
  
  // Сбрасываем выделение всех изображений
  document.querySelectorAll('.container input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  // Если выбран "Все размеры" и нет текстового фильтра
  if (filterValue === 'all' && !textFilter) {
    // Показываем все изображения
    updateImageCount(document.querySelectorAll('.imageDiv').length);
    // Обновляем счетчик выбранных
    updateSelectedCount();
    // Обновляем состояние чекбокса "Выбрать все"
    updateSelectAllState();
    return;
  }
  
  // Применяем сначала текстовый фильтр, если он есть
  if (textFilter) {
    applyTextFilter(textFilter, false, false); // Последний параметр указывает не сбрасывать выделение повторно
  }
  
  // Если выбран "Все размеры", то заканчиваем (текстовый фильтр уже применён)
  if (filterValue === 'all') {
    // Обновляем счетчик выбранных
    updateSelectedCount();
    // Обновляем состояние чекбокса "Выбрать все"
    updateSelectAllState();
    return;
  }
  
  // Применяем фильтр по размеру
  const images = document.querySelectorAll('.imageDiv');
  let visibleCount = 0;
  let pendingImagesCount = 0;
  
  images.forEach(div => {
    // Если изображение уже скрыто текстовым фильтром, не трогаем его
    if (textFilter && div.style.display === 'none') return;
    
    // Проверяем, загружены ли данные о размерах
    if (!div.dataset.width || !div.dataset.height) {
      // Если размеры изображения еще не загружены, ждем загрузки
      pendingImagesCount++;
      // По умолчанию показываем изображение, пока не получены его размеры
      visibleCount++;
      return;
    }
    
    // Получаем максимальный размер (ширину или высоту)
    const width = parseInt(div.dataset.width);
    const height = parseInt(div.dataset.height);
    const maxDimension = Math.max(width, height);
    
    let visible = false;
    
    switch (filterValue) {
      case 'small':
        visible = maxDimension < 500;
        break;
      case 'medium':
        visible = maxDimension >= 500 && maxDimension <= 1000;
        break;
      case 'large':
        visible = maxDimension > 1000;
        break;
      default:
        visible = true;
    }
    
    div.style.display = visible ? '' : 'none';
    if (visible) visibleCount++;
  });
  
  // Обновляем счетчик
  updateImageCount(visibleCount);
  
  // Обновляем счетчик выбранных
  updateSelectedCount();
  
  // Обновляем состояние чекбокса "Выбрать все"
  updateSelectAllState();
  
  // Если есть изображения, размеры которых еще загружаются,
  // выполним повторную фильтрацию после небольшой задержки
  if (pendingImagesCount > 0) {
    setTimeout(() => {
      applySizeFilter();
    }, 500);
  }
  
  // Применяем текущую сортировку к отфильтрованным изображениям
  applySorting();
};

/**
 * Применяет только текстовый фильтр
 * @param {string} query - Строка поиска
 * @param {boolean} applySize - Применять ли фильтр по размеру после текстового
 * @param {boolean} resetSelection - Сбрасывать ли выделение чекбоксов
 */
const applyTextFilter = (query, applySize = true, resetSelection = true) => {
  const images = document.querySelectorAll('.imageDiv');
  let visibleCount = 0;
  
  // Сбрасываем выделение если нужно
  if (resetSelection) {
    document.querySelectorAll('.container input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
  }
  
  if (!query) {
    // Если нет текстового фильтра, показываем все изображения
    images.forEach(div => {
      div.style.display = '';
    });
    visibleCount = images.length;
  } else {
    // Применяем текстовый фильтр
    images.forEach(div => {
      const checkbox = div.querySelector('input[type="checkbox"]');
      const url = checkbox.dataset.url;
      const fileName = getFileNameFromUrl(url).toLowerCase();
      
      if (fileName.includes(query.toLowerCase()) || url.toLowerCase().includes(query.toLowerCase())) {
        div.style.display = '';
        visibleCount++;
      } else {
        div.style.display = 'none';
      }
    });
  }
  
  // Обновляем счетчик с учетом фильтрации
  updateImageCount(visibleCount);
  
  // Обновляем счетчик выбранных
  updateSelectedCount();
  
  // Обновляем состояние чекбокса "Выбрать все"
  updateSelectAllState();
  
  // Если нужно, применяем фильтр по размеру
  if (applySize) {
    const sizeFilter = document.getElementById('sizeFilter');
    if (sizeFilter && sizeFilter.value !== 'all') {
      applySizeFilter();
    } else {
      // Применяем текущую сортировку
      applySorting();
    }
  }
};

/**
 * Фильтрует изображения по названию файла
 * @param {string} query - Строка поиска
 */
const filterImages = (query) => {
  // Используем новую функцию для текстового фильтра с включенным сбросом выделения
  applyTextFilter(query, true, true);
};

/**
 * Переключает вид отображения (сетка/список)
 * @param {string} viewType - Тип отображения ('grid' или 'list')
 */
const switchView = (viewType) => {
  const container = document.querySelector('.container');
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  
  if (viewType === 'grid') {
    container.classList.add('grid-view');
    container.classList.remove('list-view');
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
  } else {
    container.classList.add('list-view');
    container.classList.remove('grid-view');
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
  }
  
  // Необходимо перерисовать все элементы с учетом нового вида
  const urls = Array.from(document.querySelectorAll('.container input[type="checkbox"]'))
    .map(checkbox => checkbox.name);
  
  // Сохраняем выбранные чекбоксы
  const selectedUrls = new Set(
    Array.from(document.querySelectorAll('.container input[type="checkbox"]:checked'))
      .map(checkbox => checkbox.name)
  );
  
  // Сохраняем текущие настройки сортировки и фильтрации
  const sortValue = document.getElementById('sortImages').value;
  const sizeFilterValue = document.getElementById('sizeFilter').value;
  const textFilterValue = document.getElementById('filterImages').value;
  
  // Очищаем и заново наполняем контейнер
  const savedContainer = container.cloneNode(false);
  container.parentNode.replaceChild(savedContainer, container);
  
  // Добавляем изображения заново
  urls.forEach(url => {
    addImageNode(savedContainer, url);
    // Восстанавливаем состояние чекбоксов
    if (selectedUrls.has(url)) {
      const checkbox = savedContainer.querySelector(`input[name="${url}"]`);
      if (checkbox) checkbox.checked = true;
    }
  });
  
  // Обновляем счетчик выбранных
  updateSelectedCount();
  
  // Применяем сохраненные настройки сортировки и фильтрации
  setTimeout(() => {
    // Используем setTimeout, чтобы дать изображениям возможность загрузиться
    // и обновить свои data-атрибуты
    if (textFilterValue) {
      filterImages(textFilterValue);
    } else if (sizeFilterValue !== 'all') {
      applySizeFilter();
    }
    
    if (sortValue !== 'default') {
      applySorting();
    }
  }, 100);
};

const getSelectedUrls = () => {
  const urls =
    Array.from(document.querySelectorAll('.container input[type="checkbox"]:checked'))
      .map(item => item.name);
  if (!urls || !urls.length) {
    throw new Error(chrome.i18n.getMessage('select_at_least_one'));
  }
  return urls;
};

const checkAndGetFileName = (index, blob) => {
  let name = parseInt(index) + 1;
  const [type, extension] = blob.type.split('/');
  if (type !== 'image' || blob.size <= 0) {
    throw Error(chrome.i18n.getMessage('invalid_content'));
  }
  return name + '.' + extension.split('+').shift();
};

const createArchive = async (urls) => {
  // Показываем загрузочный экран
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'flex';
  loadingOverlay.querySelector('p').textContent = chrome.i18n.getMessage('creating_archive');

  const zip = new JSZip();

  for (let index in urls) {
    try {
      const url = urls[index];
      // Обновляем текст загрузки
      loadingOverlay.querySelector('p').textContent = chrome.i18n.getMessage('adding_image', [
        (index + 1).toString(),
        urls.length.toString()
      ]);
      const response = await fetch(url);
      const blob = await response.blob();
      zip.file(checkAndGetFileName(index, blob), blob);
    } catch (err) {
      console.error(err);
    }
  }

  loadingOverlay.querySelector('p').textContent = chrome.i18n.getMessage('generating_archive');

  const result = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  });
  
  // Скрываем загрузочный экран
  loadingOverlay.style.display = 'none';
  
  return result;
};

const downloadArchive = (archive) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(archive);
  link.download = 'images.zip';
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
};

/**
 * Сортирует изображения по выбранному критерию
 */
const applySorting = () => {
  const sortSelect = document.getElementById('sortImages');
  if (!sortSelect) return; // На случай, если элемент еще не существует
  
  const sortValue = sortSelect.value;
  if (sortValue === 'default') return; // Оставляем исходный порядок
  
  const container = document.querySelector('.container');
  const imageDivs = Array.from(container.querySelectorAll('.imageDiv'));
  
  // Сортировка по выбранному критерию
  imageDivs.sort((a, b) => {
    switch (sortValue) {
      case 'name-asc':
        return (a.dataset.fileName || '').localeCompare(b.dataset.fileName || '');
      case 'name-desc':
        return (b.dataset.fileName || '').localeCompare(a.dataset.fileName || '');
      case 'size-asc':
        return (parseInt(a.dataset.size) || 0) - (parseInt(b.dataset.size) || 0);
      case 'size-desc':
        return (parseInt(b.dataset.size) || 0) - (parseInt(a.dataset.size) || 0);
      default:
        return 0;
    }
  });
  
  // Перемещаем элементы в соответствии с новым порядком
  imageDivs.forEach(div => {
    container.appendChild(div);
  });
};

/**
 * Восстанавливает исходный порядок изображений (при загрузке)
 */
const resetImageOrder = () => {
  // Получаем контейнер изображений
  const container = document.querySelector('.container');
  // Получаем все изображения
  const imageDivs = Array.from(container.querySelectorAll('.imageDiv'));
  
  // Сортируем по их первоначальному порядку в DOM (сравниваем URL, так как порядок загрузки соответствует порядку элементов)
  imageDivs.sort((a, b) => {
    const urlA = a.querySelector('input[type="checkbox"]').dataset.url;
    const urlB = b.querySelector('input[type="checkbox"]').dataset.url;
    // Здесь мы предполагаем, что порядок URL в исходном массиве соответствует порядку загрузки
    return urlA.localeCompare(urlB);
  });
  
  // Перемещаем элементы в соответствии с исходным порядком
  imageDivs.forEach(div => {
    container.appendChild(div);
  });
};

// Инициализация и назначение обработчиков событий
document.addEventListener('DOMContentLoaded', () => {
  // Скрываем загрузочный экран при инициализации
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'none';
  
  // Обработчик для чекбокса "Выбрать все"
  document.getElementById('selectAll')
    .addEventListener('change', (event) => {
      // Выбираем только видимые чекбоксы (не скрытые фильтрацией)
      const visibleCheckboxes = document.querySelectorAll('.container .imageDiv:not([style*="display: none"]) input[type="checkbox"]');
      for (let item of visibleCheckboxes) {
        item.checked = event.target.checked;
      }
      updateSelectedCount();
    });
  
  // Обработчик для кнопки скачивания
  document.getElementById('downloadBtn')
    .addEventListener('click', async () => {
      try {
        const urls = getSelectedUrls();
        const archive = await createArchive(urls);
        downloadArchive(archive);
      } catch (err) {
        alert(err.message);
      }
    });
  
  // Обработчик для фильтра
  document.getElementById('filterImages')
    .addEventListener('input', (event) => {
      filterImages(event.target.value);
    });
  
  // Обработчики для кнопок переключения вида
  document.getElementById('gridViewBtn')
    .addEventListener('click', () => switchView('grid'));
  
  document.getElementById('listViewBtn')
    .addEventListener('click', () => switchView('list'));
  
  // Обработчик для сортировки
  document.getElementById('sortImages')
    .addEventListener('change', () => {
      applySorting();
    });
  
  // Обработчик для фильтра по размеру
  document.getElementById('sizeFilter')
    .addEventListener('change', () => {
      applySizeFilter();
    });
  
  // Обработчик для кнопки сброса фильтров
  document.getElementById('clearFilters')
    .addEventListener('click', () => {
      clearAllFilters();
    });
});

// Обработчик сообщений от фонового скрипта
chrome.runtime.onMessage
  .addListener((message, sender, sendResponse) => {
    addImagesToContainer(message);
    sendResponse('OK');
  });

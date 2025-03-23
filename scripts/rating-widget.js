const RATING_KEY = 'app_rating_score';
const FEEDBACK_FORM_LINK = 'https://forms.gle/9N1Z4ZTPWoS2r7356';
const GOOD_REVIEW_LINK = 'https://chromewebstore.google.com/detail/image-downloader/hohnpmioogigogdedhigjpjjjonkojbk/reviews';

class RatingWidget {
  constructor() {
    this.value = 0;
    this.container = null;
    this.stars = [];
    this.init();
  }

  init() {
    // Загружаем сохраненный рейтинг
    chrome.storage.local.get([RATING_KEY], (result) => {
      if (result[RATING_KEY]) {
        this.value = parseInt(result[RATING_KEY]);
        this.updateStars();
      }
    });
  }

  createStar(index) {
    const star = document.createElement('span');
    star.className = 'star material-icons';
    star.textContent = 'star_border';
    star.style.cursor = 'pointer';
    star.style.color = '#ffd700';
    star.style.fontSize = '20px';

    star.addEventListener('mouseover', () => {
      this.highlightStars(index + 1);
    });

    star.addEventListener('mouseout', () => {
      this.highlightStars(this.value);
    });

    star.addEventListener('click', () => {
      this.handleRating(index + 1);
    });

    return star;
  }

  highlightStars(count) {
    this.stars.forEach((star, index) => {
      star.textContent = index < count ? 'star' : 'star_border';
    });
  }

  handleRating(value) {
    this.value = value;
    chrome.storage.local.set({ [RATING_KEY]: value });

    if (value > 3) {
      window.open(GOOD_REVIEW_LINK, '_blank');
    } else {
      window.open(FEEDBACK_FORM_LINK, '_blank');
    }
  }

  render(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // Создаем контейнер для виджета
    const widget = document.createElement('div');
    widget.className = 'rating-widget';
    widget.style.display = 'flex';
    widget.style.alignItems = 'center';
    widget.style.justifyContent = 'center';
    widget.style.padding = '12px 0';
    widget.style.marginBottom = '4px';

    // Добавляем текст
    const text = document.createElement('span');
    text.textContent = chrome.i18n.getMessage('rateUs') || 'Rate us:';
    text.style.marginRight = '8px';
    text.style.fontSize = '14px';
    widget.appendChild(text);

    // Создаем контейнер для звезд
    const starsContainer = document.createElement('div');
    starsContainer.style.display = 'flex';
    starsContainer.style.gap = '2px';

    // Создаем 5 звезд
    for (let i = 0; i < 5; i++) {
      const star = this.createStar(i);
      this.stars.push(star);
      starsContainer.appendChild(star);
    }

    widget.appendChild(starsContainer);
    this.container.appendChild(widget);

    // Обновляем отображение звезд
    this.updateStars();
  }

  updateStars() {
    this.highlightStars(this.value);
  }
}

// Экспортируем класс
window.RatingWidget = RatingWidget;

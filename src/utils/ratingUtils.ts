import { ApplicationLinks, RatingConstants, StorageKeys, storageSet } from '@utils';

/**
 * Обработка рейтинга пользователя
 * Общая логика для RatingWidget и RatingReminderModal
 */
export const handleRatingSubmit = (rating: number, onRated: (rating: number) => void) => {
  if (rating > 0) {
    // Помечаем что пользователь оценил приложение
    onRated(rating);

    // Сохраняем рейтинг в storage
    storageSet(StorageKeys.RATING_SCORE, rating.toString());

    // Перенаправляем в зависимости от оценки
    if (rating > RatingConstants.POSITIVE_RATING_THRESHOLD) {
      // Высокий рейтинг → Chrome Web Store
      window.open(ApplicationLinks.GOOD_REVIEW, '_blank', 'noreferrer');
    } else {
      // Низкий рейтинг → форма обратной связи
      window.open(ApplicationLinks.FEEDBACK_FORM, '_blank', 'noreferrer');
    }
  }
};

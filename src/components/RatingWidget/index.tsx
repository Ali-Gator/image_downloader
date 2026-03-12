import React, { useEffect } from 'react';

import { createTheme, Rating, Stack, ThemeProvider, Typography } from '@mui/material';

import { useRatingStore } from '@store';
import { handleRatingSubmit, useTranslation } from '@utils';

/**
 * Виджет рейтинга приложения
 *
 * Отображается в попапе и на главной странице до тех пор, пока пользователь не оценит приложение.
 * При первом запуске автоматически планирует напоминание через 10 дней.
 *
 * Логика оценки:
 * - Рейтинг > 3 звезд → перенаправление в Chrome Web Store
 * - Рейтинг ≤ 3 звезд → перенаправление на форму обратной связи
 */
function RatingWidget() {
  const { t } = useTranslation();
  const { hasRatedApp, ratingValue, loadRatingFromStorage, setHasRatedApp, setRatingValue } =
    useRatingStore();

  // === Effects ===

  /**
   * Загружаем сохраненный рейтинг при монтировании компонента
   */
  useEffect(() => {
    loadRatingFromStorage();
  }, [loadRatingFromStorage]);

  // === Handlers ===

  /**
   * Обработчик клика по звездам рейтинга
   * При выборе рейтинга:
   * - Сохраняем в store и localStorage
   * - Перенаправляем пользователя в зависимости от оценки
   */
  const handleClick = (_: React.SyntheticEvent, newValue: number | null) => {
    setRatingValue(newValue);

    if (newValue && newValue > 0) {
      handleRatingSubmit(newValue, () => {
        setHasRatedApp(true);
      });
    }
  };

  // === Theme ===

  /**
   * Создаем тему для правильного отображения звезд в RTL языках
   */
  const themeRating = createTheme({
    direction: window.getComputedStyle(document.body, null).getPropertyValue('direction') as 'rtl',
  });

  // === Render ===

  // Скрываем виджет если пользователь уже оценил приложение
  if (hasRatedApp) {
    return null;
  }

  return (
    <Stack
      direction="row"
      className="rating-widget"
      justifyContent="center"
      alignItems="center"
      spacing={0.5}
    >
      {/* Текст призыва к действию */}
      <Typography variant="body2" sx={{ marginRight: '4px', fontSize: '0.8125rem' }}>
        {t('rateUs')}
      </Typography>

      {/* Звезды рейтинга */}
      <ThemeProvider theme={themeRating}>
        <Rating
          name="rating-widget"
          value={ratingValue}
          size="small"
          onChange={handleClick}
        />
      </ThemeProvider>
    </Stack>
  );
}

export default RatingWidget;

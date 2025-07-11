import { useCallback, useEffect, useState } from 'react';

import { Close as CloseIcon } from '@mui/icons-material';
import { createTheme, Rating, ThemeProvider, Typography } from '@mui/material';

import { useRatingStore } from '@store';
import { handleRatingSubmit, StorageKeys, useTranslation } from '@utils';

import {
  CloseButton,
  ContentStack,
  MessageText,
  RatingContainer,
  RatingStack,
  StyledDialog,
  StyledDialogContent,
  StyledDialogTitle,
  TitleContainer,
} from './styles';

/**
 * Модальное окно-напоминание о рейтинге
 *
 * Показывается когда:
 * - Время напоминания пришло
 * - Пользователь еще не оценил приложение
 * - Напоминание еще не показывалось
 *
 * При показе сразу помечается как показанное, чтобы больше не появляться
 */
function RatingReminderModal() {
  const { t } = useTranslation();
  const {
    hasRatedApp,
    ratingValue,
    hasSuccessfulDownload,
    loadRatingFromStorage,
    setHasRatedApp,
    setRatingValue,
  } = useRatingStore();
  const [isOpen, setIsOpen] = useState(false);

  // === Effects ===

  /**
   * Загружаем существующий рейтинг из storage при монтировании
   * Если рейтинг уже есть, помечаем приложение как оцененное
   */
  useEffect(() => {
    // Загружаем рейтинг из storage
    loadRatingFromStorage();
  }, [loadRatingFromStorage]);

  /**
   * Проверяем условия показа модального окна
   * Показываем только если:
   * - Пользователь не оценил приложение
   * - Была успешная загрузка
   * - Время напоминания пришло
   */
  useEffect(() => {
    if (!hasRatedApp && hasSuccessfulDownload) {
      chrome.storage.local.get([StorageKeys.REMINDER_DATE_FLAG], (result) => {
        const reminderDate = result[StorageKeys.REMINDER_DATE_FLAG];

        if (reminderDate) {
          const now = new Date();
          const reminder = new Date(reminderDate);
          const shouldShow = now >= reminder;

          if (shouldShow) {
            setIsOpen(true);
            // Удаляем флаг после показа
            chrome.storage.local.remove([StorageKeys.REMINDER_DATE_FLAG]);
          }
        }
      });
    }
  }, [hasRatedApp, hasSuccessfulDownload]);

  // === Handlers ===

  /**
   * Обработчик закрытия модального окна
   */
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Обработчик изменения рейтинга
   * При выборе рейтинга:
   * - Сохраняем в store и storage
   * - Перенаправляем в зависимости от оценки
   */
  const handleRatingChange = useCallback(
    (_: React.SyntheticEvent, newValue: number | null) => {
      setRatingValue(newValue);

      if (newValue && newValue > 0) {
        handleRatingSubmit(newValue, () => {
          setHasRatedApp(true);
        });
      }
    },
    [setHasRatedApp, setRatingValue],
  );

  /**
   * Обработчик клавиши Escape для закрытия модального окна
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // === Theme ===

  const themeRating = createTheme({
    direction: window.getComputedStyle(document.body, null).getPropertyValue('direction') as 'rtl',
  });

  // === Render ===

  // Не показываем модальное окно если уже оценили или не открыто
  if (hasRatedApp || !isOpen) return null;

  return (
    <StyledDialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      {/* Header с кнопкой закрытия */}
      <StyledDialogTitle>
        <TitleContainer>
          <Typography variant="h6" component="span">
            {t('reminder_modal_title')}
          </Typography>
        </TitleContainer>
        <CloseButton onClick={handleClose} size="small">
          <CloseIcon />
        </CloseButton>
      </StyledDialogTitle>

      {/* Содержимое модального окна */}
      <StyledDialogContent>
        <ContentStack spacing={3}>
          {/* Основное сообщение */}
          <MessageText variant="body1">{t('reminder_modal_message')}</MessageText>

          {/* Виджет рейтинга */}
          <RatingContainer>
            <RatingStack direction="row">
              <Typography variant="body2">{t('rateUs')}</Typography>
              <ThemeProvider theme={themeRating}>
                <Rating
                  name="rating-reminder"
                  value={ratingValue}
                  size="medium"
                  onChange={handleRatingChange}
                />
              </ThemeProvider>
            </RatingStack>
          </RatingContainer>
        </ContentStack>
      </StyledDialogContent>
    </StyledDialog>
  );
}

export default RatingReminderModal;

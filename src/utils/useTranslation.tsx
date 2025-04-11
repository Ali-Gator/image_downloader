import { useMemo } from 'react';

import { handleError } from './errorHandlers';
import messages from '../../public/_locales/en/messages.json';

type MessageKey = keyof typeof messages;
type Substitutions = string | string[] | null;

/**
 * React хук для работы с локализацией в Chrome расширении
 *
 * @returns объект с функцией t для получения переведенного текста
 */
export const useTranslation = () => {
  const t = useMemo(() => {
    /**
     * Получение локализованного сообщения
     *
     * @param key ключ сообщения из локализационного файла
     * @param substitutions параметры для подстановки
     * @returns локализованное сообщение
     */
    return (key: MessageKey, substitutions: Substitutions = null): string => {
      try {
        // Используем chrome.i18n API если оно доступно
        if (chrome?.i18n?.getMessage) {
          // Преобразуем null в undefined для соответствия типам chrome.i18n.getMessage
          const chromeSubstitutions = substitutions === null ? undefined : substitutions;
          const message = chrome.i18n.getMessage(key, chromeSubstitutions);
          if (message) return message;
        }

        // Запасной вариант - эмуляция локализации
        if (messages[key]) {
          const message = messages[key].message;
          // Очень простая обработка подстановок - подходит не для всех случаев
          if (message && substitutions) {
            if (typeof substitutions === 'string') {
              return message.replace('$1', substitutions);
            } else if (Array.isArray(substitutions)) {
              let result = message;
              substitutions.forEach((value, index) => {
                result = result.replace(`$${index + 1}`, value);
              });
              return result;
            }
          }
          return message || (key as string);
        }

        // Если ничего не нашли, возвращаем ключ
        return key as string;
      } catch (error) {
        handleError(error);
        return key as string;
      }
    };
  }, []);

  return { t };
};

/**
 * Утилитарная функция для получения локализованного текста без использования хука
 * Удобно для использования вне React компонентов
 *
 * @param key ключ сообщения
 * @param substitutions параметры для подстановки
 * @returns локализованное сообщение
 */
export const getLocalizedMessage = (
  key: MessageKey,
  substitutions: Substitutions = null,
): string => {
  try {
    if (chrome?.i18n?.getMessage) {
      // Преобразуем null в undefined для соответствия типам chrome.i18n.getMessage
      const chromeSubstitutions = substitutions === null ? undefined : substitutions;
      const message = chrome.i18n.getMessage(key, chromeSubstitutions);
      if (message) return message;
    }

    if (messages[key]) {
      return messages[key].message || (key as string);
    }

    return key as string;
  } catch (error) {
    handleError(error);
    return key as string;
  }
};

/**
 * Минимальный набор вспомогательных функций для локализации неречктовых элементов
 */
export const DOMLocalization = {
  /**
   * Локализация заголовка страницы
   */
  localizeTitle: (messageName: MessageKey): void => {
    document.title = getLocalizedMessage(messageName);
  },
};

import type { ErrorInfo } from 'react';

import { SENTRY_FILTER_ERRORS } from '@utils/constants';

import { captureException } from './sentryCapturer';

/**
 * Преобразует любую ошибку в объект Error
 * @param error Любой тип ошибки
 * @returns Объект Error
 */
export function ensureError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function shouldIgnoreError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return SENTRY_FILTER_ERRORS.some((substr) => lower.includes(substr));
}

/**
 * Обрабатывает ошибку: отправляет в Sentry и показывает пользователю (опционально)
 * @param error Ошибка для обработки
 * @param showAlert Показать ли alert (по умолчанию false)
 * @param customMessage Пользовательское сообщение для alert
 */
export function handleError(error: unknown, showAlert = false, customMessage?: string): void {
  const errorObj = ensureError(error);
  const message = errorObj?.message || errorObj?.toString() || '';

  // Показываем пользователю, если нужно
  if (showAlert) {
    alert(customMessage || message);
  }

  if (shouldIgnoreError(message)) {
    console.warn('[handleError] Ignored error:', message);
    return;
  }

  // enrich Sentry with tabUrl if present
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const tabUrl = (error as unknown)?.tabUrl;

  if (tabUrl) {
    captureException(errorObj, { componentStack: `tabUrl: ${tabUrl}` } as ErrorInfo);
  } else {
    captureException(errorObj);
  }
}

/**
 * Обертка для обработки ошибок с управлением состоянием загрузки
 * @param action Асинхронная функция, которую нужно выполнить
 * @param setLoading Функция для установки состояния загрузки
 * @param errorMessage Пользовательское сообщение об ошибке
 * @returns Promise<T | undefined> Результат выполнения action или undefined в случае ошибки
 */
export async function withErrorHandling<T>(
  action: () => Promise<T>,
  setLoading: (isLoading: boolean) => void,
  errorMessage = 'Something went wrong. Try again',
): Promise<T | undefined> {
  setLoading(true);
  try {
    return await action();
  } catch (error) {
    handleError(error, true, errorMessage);
    return undefined;
  } finally {
    setLoading(false);
  }
}

/**
 * Creates an unhandled rejection handler that reports to Sentry
 * Call this function once early in your application
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = ensureError(
      event.reason instanceof Error ? event.reason : `Unhandled rejection: ${String(event.reason)}`,
    );

    captureException(error);
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    // Only report actual errors, not warnings or info
    captureException(event.error ? ensureError(event.error) : new Error(event.message));
  });
}

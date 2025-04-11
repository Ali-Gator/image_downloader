import { captureException } from './sentryCapturer';

/**
 * Преобразует любую ошибку в объект Error
 * @param error Любой тип ошибки
 * @returns Объект Error
 */
export function ensureError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Обрабатывает ошибку: отправляет в Sentry и показывает пользователю (опционально)
 * @param error Ошибка для обработки
 * @param showAlert Показать ли alert (по умолчанию false)
 * @param customMessage Пользовательское сообщение для alert
 */
export function handleError(error: unknown, showAlert = false, customMessage?: string): void {
  const errorObj = ensureError(error);
  // Отправляем в Sentry
  captureException(errorObj);

  // Показываем пользователю, если нужно
  if (showAlert) {
    alert(customMessage || errorObj.message);
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

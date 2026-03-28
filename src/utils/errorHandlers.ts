import { captureException } from './sentryCapturer';

/**
 * Преобразует любую ошибку в объект Error
 * @param error Любой тип ошибки
 * @returns Объект Error
 */
export function ensureError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export interface HandleErrorOptions {
  showAlert?: boolean;
  customMessage?: string;
  extra?: Record<string, unknown>;
}

export function handleError(error: unknown, options?: HandleErrorOptions): void {
  const errorObj = ensureError(error);
  const message = errorObj?.message || errorObj?.toString() || '';

  if (options?.showAlert) {
    alert(options.customMessage || message);
  }

  captureException(errorObj, options?.extra);
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
    handleError(error, { showAlert: true, customMessage: errorMessage });
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

    captureException(error, {
      source: 'unhandledrejection',
      url: globalThis.location?.href,
    });
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    // Only report actual errors, not warnings or info
    captureException(event.error ? ensureError(event.error) : new Error(event.message), {
      source: 'uncaught-error',
      url: globalThis.location?.href,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}

import type { ErrorInfo } from 'react';

import {
  BrowserClient,
  defaultStackParser,
  type EventHint,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope,
} from '@sentry/browser';

import packageData from '../../package.json';

const isDev: boolean = process.env.NODE_ENV == 'development';

// Configure client without global state
const integrations = getDefaultIntegrations({}).filter((_) => {
  return true; // Используем все стандартные интеграции
});

const client = new BrowserClient({
  dsn: 'https://815c4402aa7d273adbb56965901ea6d0@o4508841814130688.ingest.de.sentry.io/4509021769039952',
  transport: makeFetchTransport,
  stackParser: defaultStackParser,
  integrations: integrations,
  enabled: true, // Всегда включено
  release: `image-downloader@${packageData.version}`, // Фиксированная версия для тестирования
  environment: process.env.NODE_ENV, // Всегда тестовое окружение
  debug: isDev, // Включаем отладку
  tracesSampleRate: 1.0, // Фиксируем все трассировки
  allowUrls: ['*'], // Разрешаем все URL
});

const scope = new Scope();
scope.setClient(client);

// Function to capture exceptions
export const captureException = (error: Error, errorInfo?: ErrorInfo) => {
  // Set additional context to help with debugging
  scope.setTag('error.type', error.name);
  scope.setTag('handled', 'true');
  scope.setLevel('error');

  // Add browser and environment tags for better filtering
  scope.setTag('browser', 'chrome');
  scope.setTag('extension.id', chrome.runtime.id);
  scope.setTag('extension.version', packageData.version);
  scope.setTag('chrome.version', /Chrome\/([0-9.]+)/.exec(navigator.userAgent)?.[1] || 'unknown');

  // Prepare error details context
  const errorDetails: Record<string, unknown> = {
    message: error.message,
    stack: error.stack,
  };

  // Add componentStack if available
  if (errorInfo?.componentStack) {
    errorDetails.componentStack = errorInfo.componentStack;
    // If componentStack contains tabUrl, also set it as a separate tag for easier filtering
    if (errorInfo.componentStack.includes('tabUrl:')) {
      const tabUrlMatch = errorInfo.componentStack.match(/tabUrl:\s*([^\s]+)/);
      if (tabUrlMatch?.[1]) {
        scope.setTag('tab.url', tabUrlMatch[1]);
        scope.setContext('Tab Context', {
          url: tabUrlMatch[1],
        });
      }
    }
  }

  scope.setContext('Error Details', errorDetails);

  const hint: EventHint = {
    data: {
      react: errorInfo,
      handled: true,
      source: 'manual-test',
    },
  };

  // Always capture the exception and log the result
  try {
    return client.captureException(error, hint);
  } catch (sendError) {
    console.error('Failed to send error to Sentry:', sendError);
    return null;
  }
};

// Helper to manually capture messages
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  // Set additional context
  scope.setTag('message.level', level);
  scope.setLevel(level);
  scope.setContext('Message Details', {
    timestamp: new Date().toISOString(),
    message,
    source: 'manual-test',
  });

  // Capture the message and log the result
  try {
    return client.captureMessage(message, level);
  } catch (sendError) {
    console.error('Failed to send message to Sentry:', sendError);
    return null;
  }
};

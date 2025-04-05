import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope,
  type EventHint,
} from '@sentry/browser';
import type { ErrorInfo } from 'react';
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
  beforeSend: (event) => {
    console.log('Sending event to Sentry:', event);
    return event;
  }
});

const scope = new Scope();
scope.setClient(client);

// Function to capture exceptions
export const captureException = (error: Error, errorInfo?: ErrorInfo) => {
  // In development, log to console for debugging
  console.group('Error captured for Sentry:');
  console.error('Error:', error);
  console.info('Name:', error.name);
  console.info('Message:', error.message);
  console.info('Stack trace:', error.stack);
  console.info('Component Stack:', errorInfo?.componentStack);
  console.groupEnd();
  console.log('Sending to Sentry...');

  // Set additional context to help with debugging
  scope.setTag('error.type', error.name);
  scope.setTag('handled', 'true');
  scope.setLevel('error');
  scope.setContext('Error Details', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack
  });

  const hint: EventHint = {
    data: {
      react: errorInfo,
      handled: true,
      source: 'manual-test'
    },
  };

  // Always capture the exception and log the result
  try {
    const eventId = client.captureException(error, hint);
    console.log(`Error sent to Sentry with ID: ${eventId}`);
    return eventId;
  } catch (sendError) {
    console.error('Failed to send error to Sentry:', sendError);
    return null;
  }
};

// Helper to manually capture messages
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  console.log(`[${level.toUpperCase()}] ${message}`);
  console.log('Sending message to Sentry...');

  // Set additional context
  scope.setTag('message.level', level);
  scope.setLevel(level);
  scope.setContext('Message Details', {
    timestamp: new Date().toISOString(),
    message,
    source: 'manual-test'
  });

  // Capture the message and log the result
  try {
    const eventId = client.captureMessage(message, level);
    console.log(`Message sent to Sentry with ID: ${eventId}`);
    return eventId;
  } catch (sendError) {
    console.error('Failed to send message to Sentry:', sendError);
    return null;
  }
};

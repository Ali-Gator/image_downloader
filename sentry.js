import * as Sentry from '@sentry/browser';

// Initialize Sentry
Sentry.init({
  dsn: 'https://815c4402aa7d273adbb56965901ea6d0@js-de.sentry-cdn.com/815c4402aa7d273adbb56965901ea6d0',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Export Sentry for use in other files
export default Sentry; 
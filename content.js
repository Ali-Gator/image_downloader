import Sentry from './sentry.js';

// Initialize Sentry
Sentry.init({
  dsn: 'https://815c4402aa7d273adbb56965901ea6d0@js-de.sentry-cdn.com/815c4402aa7d273adbb56965901ea6d0',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

try {
  // Get all images on the page
  const images = Array.from(document.getElementsByTagName('img')).map(img => ({
    src: img.src,
    alt: img.alt,
    width: img.width,
    height: img.height
  }));

  // Send images back to the extension
  chrome.runtime.sendMessage({
    action: 'imagesFound',
    images: images
  });
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      event: 'contentScriptExecution'
    }
  });
} 
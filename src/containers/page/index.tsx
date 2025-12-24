import { StrictMode } from 'react';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary, Page } from '@components';
import { DOMLocalization, PAYWALL_ID, setupGlobalErrorHandlers } from '@utils';

import theme from '../../theme';

// Set up global error handlers for Sentry
setupGlobalErrorHandlers();

// Инициализируем локализацию для title страницы
DOMLocalization.localizeTitle('popup_title');

async function loadMonetizeSdk(): Promise<void> {
  // If already loaded (production via <script src="/wall.2.1.2.js">), do nothing.
  if (window.paywall) return;

  await new Promise<void>((resolve) => {
    try {
      const existing = document.querySelector('script[data-monetize-wall-sdk="1"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => resolve(), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.dataset.monetizeWallSdk = '1';
      script.async = false;
      script.type = 'text/javascript';
      script.src = chrome.runtime.getURL('wall.2.1.2.js');

      script.onload = () => resolve();
      script.onerror = () => resolve();

      document.head.prepend(script);
    } catch {
      resolve();
    }
  });
}

(async () => {
  try {
    await loadMonetizeSdk();
    window.paywall?.init(PAYWALL_ID);
  } catch {
    // Intentionally ignore: OLD/non-Tier1 users should not be impacted by SDK init issues.
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
        <ErrorBoundary>
          <Page />
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
);

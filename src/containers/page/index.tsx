import { StrictMode } from 'react';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary, Page } from '@components';
import {
  DOMLocalization,
  ensureMonetizeSdkLoaded,
  PAYWALL_ID,
  setupGlobalErrorHandlers,
} from '@utils';

import theme from '../../theme';

// Set up global error handlers for Sentry
setupGlobalErrorHandlers();

// Инициализируем локализацию для title страницы
DOMLocalization.localizeTitle('popup_title');

(async () => {
  try {
    await ensureMonetizeSdkLoaded();
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

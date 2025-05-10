import { StrictMode } from 'react';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary, OptionsPage } from '@components';
import { DOMLocalization, setupGlobalErrorHandlers } from '@utils';

import theme from '../../theme';

// Set up global error handlers for Sentry
setupGlobalErrorHandlers();

// Инициализируем локализацию для title страницы
DOMLocalization.localizeTitle('options_title');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
        <ErrorBoundary>
          <OptionsPage />
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
);

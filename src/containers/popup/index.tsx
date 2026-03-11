import { StrictMode } from 'react';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary, Popup } from '@components';
import { DOMLocalization, setupGlobalErrorHandlers } from '@utils';

import theme from '../../theme';

// Set up global error handlers for Sentry
setupGlobalErrorHandlers();

// Инициализируем локализацию для title страницы
DOMLocalization.localizeTitle('popup_title');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={3000}
        style={{ fontFamily: '"DM Sans", sans-serif', borderRadius: 8 }}
      >
        <ErrorBoundary>
          <Popup />
        </ErrorBoundary>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
);

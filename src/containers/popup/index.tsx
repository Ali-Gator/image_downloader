import { StrictMode } from 'react';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { createRoot } from 'react-dom/client';

import ErrorBoundary from '../../components/ErrorBoundary';
import { Popup } from '../../components/Popup';
import theme from '../../theme';
import { setupGlobalErrorHandlers } from '../../utils/errorHandlers';
import { DOMLocalization } from '../../utils/useTranslation';

// Set up global error handlers for Sentry
setupGlobalErrorHandlers();

// Инициализируем локализацию для title страницы
DOMLocalization.localizeTitle('popup_title');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Popup />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);

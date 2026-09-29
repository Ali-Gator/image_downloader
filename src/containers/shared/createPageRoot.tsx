import { StrictMode } from 'react';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary, Page } from '@components';
import { DOMLocalization, setupGlobalErrorHandlers } from '@utils';

import theme from '../../theme';

/**
 * Shared bootstrap for page.html and sidepanel.html entry points.
 * Both render the same <Page /> component inside identical providers.
 */
export function createPageRoot() {
  setupGlobalErrorHandlers();
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
            <Page />
          </ErrorBoundary>
        </SnackbarProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

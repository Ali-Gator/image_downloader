import { StrictMode } from 'react';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { createRoot } from 'react-dom/client';

import { Page } from '../../components/Page';
import theme from '../../theme';
import { DOMLocalization } from '../../utils/useTranslation';

// Инициализируем локализацию для title страницы
DOMLocalization.localizeTitle('popup_title');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Page />
    </ThemeProvider>
  </StrictMode>,
);

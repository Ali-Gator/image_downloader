import { StrictMode } from 'react';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { createRoot } from 'react-dom/client';

import { Popup } from '../../components/Popup';
import theme from '../../theme';
import { DOMLocalization } from '../../utils/useTranslation';

// Инициализируем локализацию для title страницы
DOMLocalization.localizeTitle('popup_title');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Popup />
    </ThemeProvider>
  </StrictMode>,
);

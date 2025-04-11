import { StrictMode } from 'react';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { createRoot } from 'react-dom/client';

import { Page } from '../../components/Page';
import theme from '../../theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Page />
    </ThemeProvider>
  </StrictMode>,
);

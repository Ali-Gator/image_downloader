import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import Popup from '../../components/Popup';
import './index.css';
import theme from '../../theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <Popup />
    </ThemeProvider>
  </StrictMode>
);

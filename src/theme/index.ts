import { createTheme } from '@mui/material';

// Определяем все цвета явно, как в CSS-переменных
const colors = {
  primaryMain: '#6200ee',
  primaryLight: '#bb86fc',
  primaryDark: '#4a0072',
  secondaryMain: '#03dac6',
  secondaryLight: '#5effea',
  secondaryDark: '#018786',
  textPrimary: '#202124',
  textSecondary: '#5f6368',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  error: '#cf6679',
  shadowColor: 'rgba(98, 0, 238, 0.2)',
  borderColor: '#e0dae6',
};

// Создаем градиенты
const gradients = {
  primary: `linear-gradient(135deg, ${colors.primaryMain}, #9c27b0)`,
  accent: `linear-gradient(135deg, ${colors.secondaryMain}, ${colors.secondaryDark})`,
};

// Создаем тему с нашими цветами
const theme = createTheme({
  palette: {
    primary: {
      main: colors.primaryMain,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: '#fff',
    },
    secondary: {
      main: colors.secondaryMain,
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
      contrastText: '#fff',
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    error: {
      main: colors.error,
    },
  },
  typography: {
    fontFamily: '"Roboto", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
        containedPrimary: {
          background: gradients.primary,
          '&:hover': {
            background: gradients.primary,
          },
        },
        containedSecondary: {
          background: gradients.accent,
          '&:hover': {
            background: gradients.accent,
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },
        'html, body': {
          width: '100%',
          height: '100%',
        },
        body: {
          lineHeight: 1.5,
        },
      },
    },
  },
});

// Экспортируем дополнительные цвета и градиенты
export { colors, gradients };
export default theme;

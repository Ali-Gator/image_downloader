import { createTheme } from '@mui/material';

// Определяем все цвета явно, как в CSS-переменных
const colors = {
  // Primary colors
  primaryMain: '#6200ee',
  primaryLight: '#bb86fc',
  primaryDark: '#4a0072',
  primaryGradientEnd: '#9c27b0',

  // Secondary colors
  secondaryMain: '#03dac6',
  secondaryLight: '#5effea',
  secondaryDark: '#018786',

  // Text colors
  textPrimary: '#202124',
  textSecondary: '#5f6368',

  // Background colors
  white: '#FFFFFF',
  surface: '#F8F9FA',

  // Grey scale
  grey300: '#e0e0e0',
  grey400: '#bdbdbd',
  grey500: 'rgba(0, 0, 0, 0.26)',

  // Utility colors
  error: '#cf6679',
  shadowColor: 'rgba(98, 0, 238, 0.2)',
  borderColor: '#e0dae6',
};

// Определяем тени
const shadows = {
  small: '0px 1px 3px -1px rgba(0,0,0,0.2)',
  medium: '0px 2px 4px -1px rgba(0,0,0,0.2)',
  large: '0px 4px 8px -1px rgba(0,0,0,0.3)',
};

// Создаем градиенты
const gradients = {
  primary: `linear-gradient(135deg, ${colors.primaryMain}, ${colors.primaryGradientEnd})`,
  accent: `linear-gradient(135deg, ${colors.secondaryMain}, ${colors.secondaryDark})`,
};

// Создаем тему с нашими цветами
const theme = createTheme({
  palette: {
    primary: {
      main: colors.primaryMain,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.secondaryMain,
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
      contrastText: colors.white,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    background: {
      default: colors.white,
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          fontWeight: 500,
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'box-shadow 0.3s, transform 0.3s',
          '& .MuiSvgIcon-root': {
            marginRight: 8,
            fontSize: '1.2rem',
          },
        },
        containedPrimary: {
          background: gradients.primary,
          color: colors.white,
          boxShadow: shadows.medium,
          '&:hover': {
            background: gradients.primary,
            boxShadow: shadows.large,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(1px)',
            boxShadow: shadows.small,
          },
        },
        containedSecondary: {
          background: gradients.accent,
          color: colors.white,
          boxShadow: shadows.medium,
          '&:hover': {
            background: gradients.accent,
            boxShadow: shadows.large,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(1px)',
            boxShadow: shadows.small,
          },
          '&.Mui-disabled': {
            backgroundColor: colors.grey300,
            color: colors.grey500,
            boxShadow: 'none',
            backgroundImage: 'none',
            border: `1px solid ${colors.grey400}`,
            opacity: 0.9,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: colors.primaryMain,
          '&.Mui-checked': {
            color: colors.primaryMain,
          },
          '&.MuiCheckbox-indeterminate': {
            color: colors.primaryMain,
          },
          '&.Mui-disabled': {
            color: colors.grey400,
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
export { colors, gradients, shadows };
export default theme;

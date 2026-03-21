import { createTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

const colors = {
  // Primary colors
  primaryMain: '#2D5BE3',
  primaryLight: '#EBF0FD',
  primaryDark: '#1E3FA0',

  // Secondary colors
  secondaryMain: '#2D5BE3',
  secondaryLight: '#EBF0FD',
  secondaryDark: '#1E3FA0',

  // Gradient colors (header shimmer, onboarding stripe)
  gradientMid: '#4A6CF7',
  gradientEnd: '#6366F1',
  gradientAccent: '#5B8DEF',

  // Enhanced image accent (purple)
  enhanced: '#5e35b1',
  enhancedLight: '#7c4dff',

  // Text colors
  textPrimary: '#1A1A18',
  textSecondary: '#6B6B66',
  textTertiary: '#9C9C96',

  // Background colors
  white: '#FFFFFF',
  surface: '#FAFAF8',

  // Grey scale
  grey300: '#DDD9D3',
  grey400: '#D0CEC9',
  grey500: 'rgba(0, 0, 0, 0.26)',

  // Utility colors
  error: '#DC4C4C',
  success: '#2BA563',
  warning: '#E5A000',
  shadowColor: 'rgba(45, 91, 227, 0.12)',
  borderColor: '#DDD9D3',

  // Quality badge colors (darker variants for text)
  successDark: '#1E8A4E',
  warningDark: '#B07800',
  errorDark: '#C03030',

  // Overlay colors
  backdropColor: 'rgba(26, 26, 24, 0.4)',
  dialogShadow: '0 24px 48px rgba(0,0,0,0.12)',
};

const shadows = {
  small: '0 1px 2px rgba(0,0,0,0.04)',
  medium: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  large: '0 4px 12px rgba(0,0,0,0.08)',
};

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
      default: colors.surface,
      paper: colors.white,
    },
    error: {
      main: colors.error,
    },
    success: {
      main: colors.success,
    },
    warning: {
      main: colors.warning,
    },
    divider: colors.borderColor,
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          fontWeight: 600,
          textTransform: 'none',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s, transform 0.2s, background-color 0.2s',
          fontSize: '0.8125rem',
          letterSpacing: '0.01em',
          '& .MuiSvgIcon-root': {
            marginRight: 6,
            fontSize: '1.1rem',
          },
        },
        containedPrimary: {
          background: colors.primaryMain,
          color: colors.white,
          boxShadow: `0 1px 3px ${colors.shadowColor}`,
          '&:hover': {
            background: colors.primaryDark,
            boxShadow: `0 2px 8px rgba(45, 91, 227, 0.25)`,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: shadows.small,
          },
        },
        containedSecondary: {
          background: colors.primaryMain,
          color: colors.white,
          boxShadow: `0 1px 3px ${colors.shadowColor}`,
          '&:hover': {
            background: colors.primaryDark,
            boxShadow: `0 2px 8px rgba(45, 91, 227, 0.25)`,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
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
        outlined: {
          borderColor: colors.borderColor,
          color: colors.textPrimary,
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: colors.surface,
            borderColor: colors.grey400,
          },
        },
        outlinedPrimary: {
          borderColor: colors.borderColor,
          color: colors.textPrimary,
          '&:hover': {
            backgroundColor: colors.surface,
            borderColor: colors.grey400,
          },
        },
        outlinedSecondary: {
          borderColor: colors.borderColor,
          color: colors.textPrimary,
          '&:hover': {
            backgroundColor: colors.surface,
            borderColor: colors.grey400,
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
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            fontSize: '0.8125rem',
            '& fieldset': {
              borderColor: colors.borderColor,
            },
            '&:hover fieldset': {
              borderColor: colors.grey400,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primaryMain,
              boxShadow: `0 0 0 3px ${colors.shadowColor}`,
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.borderColor,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.grey400,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primaryMain,
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: `1px solid ${colors.borderColor}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: `1px solid ${colors.borderColor}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 10,
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
          WebkitFontSmoothing: 'antialiased',
        },
      },
    },
  },
});

export { alpha, colors, shadows };
export default theme;

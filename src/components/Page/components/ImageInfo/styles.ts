import { Theme } from '@mui/material';
import { SxProps } from '@mui/system';

// Constants for sizes and styles
const INFO_STYLES = {
  GRID: {
    PADDING: 1,
  },
  LIST: {
    PADDING_HORIZONTAL: 1,
    PADDING_VERTICAL: 0,
    LINK_PADDING: 0.5,
    ACTION_BUTTON_SIZE: 3,
  },
  COMMON: {
    GAP: 0.5,
    ICON_SIZE: 'small',
  },
};

// Common styles for image information
const commonInfoStyles = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(INFO_STYLES.COMMON.GAP),

  '.file-name': {
    fontWeight: 500,
    fontSize: '0.875rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
    maxWidth: '100%',
  },

  '.dimensions': {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },

  '.actions-container': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },

  '.url-container': {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },

  '.action-button': {
    cursor: 'pointer',
  },
});

/**
 * Styles for image information in grid mode
 */
export const gridImageInfoStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonInfoStyles(theme),
  padding: theme.spacing(INFO_STYLES.GRID.PADDING),
  cursor: 'pointer',
  position: 'relative',

  '.url-container': {
    display: 'none',
  },

  '.copy-button': {
    position: 'absolute',
    top: theme.spacing(INFO_STYLES.GRID.PADDING),
    right: theme.spacing(INFO_STYLES.GRID.PADDING),
    opacity: 0,
    transition: 'opacity 0.2s',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
  },

  '&:hover .copy-button': {
    opacity: 1,
  },
});

/**
 * Styles for image information in list mode
 */
export const listImageInfoStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonInfoStyles(theme),
  padding: theme.spacing(INFO_STYLES.LIST.PADDING_VERTICAL, INFO_STYLES.LIST.PADDING_HORIZONTAL),
  justifyContent: 'center',
  flexDirection: 'column',
  cursor: 'default',
  width: '100%',
  overflow: 'hidden',
  flexGrow: 1,

  '.file-name': {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  '.image-url': {
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s',
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(INFO_STYLES.LIST.LINK_PADDING, 0),
    maxWidth: '100%',
    gap: theme.spacing(0.5),
    '&:hover': {
      color: theme.palette.primary.main,
      '& .url-icon': {
        color: theme.palette.primary.main,
      },
    },
  },

  '.url-icon': {
    flexShrink: 0,
    verticalAlign: 'middle',
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    transition: 'color 0.2s',
  },

  '.url-text': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // For non-interactive URLs
  'span.image-url': {
    cursor: 'default',
  },

  '.action-button': {
    padding: theme.spacing(0.5),
    minWidth: 'auto',
    flexShrink: 0,
  },
});

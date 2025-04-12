import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

// Константы для размеров и стилей
const CARD_STYLES = {
  GRID: {
    IMAGE_CONTAINER_MIN_HEIGHT: 18, // в единицах spacing
    IMAGE_MAX_HEIGHT: 25,
  },
  LIST: {
    CARD_HEIGHT: 14,
    IMAGE_CONTAINER_HEIGHT: 12,
    IMAGE_CONTAINER_WIDTH: 15,
    IMAGE_MAX_HEIGHT: 12.5,
    IMAGE_MAX_WIDTH: 18.75,
  },
  COMMON: {
    CHECKBOX_SIZE: 1,
    PADDING: 1,
  },
};

// Базовые стили для карточек
export const commonCardStyles = (theme: Theme): SxProps<Theme> => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  boxShadow: theme.shadows[1],
  transition: theme.transitions.create(['box-shadow', 'transform', 'border-color']),
  cursor: 'pointer',
  border: `1px solid ${theme.palette.divider}`,
  userSelect: 'none',

  '&:hover': {
    boxShadow: theme.shadows[3],
    transform: 'translateY(-2px)',
  },

  '&:active': {
    transform: 'translateY(0)',
    boxShadow: theme.shadows[2],
  },

  '&.selected': {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
});

const checkboxStyles = (theme: Theme, isGrid: boolean) => ({
  position: isGrid ? 'absolute' : 'static',
  ...(isGrid
    ? {
        top: theme.spacing(CARD_STYLES.COMMON.CHECKBOX_SIZE),
        left: theme.spacing(CARD_STYLES.COMMON.CHECKBOX_SIZE),
        zIndex: 1,
        opacity: 0,
        visibility: 'hidden',
      }
    : {
        marginRight: theme.spacing(CARD_STYLES.COMMON.PADDING),
        opacity: 1,
        visibility: 'visible',
      }),
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  borderRadius: '50%',
  transition: theme.transitions.create(['transform', 'opacity', 'visibility']),
  '&:hover': {
    transform: 'scale(1.1)',
  },
});

const imageContainerStyles = (theme: Theme, isGrid: boolean) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[100],
  ...(isGrid
    ? {
        position: 'relative',
        flex: '1 0 auto',
        minHeight: theme.spacing(CARD_STYLES.GRID.IMAGE_CONTAINER_MIN_HEIGHT),
      }
    : {
        height: theme.spacing(CARD_STYLES.LIST.IMAGE_CONTAINER_HEIGHT),
        width: theme.spacing(CARD_STYLES.LIST.IMAGE_CONTAINER_WIDTH),
        flexShrink: 0,
      }),
});

const imageStyles = (theme: Theme, isGrid: boolean) => ({
  display: 'block',
  objectFit: 'contain',
  width: 'auto',
  height: 'auto',
  backgroundColor: 'transparent',
  pointerEvents: 'none',
  ...(isGrid
    ? {
        maxWidth: '100%',
        maxHeight: theme.spacing(CARD_STYLES.GRID.IMAGE_MAX_HEIGHT),
        margin: '0 auto',
      }
    : {
        maxHeight: theme.spacing(CARD_STYLES.LIST.IMAGE_MAX_HEIGHT),
        maxWidth: theme.spacing(CARD_STYLES.LIST.IMAGE_MAX_WIDTH),
        margin: 'auto',
      }),
});

const imageInfoBaseStyles = (theme: Theme): SxProps<Theme> => ({
  padding: theme.spacing(CARD_STYLES.COMMON.PADDING),
  pointerEvents: 'none',

  '.file-name': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: theme.typography.fontWeightMedium,
  },

  '.dimensions': {
    color: theme.palette.text.secondary,
  },
});

export const gridImageItemStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonCardStyles(theme),
  display: 'flex',
  flexDirection: 'column',
  height: '100%',

  '.image-checkbox': checkboxStyles(theme, true),

  '&:hover .image-checkbox, & .image-checkbox.Mui-checked': {
    opacity: 1,
    visibility: 'visible',
  },

  '.image-container': imageContainerStyles(theme, true),

  img: imageStyles(theme, true),
});

export const listImageItemStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonCardStyles(theme),
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: theme.spacing(CARD_STYLES.COMMON.PADDING),
  gap: theme.spacing(2),
  height: theme.spacing(CARD_STYLES.LIST.CARD_HEIGHT),

  '.image-container': imageContainerStyles(theme, false),

  img: imageStyles(theme, false),

  '.image-checkbox': checkboxStyles(theme, false),
});

export const gridImageInfoStyles = (theme: Theme): SxProps<Theme> => ({
  ...imageInfoBaseStyles(theme),
});

export const listImageInfoStyles = (theme: Theme): SxProps<Theme> => ({
  ...imageInfoBaseStyles(theme),
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
});

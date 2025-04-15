import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

// Constants for sizes and styles
const CARD_STYLES = {
  GRID: {
    IMAGE_CONTAINER_MIN_HEIGHT: 18, // in spacing units
    IMAGE_MAX_HEIGHT: 25,
  },
  LIST: {
    IMAGE_CONTAINER_HEIGHT: 12,
    IMAGE_CONTAINER_WIDTH: 15,
    IMAGE_MAX_HEIGHT: 12.5,
    IMAGE_MAX_WIDTH: 18.75,
    CHECKBOX_AREA_WIDTH: 5,
  },
  COMMON: {
    CHECKBOX_SIZE: 1,
    PADDING: 1,
  },
};

// Common styles
const commonCardStyles = (theme: Theme): SxProps<Theme> => ({
  height: '100%',
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  boxShadow: theme.shadows[1],
  transition: theme.transitions.create(['box-shadow', 'transform', 'border-color']),
  border: `1px solid ${theme.palette.divider}`,

  '&.selected': {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
});

const commonCheckboxStyles = (theme: Theme) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  borderRadius: '50%',
  transition: theme.transitions.create(['transform', 'opacity', 'visibility']),
  '&:hover': {
    transform: 'scale(1.1)',
  },
  '& .MuiSvgIcon-root': {
    zIndex: 1,
    position: 'relative',
  },
  '& .PrivateSwitchBase-input': {
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 0,
    cursor: 'pointer',
  },
});

const commonImageContainerStyles = (theme: Theme) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[100],
});

const commonImageStyles = {
  display: 'block',
  objectFit: 'contain',
  width: 'auto',
  height: 'auto',
  backgroundColor: 'transparent',
  pointerEvents: 'none',
};

// Grid-specific styles
const gridCheckboxStyles = (theme: Theme) => ({
  position: 'absolute',
  top: theme.spacing(CARD_STYLES.COMMON.CHECKBOX_SIZE),
  left: theme.spacing(CARD_STYLES.COMMON.CHECKBOX_SIZE),
  zIndex: 1,
  opacity: 0,
  visibility: 'hidden',
});

const gridCheckboxAreaStyles = () => ({
  // Grid mode doesn't need specific styles
});

const gridImageContainerStyles = (theme: Theme) => ({
  position: 'relative',
  flex: '1 0 auto',
  minHeight: theme.spacing(CARD_STYLES.GRID.IMAGE_CONTAINER_MIN_HEIGHT),
});

const gridImageStyles = (theme: Theme) => ({
  maxWidth: '100%',
  maxHeight: theme.spacing(CARD_STYLES.GRID.IMAGE_MAX_HEIGHT),
  margin: '0 auto',
});

// List-specific styles
const listCheckboxStyles = (theme: Theme) => ({
  position: 'static',
  marginRight: theme.spacing(CARD_STYLES.COMMON.PADDING),
  opacity: 1,
  visibility: 'visible',
});

const listCheckboxAreaStyles = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: theme.spacing(CARD_STYLES.LIST.CHECKBOX_AREA_WIDTH),
  cursor: 'pointer',
  position: 'relative',
  zIndex: 1,
  height: '100%',
});

const listImageContainerStyles = (theme: Theme) => ({
  height: theme.spacing(CARD_STYLES.LIST.IMAGE_CONTAINER_HEIGHT),
  width: theme.spacing(CARD_STYLES.LIST.IMAGE_CONTAINER_WIDTH),
  flexShrink: 0,
  cursor: 'default',
});

const listImageStyles = (theme: Theme) => ({
  maxHeight: theme.spacing(CARD_STYLES.LIST.IMAGE_MAX_HEIGHT),
  maxWidth: theme.spacing(CARD_STYLES.LIST.IMAGE_MAX_WIDTH),
  margin: 'auto',
});

// Combined styles
export const gridImageItemStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonCardStyles(theme),
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',

  '.checkbox-area': gridCheckboxAreaStyles(),
  '.image-checkbox': {
    ...commonCheckboxStyles(theme),
    ...gridCheckboxStyles(theme),
  },

  '&:hover .image-checkbox, & .image-checkbox.Mui-checked': {
    opacity: 1,
    visibility: 'visible',
  },

  '.image-container': {
    ...commonImageContainerStyles(theme),
    ...gridImageContainerStyles(theme),
  },

  img: {
    ...commonImageStyles,
    ...gridImageStyles(theme),
  },
});

export const listImageItemStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonCardStyles(theme),
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: theme.spacing(CARD_STYLES.COMMON.PADDING),
  gap: theme.spacing(2),
  cursor: 'default',

  '.checkbox-area': listCheckboxAreaStyles(theme),
  '.image-container': {
    ...commonImageContainerStyles(theme),
    ...listImageContainerStyles(theme),
  },
  '.image-checkbox': {
    ...commonCheckboxStyles(theme),
    ...listCheckboxStyles(theme),
  },

  img: {
    ...commonImageStyles,
    ...listImageStyles(theme),
  },
});

import { Box } from '@mui/material';
import { styled, Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

// ===== STYLED COMPONENTS =====
// Styled components for reuse
export const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

export const StyledTopActionBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: theme.spacing(6),
  display: 'flex',
  justifyContent: 'left',
  alignItems: 'center',
  padding: theme.spacing(0.5),
  zIndex: 2,
  backdropFilter: 'blur(2px)',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  transition: 'opacity 0.2s ease',
  opacity: 0,

  '& > *:not(:first-child)': {
    marginLeft: 'auto', // Push all except the first child (checkbox) to the right
  },
}));

export const StyledImageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[100],
}));

export const StyledCheckboxArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: theme.spacing(5),
  cursor: 'pointer',
  position: 'relative',
  zIndex: 1,
  height: '100%',
}));

// ===== CONSTANTS =====
// Constants for sizes and styles
const CARD_STYLES = {
  GRID: {
    IMAGE_CONTAINER_MIN_HEIGHT: 16, // Balanced height for grid view
    IMAGE_MAX_HEIGHT: 22, // Slightly higher max height to maintain aspect ratio
    INFO_SECTION_HEIGHT: 3, // Reduced info section height
    ASPECT_RATIO: 1.2, // Target aspect ratio (width/height) for image container
    TOP_BAR_HEIGHT: 6, // Height for the top action bar to fit buttons
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

// ===== COMMON STYLES =====
// Base styles shared between grid and list modes
const commonCardStyles = (theme: Theme) => ({
  height: '100%',
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  boxShadow: theme.shadows[1],
  transition: theme.transitions.create(['box-shadow', 'transform', 'border-color']),
  border: `1px solid ${theme.palette.divider}`,
});

const commonImageStyles = {
  display: 'block',
  objectFit: 'contain',
  width: 'auto',
  height: 'auto',
  backgroundColor: 'transparent',
  pointerEvents: 'none',
};

// ===== GRID MODE STYLES =====
const gridImageContainerStyles = (theme: Theme) => ({
  position: 'relative',
  flex: '1 0 auto',
  minHeight: theme.spacing(CARD_STYLES.GRID.IMAGE_CONTAINER_MIN_HEIGHT),
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(0.5),
  // No need for top margin since action bar is absolutely positioned
});

const gridImageStyles = (theme: Theme) => ({
  maxWidth: '100%',
  maxHeight: theme.spacing(CARD_STYLES.GRID.IMAGE_MAX_HEIGHT),
  margin: '0 auto',
});

// ===== LIST MODE STYLES =====
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

// ===== EXPORTED STYLES =====
// Combined styles for grid mode (for use with SxProps only when needed)
export const gridImageItemStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonCardStyles(theme),
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  paddingBottom: theme.spacing(0.75),
  position: 'relative',

  '&:hover .top-action-bar': {
    opacity: 1,
  },

  '&.selected': {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },

  '.image-container': {
    ...gridImageContainerStyles(theme),
  },

  img: {
    ...commonImageStyles,
    ...gridImageStyles(theme),
    maxWidth: '100%',
    objectFit: 'contain',
  },

  // Compact info container
  '& .dimensions-container': {
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing(0.25), // Smaller gap between elements
  },
});

// Combined styles for list mode (for use with SxProps only when needed)
export const listImageItemStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonCardStyles(theme),
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: theme.spacing(CARD_STYLES.COMMON.PADDING),
  gap: theme.spacing(2),
  cursor: 'default',

  '&.selected': {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },

  '.image-container': {
    ...listImageContainerStyles(theme),
  },

  img: {
    ...commonImageStyles,
    ...listImageStyles(theme),
  },
});

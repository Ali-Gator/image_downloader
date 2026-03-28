import { Box } from '@mui/material';
import { styled, Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

import { colors, shadows } from '@theme';

export const enhancedAccentStyles = {
  '&::before': {
    content: '""',
    position: 'absolute' as const,
    left: 0,
    top: '8px',
    bottom: '8px',
    width: '3px',
    borderRadius: '0 3px 3px 0',
    background: `linear-gradient(180deg, ${colors.enhancedLight} 0%, ${colors.primaryMain} 100%)`,
    zIndex: 1,
  },
};

// ===== STYLED COMPONENTS =====
export const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

export const StyledTopActionBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: theme.spacing(0.5),
  zIndex: 2,
  transition: 'opacity 0.15s ease',
  opacity: 0,
  pointerEvents: 'none',

  '& > *': {
    pointerEvents: 'auto',
  },
}));

export const TopBarLeftSection = styled('div')({
  display: 'flex',
  alignItems: 'center',
});

export const TopBarRightSection = styled('div')({
  display: 'flex',
  alignItems: 'center',
});

export const StyledImageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
  cursor: 'zoom-in',
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
const CARD_STYLES = {
  GRID: {
    IMAGE_CONTAINER_MIN_HEIGHT: 16,
    IMAGE_MAX_HEIGHT: 22,
    INFO_SECTION_HEIGHT: 3,
    ASPECT_RATIO: 1.2,
    TOP_BAR_HEIGHT: 6,
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
const commonCardStyles = (theme: Theme) => ({
  position: 'relative',
  borderRadius: '10px',
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  boxShadow: 'none',
  transition: theme.transitions.create(['box-shadow', 'transform', 'border-color'], {
    duration: 200,
  }),
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
  height: theme.spacing(CARD_STYLES.GRID.IMAGE_CONTAINER_MIN_HEIGHT),
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(0.5),
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
});

const listImageStyles = (theme: Theme) => ({
  maxHeight: theme.spacing(CARD_STYLES.LIST.IMAGE_MAX_HEIGHT),
  maxWidth: theme.spacing(CARD_STYLES.LIST.IMAGE_MAX_WIDTH),
  margin: 'auto',
});

// ===== EXPORTED STYLES =====
export const gridImageItemStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonCardStyles(theme),
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  paddingBottom: theme.spacing(0.75),
  position: 'relative',

  '&:hover': {
    borderColor: theme.palette.grey[400],
    boxShadow: shadows.large,
  },

  '&:hover .top-action-bar': {
    opacity: 1,
  },

  '&.selected': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${theme.palette.primary.light}`,
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

  '& .dimensions-container': {
    justifyContent: 'flex-start',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    gap: theme.spacing(0.25),
  },
});

export const listImageItemStyles = (theme: Theme): SxProps<Theme> => ({
  ...commonCardStyles(theme),
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: theme.spacing(CARD_STYLES.COMMON.PADDING),
  marginBottom: theme.spacing(1.5),
  gap: theme.spacing(2),
  cursor: 'pointer',

  '&:hover': {
    borderColor: theme.palette.grey[400],
    boxShadow: shadows.large,
  },

  '&.selected': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 3px ${theme.palette.primary.light}`,
  },

  '.image-container': {
    ...listImageContainerStyles(theme),
  },

  img: {
    ...commonImageStyles,
    ...listImageStyles(theme),
  },
});

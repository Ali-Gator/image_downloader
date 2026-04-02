import { Box } from '@mui/material';
import { styled, Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

import { colors, shadows } from '@theme';
import { CARD_SIZE_CONFIG, CardSize } from '@utils/constants';

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
const gridImageContainerStyles = (theme: Theme, cardSize: CardSize) => {
  const config = CARD_SIZE_CONFIG[cardSize].grid;
  return {
    position: 'relative',
    height: theme.spacing(config.imageContainerMinHeight),
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(0.5),
  };
};

const gridImageStyles = (theme: Theme, cardSize: CardSize) => {
  const config = CARD_SIZE_CONFIG[cardSize].grid;
  return {
    maxWidth: '100%',
    maxHeight: theme.spacing(config.imageMaxHeight),
    margin: '0 auto',
  };
};

// ===== LIST MODE STYLES =====
const listImageContainerStyles = (theme: Theme, cardSize: CardSize) => {
  const config = CARD_SIZE_CONFIG[cardSize].list;
  return {
    height: theme.spacing(config.imageContainerHeight),
    width: theme.spacing(config.imageContainerWidth),
    flexShrink: 0,
  };
};

const listImageStyles = (theme: Theme, cardSize: CardSize) => {
  const config = CARD_SIZE_CONFIG[cardSize].list;
  return {
    maxHeight: theme.spacing(config.imageMaxHeight),
    maxWidth: theme.spacing(config.imageMaxWidth),
    margin: 'auto',
  };
};

// ===== EXPORTED STYLES =====
export const gridImageItemStyles = (theme: Theme, cardSize: CardSize): SxProps<Theme> => ({
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
    ...gridImageContainerStyles(theme, cardSize),
  },

  img: {
    ...commonImageStyles,
    ...gridImageStyles(theme, cardSize),
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

export const listImageItemStyles = (theme: Theme, cardSize: CardSize): SxProps<Theme> => ({
  ...commonCardStyles(theme),
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: theme.spacing(1),
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
    ...listImageContainerStyles(theme, cardSize),
  },

  img: {
    ...commonImageStyles,
    ...listImageStyles(theme, cardSize),
  },
});

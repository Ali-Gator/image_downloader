import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Constants for sizing
const SIZES = {
  GRID: {
    IMAGE_CONTAINER_MIN_HEIGHT: 16,
    IMAGE_MAX_HEIGHT: 22,
  },
  LIST: {
    IMAGE_CONTAINER_HEIGHT: 12,
    IMAGE_CONTAINER_WIDTH: 15,
    IMAGE_MAX_HEIGHT: 12.5,
    IMAGE_MAX_WIDTH: 18.75,
  },
};

// Image container
export const StyledImageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'mode',
})<{ mode: 'grid' | 'list' }>(({ theme, mode }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[100],

  ...(mode === 'grid'
    ? {
        position: 'relative',
        flex: '1 0 auto',
        minHeight: theme.spacing(SIZES.GRID.IMAGE_CONTAINER_MIN_HEIGHT),
        marginBottom: theme.spacing(0.5),

        '& img': {
          maxWidth: '100%',
          maxHeight: theme.spacing(SIZES.GRID.IMAGE_MAX_HEIGHT),
          margin: '0 auto',
        },
      }
    : {
        // List mode
        height: theme.spacing(SIZES.LIST.IMAGE_CONTAINER_HEIGHT),
        width: theme.spacing(SIZES.LIST.IMAGE_CONTAINER_WIDTH),
        flexShrink: 0,
        cursor: 'default',

        '& img': {
          maxHeight: theme.spacing(SIZES.LIST.IMAGE_MAX_HEIGHT),
          maxWidth: theme.spacing(SIZES.LIST.IMAGE_MAX_WIDTH),
          margin: 'auto',
        },
      }),

  '& img': {
    display: 'block',
    objectFit: 'contain',
    width: 'auto',
    height: 'auto',
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
}));

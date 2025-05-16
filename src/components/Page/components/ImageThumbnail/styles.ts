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
  position: 'relative',

  ...(mode === 'grid'
    ? {
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
    
    '&.loading': {
      opacity: 0.7,
    },
  },
}));

// Error container for failed images
export const StyledErrorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[200],
  color: theme.palette.error.main,
  textAlign: 'center',
  fontSize: '0.75rem',
  cursor: 'pointer',
  
  '& span:first-of-type': {
    fontSize: '1.5rem',
    marginBottom: theme.spacing(0.5),
  },
  
  '& button': {
    marginTop: theme.spacing(1),
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    border: 'none',
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    fontSize: '0.75rem',
    
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    }
  }
}));

// Loading overlay for images that are being fetched via background
export const StyledLoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  color: theme.palette.common.white,
  fontSize: '0.8rem',
  fontWeight: 500,
  zIndex: 2,
}));

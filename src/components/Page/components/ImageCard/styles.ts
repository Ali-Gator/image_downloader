import { styled } from '@mui/material/styles';

export const ImageItem = styled('div')(({ theme }) => ({
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

  '.image-checkbox': {
    position: 'absolute',
    top: theme.spacing(1),
    left: theme.spacing(1),
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '50%',
    transition: theme.transitions.create(['transform', 'opacity']),
    
    '&:hover': {
      transform: 'scale(1.1)',
    },
  },

  img: {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'contain',
    maxHeight: 200,
    backgroundColor: theme.palette.grey[100],
    pointerEvents: 'none',

    '.list-view &': {
      maxHeight: 100,
      width: 'auto',
      maxWidth: '150px',
      pointerEvents: 'none',
    },
  },

  '.list-view &': {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1),
    gap: theme.spacing(2),

    '.image-checkbox': {
      position: 'static',
      marginRight: theme.spacing(1),
    },
  },
}));

export const ImageInfo = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
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

  '.list-view &': {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
})); 
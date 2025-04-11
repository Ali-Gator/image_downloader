import { styled } from '@mui/material/styles';

export const ImageGridContainer = styled('div')(({ theme }) => ({
  display: 'grid',
  padding: theme.spacing(2),
  gap: theme.spacing(2),
  flexGrow: 1,
  overflow: 'auto',

  '&.grid-view': {
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',

    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    },
  },

  '&.list-view': {
    gridTemplateColumns: '1fr',
  },
}));

export const ImageItem = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  boxShadow: theme.shadows[1],
  transition: theme.transitions.create(['box-shadow', 'transform', 'border-color']),
  cursor: 'pointer',
  border: `1px solid ${theme.palette.divider}`,

  '&:hover': {
    boxShadow: theme.shadows[3],
    transform: 'translateY(-2px)',
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
  },

  img: {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'contain',
    maxHeight: 200,
    backgroundColor: theme.palette.grey[100],

    '.list-view &': {
      maxHeight: 100,
      width: 'auto',
      maxWidth: '150px',
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

export const NoImagesMessage = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
  height: '50vh',
}));

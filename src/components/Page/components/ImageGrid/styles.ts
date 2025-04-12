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

export const NoImagesMessage = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
  height: '50vh',
}));

import { styled } from '@mui/material/styles';

export const GridContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

export const NoImagesMessage = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
  height: '50vh',
}));

// Keep the old container for backward compatibility
export const ImageGridContainer = styled('div')(({ theme }) => ({
  display: 'grid',
  padding: theme.spacing(2),
  gap: theme.spacing(2),
  flexGrow: 1,
  overflow: 'auto',

  '&.grid-view': {
    // Mobile - small screens (up to 4 columns)
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',

    // Medium screens (up to 5-6 columns)
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    },

    // Large screens - limit columns to prevent stretching (up to 6-7 columns)
    [theme.breakpoints.up('lg')]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    },

    // Extra large screens (>1440px) - limit to ~7-8 columns
    [theme.breakpoints.up(1440)]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    },

    // Ultra wide screens - limit to ~9-10 columns maximum
    [theme.breakpoints.up(2000)]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    },
  },

  '&.list-view': {
    gridTemplateColumns: '1fr',
  },
}));

import React from 'react';

import { styled } from '@mui/material/styles';

import { sidePanelMedia } from '@theme';

export const GridContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  overflow: 'hidden',
  padding: theme.spacing(2),
  height: 0,
  minHeight: 0,
}));

export const NoImagesMessage = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
  height: '50vh',
  fontSize: '0.875rem',
}));

const GridListContainer = styled('div')(({ theme }) => ({
  display: 'grid',
  padding: theme.spacing(1, 3, 2.5, 3),
  gap: theme.spacing(1.75),
  alignContent: 'flex-start',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gridAutoRows: 'max-content',

  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  },
  [theme.breakpoints.up('lg')]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  },
  [theme.breakpoints.up(1440)]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  },
  [theme.breakpoints.up(2000)]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  },

  [sidePanelMedia]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    padding: theme.spacing(1, 1.5, 2, 1.5),
    gap: theme.spacing(1),
  },
}));

export const VirtuosoGridList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => <GridListContainer ref={ref} {...props} />);

VirtuosoGridList.displayName = 'VirtuosoGridList';

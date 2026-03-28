import { styled } from '@mui/material/styles';

import { alpha, colors } from '@theme';

export const PageContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamily,
}));

export const StickyRatingBar = styled('div')(({ theme }) => ({
  position: 'sticky',
  bottom: 0,
  zIndex: theme.zIndex.appBar,
  display: 'none',
  justifyContent: 'center',
  alignItems: 'center',
  padding: `${theme.spacing(0.75)} ${theme.spacing(2)}`,
  backgroundColor: alpha(colors.white, 0.95),
  backdropFilter: 'blur(8px)',
  borderTop: `1px solid ${theme.palette.divider}`,

  [theme.breakpoints.down('sm')]: {
    display: 'flex',
  },
}));

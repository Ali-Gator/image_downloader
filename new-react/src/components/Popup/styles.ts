import { Box, styled } from '@mui/material';

export const PopupContainer = styled(Box)(({ theme }) => ({
  width: '320px',
  backgroundColor: theme.palette.background.default
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2.5)}`,
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
})); 
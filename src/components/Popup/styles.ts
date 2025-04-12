import { Box, styled } from '@mui/material';

export const PopupContainer = styled(Box)(({ theme }) => ({
  width: 320,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamily,
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(2.5)} ${theme.spacing(2)}`,
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

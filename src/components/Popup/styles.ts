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

export const FeedbackRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasRatedApp',
})<{ hasRatedApp: boolean }>(({ theme, hasRatedApp }) => ({
  display: 'flex',
  justifyContent: hasRatedApp ? 'center' : 'space-between',
  width: '100%',
  marginTop: theme.spacing(1),
}));

import { Box, Typography, styled } from '@mui/material';

export const HelpTextContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export const HelpTextContent = styled(Typography)(() => ({
  margin: 0,
  fontSize: '0.75rem',
  lineHeight: 1.4,
  opacity: 0.8,
}));

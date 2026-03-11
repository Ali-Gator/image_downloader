import { Box, Typography, styled } from '@mui/material';

export const HeaderContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.primary.main,
  color: theme.palette.common.white,
  position: 'relative',
  boxShadow: '0 1px 3px rgba(45, 91, 227, 0.2)',
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.h6.fontSize,
  fontWeight: 600,
  margin: 0,
  textAlign: 'center',
  lineHeight: 1.2,
  letterSpacing: '-0.01em',
}));

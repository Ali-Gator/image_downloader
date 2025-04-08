import { Box, Typography, styled } from '@mui/material';
import { gradients, colors } from '../../../../theme';

export const HeaderContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: gradients.primary,
  color: theme.palette.common.white,
  position: 'relative',
  boxShadow: `0 1px 4px ${colors.shadowColor}`,
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.h6.fontSize,
  fontWeight: theme.typography.fontWeightMedium,
  margin: 0,
  textAlign: 'center',
  lineHeight: 1.2
})); 
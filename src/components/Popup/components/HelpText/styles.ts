import { Box, Typography, styled } from '@mui/material';
import { colors } from '../../../../theme';

export const HelpTextContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  fontSize: theme.typography.caption.fontSize,
  color: theme.palette.text.secondary,
  lineHeight: 1.4,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  borderLeft: `3px solid ${colors.primaryLight}`,
  textAlign: 'center',
}));

export const HelpTextContent = styled(Typography)(() => ({
  margin: 0,
  fontSize: 'inherit'
}));

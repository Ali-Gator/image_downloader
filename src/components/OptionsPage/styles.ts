import { Container, Box, Typography, TypographyProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  margin: '0 auto',
  maxWidth: '1200px', // Equivalent to lg
}));

export const StyledTitle = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: '2.125rem', // Equivalent to h4
  fontWeight: 400,
  lineHeight: 1.235,
  letterSpacing: '0.00735em',
  textAlign: 'center',
  marginBottom: theme.spacing(2),
  display: 'block', // For semantic h1 behavior
}));

export const ContentBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
})); 
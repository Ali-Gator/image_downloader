import { Box, Typography, TypographyProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export const OptionsPageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(3, 2, 4),
}));

export const ContentWrapper = styled(Box)({
  maxWidth: 560,
  margin: '0 auto',
});

export const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3),
}));

export const HeaderLeft = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),

  '& .MuiSvgIcon-root': {
    fontSize: '1.5rem',
    color: theme.palette.text.secondary,
  },
}));

export const HeaderTitle = styled(Typography)<TypographyProps>(() => ({
  fontSize: '1.25rem',
  fontWeight: 600,
  lineHeight: 1.3,
}));

export const SectionCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 10,
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
}));

export const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),

  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
    color: theme.palette.text.secondary,
  },
}));

export const SectionTitle = styled(Typography)(() => ({
  fontSize: '0.8125rem',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
}));

export const FooterNote = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(1),
}));

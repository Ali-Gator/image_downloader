import { Box, styled } from '@mui/material';

export const FieldContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.75),
  marginBottom: theme.spacing(2),

  '&:last-child': {
    marginBottom: 0,
  },

  '& .MuiTypography-root': {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
}));

export const OptionRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginBottom: theme.spacing(1),

  '&:last-child': {
    marginBottom: 0,
  },
}));

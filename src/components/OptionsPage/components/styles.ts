import { Box, styled } from '@mui/material';

export const FieldContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  gap: theme.spacing(2),

  '& .MuiTypography-root': {
    width: '180px',
    minWidth: '180px',
    flexShrink: 0,
  },

  '& .MuiTextField-root': {
    flex: 1,
  },
}));

export const OptionRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

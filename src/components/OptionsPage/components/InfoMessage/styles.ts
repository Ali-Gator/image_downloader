import { styled } from '@mui/material/styles';

export const AlertBox = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),

  '& .MuiAlert-root': {
    backgroundColor: theme.palette.grey[100],
    fontSize: '0.875rem',
  },
}));

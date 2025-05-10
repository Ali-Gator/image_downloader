import { styled } from '@mui/material/styles';

export const FieldContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  gap: theme.spacing(2),

  '& p': {
    width: '180px',
    flexShrink: 0,
  },

  '& .MuiTextField-root': {
    flex: 1,
  },
}));

import { styled } from '@mui/material/styles';

export const TitleRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),

  '& svg': {
    color: theme.palette.success.main,
    marginRight: theme.spacing(1),
    fontSize: '1.5rem',
  },

  '& h6': {
    fontWeight: 600,
    margin: 0,
  },
}));

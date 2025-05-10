import { styled } from '@mui/material/styles';

export const StyledSettingsButton = styled('button')(({ theme }) => ({
  minWidth: 0,
  width: 40,
  height: 40,
  padding: 0,
  marginLeft: theme.spacing(1),
  color: theme.palette.primary.contrastText,
  background: theme.palette.primary.dark,
  border: `2px solid ${theme.palette.primary.light}`,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s, border 0.2s',

  '&:hover, &:focus': {
    background: theme.palette.primary.light,
    color: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    outline: 'none',
  },

  '& svg': {
    fontSize: 24,
  },
}));

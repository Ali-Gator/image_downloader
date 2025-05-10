import { styled } from '@mui/material/styles';

interface StyledSettingsButtonProps {
  isHovered?: boolean;
}

export const StyledSettingsButton = styled('button')<StyledSettingsButtonProps>(
  ({ theme, isHovered }) => ({
    minWidth: 0,
    width: 40,
    height: 40,
    padding: 0,
    marginLeft: theme.spacing(1),
    color: isHovered ? theme.palette.primary.main : theme.palette.primary.contrastText,
    background: isHovered ? theme.palette.primary.light : theme.palette.primary.dark,
    border: `2px solid ${isHovered ? theme.palette.primary.main : theme.palette.primary.light}`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s, border 0.2s, color 0.2s, box-shadow 0.2s',

    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
    },

    '& svg': {
      fontSize: 24,
    },
  }),
);

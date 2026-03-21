import { styled } from '@mui/material/styles';

import { colors } from '@theme';

interface StyledSettingsButtonProps {
  isHovered?: boolean;
}

export const StyledSettingsButton = styled('button')<StyledSettingsButtonProps>(
  ({ theme, isHovered }) => ({
    minWidth: 0,
    width: 34,
    height: 34,
    padding: 0,
    marginLeft: theme.spacing(0.5),
    color: isHovered ? theme.palette.primary.main : theme.palette.text.secondary,
    background: isHovered ? theme.palette.primary.light : 'transparent',
    border: `1px solid ${isHovered ? theme.palette.primary.main : theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s, border 0.15s, color 0.15s',

    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${colors.shadowColor}`,
    },

    '& svg': {
      fontSize: 18,
    },
  }),
);

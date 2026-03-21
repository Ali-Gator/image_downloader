import { Checkbox } from '@mui/material';
import { styled } from '@mui/material/styles';

import { alpha, colors } from '@theme';

export const StyledCheckbox = styled(Checkbox)(() => ({
  backgroundColor: alpha(colors.textPrimary, 0.15),
  backdropFilter: 'blur(8px)',
  borderRadius: 5,
  padding: '4px',
  width: '24px',
  height: '24px',
  boxSizing: 'border-box',
  margin: '4px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  border: `2px solid ${alpha(colors.white, 0.7)}`,
  transition: 'all 0.15s',

  '&:hover': {
    backgroundColor: alpha(colors.textPrimary, 0.3),
    borderColor: colors.white,
  },

  '&.Mui-checked': {
    backgroundColor: colors.primaryMain,
    borderColor: colors.primaryMain,
  },

  '& .MuiSvgIcon-root': {
    zIndex: 1,
    position: 'relative',
    fontSize: '0.9rem',
    color: 'white',
  },

  '& .PrivateSwitchBase-input': {
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 0,
    cursor: 'pointer',
  },
}));

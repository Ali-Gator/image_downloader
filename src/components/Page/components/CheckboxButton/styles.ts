import { Checkbox } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledCheckbox = styled(Checkbox)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  borderRadius: '50%',
  padding: '8px',
  width: '36px',
  height: '36px',
  boxSizing: 'border-box',
  margin: '3px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',

  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transform: 'scale(1.1)',
  },

  '& .MuiSvgIcon-root': {
    zIndex: 1,
    position: 'relative',
    fontSize: '1.25rem',
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
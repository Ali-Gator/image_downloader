import { IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  borderRadius: '50%',
  padding: '8px',
  width: '36px',
  height: '36px',
  boxSizing: 'border-box',
  minWidth: 'auto',
  margin: '3px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',

  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transform: 'scale(1.1)',
    color: theme.palette.primary.main,
  },

  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
}));

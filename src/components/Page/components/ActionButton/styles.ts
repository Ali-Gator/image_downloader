import { IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  color: 'rgba(255, 255, 255, 0.95)',
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
  backdropFilter: 'blur(8px)',
  margin: '2px',
  width: '28px',
  height: '28px',
  borderRadius: 6,
  transition: 'background-color 0.15s, transform 0.15s',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    transform: 'scale(1.05)',
  },

  '& .MuiSvgIcon-root': {
    fontSize: '0.95rem',
  },
}));

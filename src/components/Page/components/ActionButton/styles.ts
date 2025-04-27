import { IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  color: theme.palette.grey[700],
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  margin: theme.spacing(0.5),
  width: '36px',
  height: '36px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transform: 'scale(1.1)',
    color: theme.palette.primary.main,
  },

  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
}));

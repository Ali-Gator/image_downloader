import { IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ActionIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  color: theme.palette.grey[700],
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    color: theme.palette.primary.main,
  },
  margin: theme.spacing(0.5),
})); 
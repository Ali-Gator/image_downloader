import { TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  backgroundColor: theme.palette.background.paper,
}));

export const StyledTypography = styled(Typography)(({ theme }) => ({
  width: '180px',
  minWidth: '180px',
  color: theme.palette.text.primary,
}));

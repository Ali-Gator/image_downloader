import { TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledTypography = styled(Typography)(() => ({
  width: '180px',
  flexShrink: 0,
}));

export const StyledTextField = styled(TextField)(() => ({
  flex: 1,
  '& .MuiInputBase-root': {
    fontSize: '0.875rem',
  },
}));

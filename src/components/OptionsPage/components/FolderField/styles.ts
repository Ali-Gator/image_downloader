import { TextField, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledTextField = styled(TextField)(() => ({
  flex: 1,
}));

export const StyledTypography = styled(Typography)(() => ({
  // The base styles are now in FieldContainer
}));

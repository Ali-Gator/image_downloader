import { FormControl, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const SelectsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

export const StyledFormControl = styled(FormControl)(() => ({
  minWidth: 120,
}));

export const ConnectorLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.8125rem',
  color: theme.palette.text.secondary,
}));

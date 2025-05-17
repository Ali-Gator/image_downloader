import { FormControl, Select, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ConvertRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  margin: theme.spacing(2, 0),
}));

export const StyledTypography = styled(Typography)(() => ({
  width: '180px',
  minWidth: '180px',
  flexShrink: 0,
}));

export const StyledFormControl = styled(FormControl)(() => ({
  minWidth: 120,
}));

export const StyledSelect = styled(Select)(() => ({}));

export const LabelContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
});

export const SelectsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flex: 1,
}));

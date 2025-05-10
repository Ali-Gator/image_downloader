import { FormControl, Select, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ConvertRow = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  gap: theme.spacing(2),

  '& p': {
    margin: 0,
  },

  '& p:first-of-type': {
    width: '180px',
    flexShrink: 0,
  },
}));

export const StyledTypography = styled(Typography)(() => ({
  width: '180px',
  flexShrink: 0,
}));

export const StyledFormControl = styled(FormControl)(() => ({
  minWidth: 120,
}));

export const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiSelect-select': {
    fontSize: '0.875rem',
    padding: theme.spacing(1, 1.5),
  },
}));

import { FormControlLabel } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginLeft: 0,
  '& .MuiTypography-root': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
}));

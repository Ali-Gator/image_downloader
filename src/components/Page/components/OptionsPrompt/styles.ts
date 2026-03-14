import { DialogActions } from '@mui/material';
import { styled } from '@mui/material/styles';

import { StyledDialog as BaseStyledDialog } from '../Onboarding/styles';

export { IconCircle, StepText, StepTitle, TopStripe } from '../Onboarding/styles';

export const StyledDialog = styled(BaseStyledDialog)({
  '& .MuiDialog-paper': {
    maxWidth: 360,
  },
});

export const Actions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(1, 3, 3),
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
}));

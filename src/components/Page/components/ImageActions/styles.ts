import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ActionsContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'orientation',
})<{ orientation?: 'horizontal' | 'vertical' }>(({ theme, orientation = 'horizontal' }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),

  ...(orientation === 'vertical' && {
    flexDirection: 'column',
    alignItems: 'flex-start',
  }),
}));

import { Button, styled } from '@mui/material';

import { alpha, colors } from '@theme';

export const StyledButton = styled(Button)(({ theme }) => ({
  minHeight: theme.spacing(5.5),
  borderRadius: 10,
  fontSize: '0.875rem',
  letterSpacing: '0.02em',
  boxShadow: `0 2px 8px ${alpha(colors.primaryMain, 0.3)}`,
  '&:hover': {
    boxShadow: `0 4px 16px ${alpha(colors.primaryMain, 0.4)}`,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
    transition: 'transform 0.2s ease',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'scale(1.1)',
  },
}));

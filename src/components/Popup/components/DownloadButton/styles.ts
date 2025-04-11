import { Button, styled } from '@mui/material';

import { gradients } from '../../../../theme';

export const StyledButton = styled(Button)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: gradients.accent,
  color: theme.palette.common.white,
  border: 'none',
  borderRadius: theme.shape.borderRadius,
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
  fontWeight: theme.typography.fontWeightMedium,
  fontSize: theme.typography.button.fontSize,
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: theme.transitions.create(['box-shadow', 'transform']),
  boxShadow: theme.shadows[2],
  marginBottom: theme.spacing(2),
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-1px)',
    background: gradients.accent,
  },
  '&:active': {
    transform: 'translateY(1px)',
    boxShadow: theme.shadows[1],
    background: gradients.accent,
  },
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    fontSize: theme.typography.fontSize * 1.2,
  },
}));

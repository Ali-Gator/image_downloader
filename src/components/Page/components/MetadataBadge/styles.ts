import { styled } from '@mui/material/styles';

export const StyledBadge = styled('span')<{ emphasis?: boolean }>(({ theme, emphasis }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.grey[100],
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: '2px',
  padding: '1px 3px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '18px',
  margin: theme.spacing(0, 0.15),
  
  ...(emphasis && {
    fontWeight: 500,
    letterSpacing: '0.02em',
    minWidth: '26px',
    textAlign: 'center',
  }),
})); 
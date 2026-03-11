import { styled } from '@mui/material/styles';

export const StyledBadge = styled('span')<{ emphasis?: boolean }>(({ theme, emphasis }) => ({
  fontSize: '0.6875rem',
  fontFamily: '"JetBrains Mono", monospace',
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 4,
  padding: '1px 5px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '18px',
  margin: theme.spacing(0, 0.15),
  fontWeight: 500,

  ...(emphasis && {
    fontWeight: 600,
    letterSpacing: '0.03em',
    minWidth: '26px',
    textAlign: 'center',
    textTransform: 'uppercase' as const,
    fontSize: '0.625rem',
  }),
}));

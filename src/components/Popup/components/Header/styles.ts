import { Box, Typography, keyframes, styled } from '@mui/material';

const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const HeaderContainer = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(1.5)}`,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #4A6CF7 50%, #6366F1 100%)`,
  backgroundSize: '200% 200%',
  animation: `${shimmer} 8s ease infinite`,
  color: theme.palette.common.white,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%), ' +
      'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
}));

export const HeaderLogo = styled('img')({
  width: 36,
  height: 36,
  borderRadius: 10,
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
});

export const HeaderTitle = styled(Typography)(() => ({
  fontSize: '0.8rem',
  fontWeight: 600,
  margin: 0,
  textAlign: 'center',
  lineHeight: 1.2,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  opacity: 0.92,
}));

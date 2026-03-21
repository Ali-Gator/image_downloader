import { IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export const Backdrop = styled('div')({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  animation: 'lightboxFadeIn 200ms ease',
  cursor: 'zoom-out',
  '@keyframes lightboxFadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
});

export const LightboxImage = styled('img')({
  maxHeight: '85vh',
  maxWidth: '90vw',
  objectFit: 'contain',
  borderRadius: 4,
  animation: 'lightboxScaleIn 200ms ease',
  cursor: 'default',
  '@keyframes lightboxScaleIn': {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
});

export const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  color: 'rgba(255,255,255,0.7)',
  '&:hover': { color: '#fff' },
}));

export const NavButton = styled(IconButton)<{ position: 'left' | 'right' }>(({ position }) => ({
  position: 'absolute',
  top: '10%',
  height: '80%',
  width: 72,
  borderRadius: 8,
  ...(position === 'left' ? { left: 0 } : { right: 0 }),
  backgroundColor: 'transparent',
  color: 'rgba(255,255,255,0.4)',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.9)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '2rem',
  },
}));

export const ActionBar = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1.5),
}));

export const ActionIconButton = styled(IconButton)({
  color: 'rgba(255,255,255,0.7)',
  backgroundColor: 'rgba(255,255,255,0.1)',
  '&:hover': {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

export const MetadataBar = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  textAlign: 'center',
  color: 'rgba(255,255,255,0.8)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

export const FileName = styled('span')({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.9)',
});

export const MetadataLine = styled('span')({
  fontSize: '0.75rem',
  fontFamily: '"JetBrains Mono", monospace',
  color: 'rgba(255,255,255,0.6)',
});

export const MetadataRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const Counter = styled('span')({
  fontSize: '0.75rem',
  color: 'rgba(255,255,255,0.5)',
  fontFamily: '"JetBrains Mono", monospace',
});

export const ResolutionToggle = styled('div')({
  display: 'flex',
  gap: 4,
  marginTop: 4,
});

export const TogglePill = styled('button')<{ active?: boolean }>(({ active }) => ({
  border: 'none',
  borderRadius: 12,
  padding: '4px 12px',
  fontSize: '0.75rem',
  fontFamily: '"JetBrains Mono", monospace',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
  outline: active ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
  '&:hover': {
    backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
  },
}));

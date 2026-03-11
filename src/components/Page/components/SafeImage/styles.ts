import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledImageContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const StyledPlaceholder = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: theme.spacing(1),
  minHeight: 120,
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  color: theme.palette.text.secondary,
}));

export const StyledErrorText = styled(Box)({
  fontSize: '0.8125rem',
  textAlign: 'center',
});

export const StyledLoadingOverlay = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
});

export const StyledImage = styled('img')<{ isLoading: boolean }>(({ isLoading, theme }) => ({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  borderRadius: theme.shape.borderRadius,
  opacity: isLoading ? 0.5 : 1,
}));

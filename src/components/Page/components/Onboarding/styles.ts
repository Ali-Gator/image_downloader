import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Paper,
  Typography,
} from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';

import { colors } from '@theme';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

// ─── Shared ──────────────────────────────────────────

export const IconCircle = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: `radial-gradient(circle, ${theme.palette.primary.light} 0%, transparent 70%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
  animation: `${float} 3s ease-in-out infinite`,
  '& .MuiSvgIcon-root': {
    fontSize: 40,
    color: theme.palette.primary.main,
  },
}));

export const StepTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: '1.25rem',
  letterSpacing: '-0.02em',
  marginBottom: 8,
});

export const StepText = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  lineHeight: 1.6,
}));

export const DotsContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 16,
});

interface DotProps {
  active: boolean;
  completed: boolean;
}

export const Dot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'completed',
})<DotProps>(({ theme, active, completed }) => ({
  width: active ? 8 : 6,
  height: active ? 8 : 6,
  borderRadius: '50%',
  backgroundColor: active || completed ? theme.palette.primary.main : theme.palette.divider,
  opacity: completed && !active ? 0.4 : 1,
  transition: 'all 300ms ease',
}));

export const SkipButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary,
  textTransform: 'none',
  fontWeight: 400,
}));

export const ContentWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  animation: `${fadeSlideIn} 300ms ease-out`,
});

// ─── Dialog mode (Welcome step) ─────────────────────

const BACKDROP_COLOR = colors.backdropColor;
const DIALOG_SHADOW = colors.dialogShadow;

export const StyledDialog = styled(Dialog)(() => ({
  '& .MuiBackdrop-root': {
    backgroundColor: BACKDROP_COLOR,
    backdropFilter: 'blur(8px)',
  },
  '& .MuiDialog-paper': {
    maxWidth: 440,
    width: '100%',
    borderRadius: 16,
    boxShadow: DIALOG_SHADOW,
    overflow: 'hidden',
    margin: 16,
  },
}));

export const TopStripe = styled(Box)(() => ({
  height: 3,
  background: `linear-gradient(90deg, ${colors.primaryMain}, ${colors.gradientAccent}, ${colors.primaryMain})`,
}));

export const DialogStepContent = styled(DialogContent)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(4, 4, 2),
}));

export const DialogStepActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(1, 3, 3),
  justifyContent: 'space-between',
}));

// ─── Spotlight mode (steps with target element) ─────

export const SpotlightOverlay = styled(Box)({
  position: 'fixed',
  inset: 0,
  zIndex: 1300,
  pointerEvents: 'none',
});

export const SpotlightTooltip = styled(Paper)(() => ({
  position: 'fixed',
  zIndex: 1301,
  maxWidth: 380,
  width: '100%',
  borderRadius: 16,
  boxShadow: DIALOG_SHADOW,
  overflow: 'hidden',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  '&::before': {
    content: '""',
    display: 'block',
    height: 3,
    background: `linear-gradient(90deg, ${colors.primaryMain}, ${colors.gradientAccent}, ${colors.primaryMain})`,
  },
}));

export const TooltipContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(3, 3, 1),
}));

export const TooltipActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 2, 2),
}));

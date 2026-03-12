import { Box, keyframes, styled } from '@mui/material';

const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const PopupContainer = styled(Box)(({ theme }) => ({
  width: 320,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamily,
  overflow: 'hidden',
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(2.5)} ${theme.spacing(2)}`,
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  '& > *:nth-of-type(1)': {
    animation: `${fadeSlideIn} 0.3s ease-out 0.1s both`,
  },
  '& > *:nth-of-type(2)': {
    animation: `${fadeSlideIn} 0.3s ease-out 0.2s both`,
  },
  '& > *:nth-of-type(3)': {
    animation: `${fadeSlideIn} 0.3s ease-out 0.3s both`,
  },
}));

export const FeedbackRow = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasRatedApp',
})<{ hasRatedApp: boolean }>(({ theme, hasRatedApp }) => ({
  display: 'flex',
  justifyContent: hasRatedApp ? 'center' : 'space-between',
  alignItems: 'center',
  width: '100%',
  paddingTop: theme.spacing(1.5),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

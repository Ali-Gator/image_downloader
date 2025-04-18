import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const MetadataContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isListMode',
})<{ isListMode?: boolean }>(({ theme, isListMode }) => ({
  padding: theme.spacing(0.5, 1),
  cursor: 'pointer',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),

  ...(isListMode && {
    padding: theme.spacing(0, 1),
    justifyContent: 'center',
    cursor: 'default',
    width: '100%',
    overflow: 'hidden',
    flexGrow: 1,
    gap: theme.spacing(0.5),
  }),
}));

export const FileName = styled(Typography)(() => ({
  fontWeight: 500,
  fontSize: '0.875rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
  maxWidth: '100%',
  marginBottom: '2px',
}));

export const DimensionsContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isListMode',
})<{ isListMode?: boolean }>(({ theme, isListMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.35),
  flexWrap: 'wrap',
  width: '100%',
  justifyContent: 'flex-start',
  marginTop: 0,

  ...(isListMode && {
    flexWrap: 'nowrap',
    gap: theme.spacing(0.5),
  }),
}));

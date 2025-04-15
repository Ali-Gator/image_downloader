import { Box, IconButton, Link, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ImageInfoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  cursor: 'pointer',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),

  '&.list-mode': {
    padding: theme.spacing(0, 1),
    justifyContent: 'center',
    flexDirection: 'column',
    cursor: 'default',
    width: '100%',
    overflow: 'hidden',
    flexGrow: 1,
    display: 'flex',
    gap: theme.spacing(0.5),
  },
}));

export const FileName = styled(Typography)(() => ({
  fontWeight: 500,
  fontSize: '0.875rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
  maxWidth: '100%',
}));

export const DimensionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

export const Dimensions = styled('span')(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.grey[100],
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: '2px',
  padding: '1px 3px',
}));

export const FileSize = styled('span')(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.grey[100],
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: '2px',
  padding: '1px 3px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const FileExtension = styled('span')(({ theme }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.grey[100],
  border: `1px solid ${theme.palette.grey[300]}`,
  borderRadius: '2px',
  padding: '1px 3px',
  fontWeight: 500,
  letterSpacing: '0.02em',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '28px',
  textAlign: 'center',
}));

export const ActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

export const ActionButton = styled(IconButton)(({ theme }) => ({
  cursor: 'pointer',
  padding: theme.spacing(0.5),
  minWidth: 'auto',
  flexShrink: 0,

  '&:hover': {
    color: theme.palette.primary.main,
  },
}));

export const UrlContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  overflow: 'hidden',
}));

export const ImageUrl = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  transition: 'color 0.2s',
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: `${theme.spacing(0.5)} 0`,
  maxWidth: '100%',
  gap: theme.spacing(0.5),

  '&:hover': {
    color: theme.palette.primary.main,

    '& .url-icon': {
      color: theme.palette.primary.main,
    },
  },

  '& .url-icon': {
    flexShrink: 0,
    verticalAlign: 'middle',
    color: 'inherit',
    fontSize: '0.875rem',
    transition: 'color 0.2s',
  },
}));

export const UrlText = styled('span')({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const NonClickableUrl = styled('span')(({ theme }) => ({
  cursor: 'default',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
}));

export const CopyButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  opacity: 0,
  transition: 'opacity 0.2s',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  padding: theme.spacing(0.5),

  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },

  '.MuiBox-root:hover &': {
    opacity: 1,
  },
}));

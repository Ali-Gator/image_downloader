import { Box, Link, Theme, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ImageInfoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.5, 1),
  cursor: 'pointer',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.25),

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
  marginBottom: '2px',
}));

export const DimensionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.35),
  flexWrap: 'wrap',
  width: '100%',
  justifyContent: 'flex-start',
  marginTop: 0,

  '.list-mode &': {
    flexWrap: 'nowrap',
    gap: theme.spacing(0.5),
  },
}));

const commonBadgeStyles = (theme: Theme) => ({
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
});

export const Dimensions = styled('span')(({ theme }) => ({
  ...commonBadgeStyles(theme),
}));

export const FileSize = styled('span')(({ theme }) => ({
  ...commonBadgeStyles(theme),
  margin: theme.spacing(0, 0.15),

  '.list-mode &': {
    margin: theme.spacing(0, 0.25),
  },
}));

export const FileExtension = styled('span')(({ theme }) => ({
  ...commonBadgeStyles(theme),
  fontWeight: 500,
  letterSpacing: '0.02em',
  minWidth: '26px',
  textAlign: 'center',
}));

export const QualityBadge = styled('span')<{ quality: 'high' | 'medium' | 'low' }>(
  ({ theme, quality }) => ({
    ...commonBadgeStyles(theme),
    fontWeight: 500,
    minWidth: '36px',
    textAlign: 'center',
    backgroundColor:
      quality === 'high'
        ? theme.palette.success.light
        : quality === 'medium'
          ? theme.palette.warning.light
          : theme.palette.error.light,
    color:
      quality === 'high'
        ? theme.palette.success.contrastText
        : quality === 'medium'
          ? theme.palette.warning.contrastText
          : theme.palette.error.contrastText,
    border: `1px solid ${
      quality === 'high'
        ? theme.palette.success.main
        : quality === 'medium'
          ? theme.palette.warning.main
          : theme.palette.error.main
    }`,
  }),
);

export const ActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
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

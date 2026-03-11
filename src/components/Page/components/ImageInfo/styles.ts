import { Box, Link, Theme, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { colors } from '@theme';
import { QualityLevel } from '@utils';

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
  fontSize: '0.8125rem',
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
  flexWrap: 'nowrap',
  overflow: 'hidden',
  width: '100%',
  justifyContent: 'flex-start',
  marginTop: 0,

  '.list-mode &': {
    gap: theme.spacing(0.5),
  },
}));

const commonBadgeStyles = (theme: Theme) => ({
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
  fontWeight: 500,
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
  fontWeight: 600,
  letterSpacing: '0.03em',
  minWidth: '26px',
  textAlign: 'center',
  textTransform: 'uppercase',
  fontSize: '0.625rem',
}));

export const QualityBadge = styled('span')<{ quality: QualityLevel }>(({ theme, quality }) => ({
  ...commonBadgeStyles(theme),
  fontWeight: 600,
  minWidth: '36px',
  textAlign: 'center',
  fontSize: '0.625rem',
  textTransform: 'uppercase',
  backgroundColor:
    quality === QualityLevel.HD
      ? 'rgba(43, 165, 99, 0.12)'
      : quality === QualityLevel.MEDIUM
        ? 'rgba(229, 160, 0, 0.14)'
        : 'rgba(220, 76, 76, 0.12)',
  color:
    quality === QualityLevel.HD
      ? colors.successDark
      : quality === QualityLevel.MEDIUM
        ? colors.warningDark
        : colors.errorDark,
  border: `1px solid ${
    quality === QualityLevel.HD
      ? 'rgba(43, 165, 99, 0.35)'
      : quality === QualityLevel.MEDIUM
        ? 'rgba(229, 160, 0, 0.35)'
        : 'rgba(220, 76, 76, 0.35)'
  }`,
}));

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
  transition: 'color 0.15s',
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
    transition: 'color 0.15s',
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

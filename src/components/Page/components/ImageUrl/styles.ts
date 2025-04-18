import { Box, Link } from '@mui/material';
import { styled } from '@mui/material/styles';

export const UrlContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  overflow: 'hidden',
}));

export const UrlLink = styled(Link)(({ theme }) => ({
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
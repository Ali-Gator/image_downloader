import { Avatar, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

import { alpha, colors } from '@theme';

export const HeaderContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `0 ${theme.spacing(3)}`,
  height: 56,
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.appBar,
  backdropFilter: 'blur(12px)',
  backgroundColor: alpha(colors.white, 0.92),

  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
    height: 'auto',
    minHeight: 48,
    gap: theme.spacing(0.5),
  },
}));

export const LogoImage = styled('img')({
  width: '28px',
  height: '28px',
  objectFit: 'contain',
});

export const TitleContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexShrink: 0,

  '& .MuiTypography-root': {
    fontSize: '0.9375rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },

  [theme.breakpoints.down('sm')]: {
    gap: 0,

    '& .MuiTypography-root': {
      display: 'none',
    },
  },
}));

export const ControlsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),

  [theme.breakpoints.down('sm')]: {
    flexWrap: 'wrap',
  },
}));

export const SelectAllContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  borderRadius: theme.shape.borderRadius,
  padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
  transition: 'background-color 0.15s',
  cursor: 'pointer',
  fontSize: '0.8125rem',

  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },

  '& label': {
    marginLeft: theme.spacing(0.5),
    cursor: 'pointer',
    fontSize: '0.8125rem',
    whiteSpace: 'nowrap',
  },

  '& .MuiCheckbox-root': {
    padding: 0,
  },

  '& .full-label': {
    display: 'inline',
  },

  '& .compact-label': {
    display: 'none',
  },

  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(0.5)} ${theme.spacing(0.75)}`,

    '& .full-label': {
      display: 'none',
    },

    '& .compact-label': {
      display: 'inline',
    },
  },
}));

export const MonetizationStatusContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.text.secondary,
}));

export const MonetizationBadge = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  borderRadius: 20,
  padding: `${theme.spacing(1)} ${theme.spacing(1.25)}`,
  whiteSpace: 'nowrap',
  fontSize: '0.75rem',
  fontWeight: 500,
}));

export const MonetizationBanner = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  whiteSpace: 'nowrap',
  fontSize: '0.8125rem',
}));

export const UserMenuIconButton = styled(IconButton)(({ theme }) => ({
  padding: 0,
  marginLeft: theme.spacing(0.5),
}));

export const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 34,
  height: 34,
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  fontSize: '0.875rem',
  fontWeight: 600,
}));

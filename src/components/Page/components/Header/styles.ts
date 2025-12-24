import { Avatar, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

import { gradients } from '@theme';

export const HeaderContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  background: gradients.primary,
  color: theme.palette.primary.contrastText,
  boxShadow: theme.shadows[4],
  zIndex: theme.zIndex.appBar,
}));

export const LogoImage = styled('img')({
  width: '40px',
  height: '40px',
  objectFit: 'contain',
});

export const TitleContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),

  '& svg': {
    fontSize: 24,
  },
}));

export const ControlsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export const SelectAllContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.common.white,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: theme.spacing(0.5),
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,

  '& label': {
    marginLeft: theme.spacing(0.5),
    cursor: 'pointer',
  },

  '& .MuiCheckbox-root': {
    padding: 0,
  },
}));

export const MonetizationStatusContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.common.white,
}));

export const MonetizationBadge = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.12)',
  borderRadius: theme.spacing(0.5),
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  whiteSpace: 'nowrap',
}));

export const MonetizationBanner = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  borderRadius: theme.spacing(0.75),
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  whiteSpace: 'nowrap',
}));

export const UserMenuIconButton = styled(IconButton)(({ theme }) => ({
  padding: 0,
  marginLeft: theme.spacing(0.5),
}));

export const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: 'rgba(255, 255, 255, 0.12)',
  color: theme.palette.common.white,
}));

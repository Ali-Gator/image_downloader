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

  '& label': {
    marginLeft: theme.spacing(0.5),
    cursor: 'pointer',
  },
}));

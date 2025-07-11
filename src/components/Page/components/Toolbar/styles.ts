import { styled } from '@mui/material/styles';

import { ViewButtonProps } from '@types';

export const ToolbarContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
  flexWrap: 'wrap',
  gap: theme.spacing(1),

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

export const LeftSection = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
}));

export const MiddleSection = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 1 auto',

  [theme.breakpoints.down('md')]: {
    marginTop: theme.spacing(1),
    justifyContent: 'center',
  },
}));

export const RightSection = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),

  [theme.breakpoints.down('sm')]: {
    width: '100%',
    justifyContent: 'space-between',
    marginTop: theme.spacing(1),
  },
}));

export const ControlsRow = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',

  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
  },
}));

export const ControlItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),

  '& .MuiSvgIcon-root': {
    color: theme.palette.text.secondary,
  },

  [theme.breakpoints.down('sm')]: {
    width: '100%',
    '& .MuiFormControl-root, & .MuiTextField-root': {
      width: '100%',
    },
  },
}));

export const InfoContainer = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
}));

export const CounterBadge = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,

  '& .MuiSvgIcon-root': {
    fontSize: 18,
  },
}));

export const CounterText = styled('span')(() => ({
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
}));

export const SortContainer = styled(ControlItem)({});

export const ViewOptionsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

export const ViewButton = styled('button')<ViewButtonProps>(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.5),
  backgroundColor: active ? theme.palette.primary.main : 'transparent',
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  border: `1px solid ${active ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color', 'color', 'border-color']),

  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.action.hover,
  },

  '& .MuiSvgIcon-root': {
    fontSize: 20,
  },
}));

// New components for size filter popover UI
export const SizePopoverContent = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  width: theme.spacing(30),
  maxWidth: '100%',
}));

export const CustomDimensionsContainer = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

export const DimensionInput = styled('div')(() => ({
  width: '100%',

  '& .MuiFormControl-root': {
    width: '100%',
  },
}));

export const DividerContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: `${theme.spacing(2)} 0`,

  '& .MuiDivider-root': {
    flexGrow: 1,
  },

  '& .MuiTypography-root': {
    margin: `0 ${theme.spacing(1)}`,
    fontWeight: 500,
  },
}));

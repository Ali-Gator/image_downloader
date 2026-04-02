import { styled } from '@mui/material/styles';

import { ViewButtonProps } from '@types';

export const ToolbarContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${theme.spacing(1.25)} ${theme.spacing(3)}`,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  flexWrap: 'wrap',
  gap: theme.spacing(1),

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
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

  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

export const RightSection = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),

  [theme.breakpoints.down('sm')]: {
    flexWrap: 'wrap',
    width: '100%',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
}));

export const ControlsRow = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  alignItems: 'center',

  [theme.breakpoints.down('sm')]: {
    flexWrap: 'wrap',
    width: '100%',
    gap: theme.spacing(1),
  },
}));

export const ControlItem = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),

  '& .MuiSvgIcon-root': {
    color: theme.palette.text.secondary,
    fontSize: '1.1rem',
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
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.secondary,
  borderRadius: 20,
  border: `1px solid ${theme.palette.divider}`,
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: '0.75rem',
  fontWeight: 500,

  '& .MuiSvgIcon-root': {
    fontSize: 14,
  },
}));

export const CounterText = styled('span')(() => ({
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
}));

export const SortContainer = styled(ControlItem)({});

export const ViewOptionsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

export const ViewButton = styled('button')<ViewButtonProps>(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.5),
  width: 32,
  height: 30,
  backgroundColor: active ? theme.palette.primary.light : 'transparent',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  border: 'none',
  cursor: 'pointer',
  transition: theme.transitions.create(['background-color', 'color']),

  '&:first-of-type': {
    borderRight: `1px solid ${theme.palette.divider}`,
  },

  '&:hover': {
    backgroundColor: active ? theme.palette.primary.light : theme.palette.action.hover,
  },

  '& .MuiSvgIcon-root': {
    fontSize: 18,
  },
}));

export const SizeButton = styled('button')<ViewButtonProps>(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0.5),
  width: 26,
  height: 30,
  backgroundColor: active ? theme.palette.primary.light : 'transparent',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.7rem',
  fontWeight: 600,
  transition: theme.transitions.create(['background-color', 'color']),

  '&:not(:last-of-type)': {
    borderRight: `1px solid ${theme.palette.divider}`,
  },

  '&:hover': {
    backgroundColor: active ? theme.palette.primary.light : theme.palette.action.hover,
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
  backgroundColor: theme.palette.background.default,
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

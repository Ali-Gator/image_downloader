import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

export const TitleRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),

  '& svg': {
    color: theme.palette.success.main,
    marginRight: theme.spacing(1),
    fontSize: '1.5rem',
  },

  '& h6': {
    fontWeight: 600,
    margin: 0,
  },
}));

export const FieldContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  gap: theme.spacing(2),

  '& p': {
    width: '180px',
    flexShrink: 0,
  },

  '& .MuiTextField-root': {
    flex: 1,
  },
}));

export const ConvertRow = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  gap: theme.spacing(1),

  '& p': {
    margin: 0,
  },

  '& p:first-of-type': {
    width: '180px',
    flexShrink: 0,
  },
}));

export const ButtonContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: theme.spacing(2),
}));

export const AlertBox = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),

  '& .MuiAlert-root': {
    backgroundColor: theme.palette.grey[100],
    fontSize: '0.875rem',
  },
}));

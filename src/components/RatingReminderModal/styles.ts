import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    margin: theme.spacing(2),
  },
}));

export const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: theme.spacing(1),
  textAlign: 'center',
  paddingRight: theme.spacing(6), // Место для кнопки закрытия
}));

export const TitleContainer = styled(Box)({
  flex: 1,
});

export const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
}));

export const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  paddingTop: theme.spacing(1),
}));

export const ContentStack = styled(Stack)({
  alignItems: 'center',
});

export const MessageText = styled(Typography)({
  textAlign: 'center',
});

export const RatingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
});

export const RatingStack = styled(Stack)(({ theme }) => ({
  alignItems: 'center',
  gap: theme.spacing(1),
}));

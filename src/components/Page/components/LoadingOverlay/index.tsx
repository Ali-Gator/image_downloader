import { FC } from 'react';
import { CircularProgress, Typography } from '@mui/material';
import { LoadingOverlayContainer } from './styles';

export const LoadingOverlay: FC = () => {
  return (
    <LoadingOverlayContainer>
      <CircularProgress size={50} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Loading images...
      </Typography>
    </LoadingOverlayContainer>
  );
};

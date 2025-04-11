import { FC } from 'react';

import { CircularProgress, Typography } from '@mui/material';
import { useTranslation } from '../../../../utils/useTranslation';

import { LoadingOverlayContainer } from './styles';

export const LoadingOverlay: FC = () => {
  const { t } = useTranslation();
  
  return (
    <LoadingOverlayContainer>
      <CircularProgress size={50} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {t('loading_text')}
      </Typography>
    </LoadingOverlayContainer>
  );
};

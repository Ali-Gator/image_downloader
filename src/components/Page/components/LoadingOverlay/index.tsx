import { FC } from 'react';

import { CircularProgress, Typography } from '@mui/material';

import { LoadingOverlayContainer } from './styles';
import { useTranslation } from '../../../../utils/useTranslation';

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

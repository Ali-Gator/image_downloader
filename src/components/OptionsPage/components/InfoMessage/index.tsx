import { FC } from 'react';

import { Alert } from '@mui/material';

import { useTranslation } from '@utils';

import { AlertBox } from './styles';

export const InfoMessage: FC = () => {
  const { t } = useTranslation();

  return (
    <AlertBox>
      <Alert severity="info">{t('browser_save_setting_message')}</Alert>
    </AlertBox>
  );
};

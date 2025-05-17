import { FC } from 'react';

import { Alert, Stack } from '@mui/material';

import { useTranslation } from '@utils';

import { AlertBox } from './styles';

export const InfoMessage: FC = () => {
  const { t } = useTranslation();

  return (
    <AlertBox>
      <Stack spacing={1}>
        <Alert severity="info">{t('browser_save_setting_message')}</Alert>
        <Alert severity="success">{t('options_auto_apply_message')}</Alert>
      </Stack>
    </AlertBox>
  );
};

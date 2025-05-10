import { FC } from 'react';

import DownloadIcon from '@mui/icons-material/Download';
import { Typography } from '@mui/material';

import { useTranslation } from '@utils';

import { TitleRow } from './styles';

export const OptionsHeader: FC = () => {
  const { t } = useTranslation();

  return (
    <TitleRow>
      <DownloadIcon />
      <Typography variant="h6">{t('download_options')}</Typography>
    </TitleRow>
  );
};

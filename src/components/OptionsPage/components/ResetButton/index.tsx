import { FC } from 'react';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Button } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import { ButtonContainer } from './styles';

export const ResetButton: FC = () => {
  const { t } = useTranslation();
  const { resetDownloadOptions } = useSettingsStore();

  return (
    <ButtonContainer>
      <Button
        variant="outlined"
        color="primary"
        onClick={resetDownloadOptions}
        startIcon={<RestartAltIcon />}
      >
        {t('reset_btn')}
      </Button>
    </ButtonContainer>
  );
};

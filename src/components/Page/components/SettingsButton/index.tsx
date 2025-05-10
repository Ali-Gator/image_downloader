import { FC } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import { Tooltip } from '@mui/material';
import { useTranslation } from '@utils';
import { StyledSettingsButton } from './styles';

export const SettingsButton: FC = () => {
  const { t } = useTranslation();

  const handleOpenOptions = () => {
    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  };

  return (
    <Tooltip title={t('settings_btn_tooltip')} placement="bottom">
      <StyledSettingsButton onClick={handleOpenOptions} aria-label={t('settings_btn_tooltip')}>
        <SettingsIcon fontSize="medium" />
      </StyledSettingsButton>
    </Tooltip>
  );
}; 
import { FC, useState, useEffect } from 'react';

import SettingsIcon from '@mui/icons-material/Settings';
import { Tooltip } from '@mui/material';

import { useTranslation } from '@utils';

import { StyledSettingsButton } from './styles';

export const SettingsButton: FC = () => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  // Сбрасываем hover при потере фокуса окном или смене видимости
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsHovered(false);
      }
    };

    const handleBlur = () => {
      setIsHovered(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleOpenOptions = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Сбросить hover-состояние программно
    setIsHovered(false);
    event.currentTarget.blur();

    // Открыть страницу опций
    if (chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  };

  return (
    <Tooltip title={t('settings_btn_tooltip')} placement="bottom">
      <StyledSettingsButton
        onClick={handleOpenOptions}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        isHovered={isHovered}
        aria-label={t('settings_btn_tooltip')}
      >
        <SettingsIcon fontSize="medium" />
      </StyledSettingsButton>
    </Tooltip>
  );
};

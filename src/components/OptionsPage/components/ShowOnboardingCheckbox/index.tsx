import { useCallback } from 'react';

import { Checkbox, FormControlLabel, SxProps, Theme } from '@mui/material';

import { useSettingsStore } from '@store';
import { StorageKeys, useTranslation } from '@utils';

const labelSx: SxProps<Theme> = {
  ml: 0,
  '& .MuiTypography-root': {
    fontSize: '0.8125rem',
    color: 'text.secondary',
  },
};

export function ShowOnboardingCheckbox() {
  const { t } = useTranslation();
  const { showOnboardingNextTime, setShowOnboardingNextTime } = useSettingsStore();

  const handleChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setShowOnboardingNextTime(checked);

      if (checked) {
        chrome.storage.local
          .remove([
            StorageKeys.ONBOARDING_COMPLETED,
            StorageKeys.OPTIONS_ONBOARDING_COMPLETED,
            StorageKeys.OPTIONS_PROMPT_DISMISSED,
          ])
          .catch(() => {});
      }
    },
    [setShowOnboardingNextTime],
  );

  return (
    <FormControlLabel
      control={<Checkbox checked={showOnboardingNextTime} onChange={handleChange} size="small" />}
      label={t('show_onboarding_checkbox_label')}
      sx={labelSx}
    />
  );
}

export default ShowOnboardingCheckbox;

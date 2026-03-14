import { useCallback } from 'react';

import { Checkbox } from '@mui/material';

import { useSettingsStore } from '@store';
import { StorageKeys, useTranslation } from '@utils';

import { StyledFormControlLabel } from './styles';

export function ShowOnboardingCheckbox() {
  const { t } = useTranslation();
  const { showOnboardingNextTime, setShowOnboardingNextTime } = useSettingsStore();

  const handleChange = useCallback(
    (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setShowOnboardingNextTime(checked);

      if (checked) {
        // Clear all completion/dismissal flags so onboarding can re-trigger
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
    <StyledFormControlLabel
      control={<Checkbox checked={showOnboardingNextTime} onChange={handleChange} size="small" />}
      label={t('show_onboarding_checkbox_label')}
    />
  );
}

export default ShowOnboardingCheckbox;

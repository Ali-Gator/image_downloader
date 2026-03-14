import { useCallback, useEffect, useState } from 'react';

import { SettingsOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

import { storageGet, StorageKeys, useTranslation } from '@utils';
import { getMonetizationLimitState } from '@utils/monetization';

import { DialogStepContent } from '../Onboarding/styles';

import { Actions, IconCircle, StepText, StepTitle, StyledDialog, TopStripe } from './styles';

function storageGetAsync(key: string): Promise<boolean> {
  return new Promise((resolve) => {
    storageGet(key, (value) => resolve(Boolean(value)));
  });
}

function openOptionsOnboarding() {
  const url = chrome.runtime.getURL('options.html?onboarding=true');
  chrome.tabs.create({ url });
}

export function OptionsPrompt() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkConditions = async () => {
      const [pageOnboardingCompleted, optionsCompleted, promptDismissed] = await Promise.all([
        storageGetAsync(StorageKeys.ONBOARDING_COMPLETED),
        storageGetAsync(StorageKeys.OPTIONS_ONBOARDING_COMPLETED),
        storageGetAsync(StorageKeys.OPTIONS_PROMPT_DISMISSED),
      ]);
      // Only show after page onboarding is done, and before options onboarding
      if (!pageOnboardingCompleted || optionsCompleted || promptDismissed) return;

      const [limitState, syncResult] = await Promise.all([
        getMonetizationLimitState(),
        chrome.storage.sync.get(['installDate']).catch(() => ({}) as Record<string, unknown>),
      ]);

      const enoughDownloads = limitState.usedCount >= 5;

      let enoughDays = false;
      if (syncResult.installDate) {
        const daysSinceInstall =
          (Date.now() - new Date(syncResult.installDate).getTime()) / (1000 * 60 * 60 * 24);
        enoughDays = daysSinceInstall >= 7;
      }

      if (mounted && (enoughDownloads || enoughDays)) {
        setIsOpen(true);
      }
    };

    checkConditions();
    return () => {
      mounted = false;
    };
  }, []);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    chrome.storage.local.set({ [StorageKeys.OPTIONS_PROMPT_DISMISSED]: true }).catch(() => {});
  }, []);

  const handleShowMe = useCallback(() => {
    dismiss();
    openOptionsOnboarding();
  }, [dismiss]);

  if (!isOpen) return null;

  return (
    <StyledDialog open={isOpen} onClose={dismiss}>
      <TopStripe />
      <DialogStepContent>
        <IconCircle>
          <SettingsOutlined />
        </IconCircle>
        <StepTitle>{t('options_prompt_title')}</StepTitle>
        <StepText>{t('options_prompt_text')}</StepText>
      </DialogStepContent>
      <Actions>
        <Button variant="outlined" onClick={dismiss}>
          {t('onboarding_no_thanks')}
        </Button>
        <Button variant="contained" onClick={handleShowMe}>
          {t('onboarding_show_me')}
        </Button>
      </Actions>
    </StyledDialog>
  );
}

export default OptionsPrompt;

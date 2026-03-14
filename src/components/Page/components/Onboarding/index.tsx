import { useCallback } from 'react';

import { Box, Button } from '@mui/material';

import { OnboardingShell, useOnboardingState } from '@shared/onboarding';
import { storageGet, StorageKeys, useTranslation } from '@utils';

import { steps } from './steps';
import { SkipButton } from './styles';

const shouldOpen = (done: (open: boolean) => void) => {
  storageGet(StorageKeys.ONBOARDING_COMPLETED, (value) => {
    done(!value);
  });
};

export function Onboarding() {
  const { t } = useTranslation();
  const state = useOnboardingState({
    steps,
    storageKey: StorageKeys.ONBOARDING_COMPLETED,
    shouldOpen,
  });

  const handleOptionsYes = useCallback(() => {
    state.markCompleted();
    state.handleClose();
    const optionsUrl = chrome.runtime.getURL('options.html?onboarding=true');
    chrome.tabs.create({ url: optionsUrl });
  }, [state]);

  if (!state.isOpen) return null;

  const navigationButtons = state.isLastStep ? (
    <>
      <Button variant="outlined" onClick={state.handleClose}>
        {t('onboarding_no_thanks')}
      </Button>
      <Button variant="contained" onClick={handleOptionsYes}>
        {t('onboarding_show_me')}
      </Button>
    </>
  ) : (
    <>
      <SkipButton onClick={state.handleClose}>{t('onboarding_skip')}</SkipButton>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {state.activeStep > 0 && (
          <Button variant="outlined" onClick={state.handleBack}>
            {t('onboarding_back')}
          </Button>
        )}
        <Button variant="contained" onClick={state.handleNext}>
          {t('onboarding_next')}
        </Button>
      </Box>
    </>
  );

  return (
    <OnboardingShell
      steps={steps}
      activeStep={state.activeStep}
      isSpotlight={state.isSpotlight}
      targetRect={state.targetRect}
      spotlightRect={state.spotlightRect}
      tooltipEl={state.tooltipEl}
      setTooltipEl={state.setTooltipEl}
      maskId="onboarding-spotlight-mask"
      navigationButtons={navigationButtons}
      onClose={state.handleClose}
    />
  );
}

export default Onboarding;

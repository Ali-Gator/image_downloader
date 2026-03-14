import { Box, Button } from '@mui/material';

import { OnboardingShell, useOnboardingState } from '@shared/onboarding';
import { storageGet, StorageKeys, useTranslation } from '@utils';

import { SkipButton } from '../../../Page/components/Onboarding/styles';

import { steps } from './steps';

const shouldOpen = (done: (open: boolean) => void) => {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('onboarding') === 'true';

  storageGet(StorageKeys.OPTIONS_ONBOARDING_COMPLETED, (value) => {
    done(!value && fromUrl);
  });
};

export function OptionsOnboarding() {
  const { t } = useTranslation();
  const state = useOnboardingState({
    steps,
    storageKey: StorageKeys.OPTIONS_ONBOARDING_COMPLETED,
    shouldOpen,
  });

  if (!state.isOpen) return null;

  const navigationButtons = state.isLastStep ? (
    <Button variant="contained" onClick={state.handleClose} sx={{ ml: 'auto' }}>
      {t('onboarding_finish')}
    </Button>
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
      maskId="options-onboarding-spotlight-mask"
      navigationButtons={navigationButtons}
      onClose={state.handleClose}
    />
  );
}

export default OptionsOnboarding;

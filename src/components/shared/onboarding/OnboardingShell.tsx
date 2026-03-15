import { ReactNode } from 'react';

import { useTranslation } from '@utils';

import { getTooltipPosition, OVERLAY_COLOR } from './spotlightUtils';
import { OnboardingStep, TargetRect } from './types';
import {
  ContentWrapper,
  DialogStepActions,
  DialogStepContent,
  Dot,
  DotsContainer,
  IconCircle,
  SpotlightOverlay,
  SpotlightTooltip,
  StepText,
  StepTitle,
  StyledDialog,
  TooltipActions,
  TooltipContent,
  TopStripe,
} from '../../Page/components/Onboarding/styles';

interface OnboardingShellProps {
  steps: OnboardingStep[];
  activeStep: number;
  isSpotlight: boolean;
  targetRect: TargetRect | null;
  spotlightRect: { x: number; y: number; width: number; height: number } | null;
  tooltipEl: HTMLDivElement | null;
  setTooltipEl: (el: HTMLDivElement | null) => void;
  maskId: string;
  navigationButtons: ReactNode;
  onClose: () => void;
}

export function OnboardingShell({
  steps,
  activeStep,
  isSpotlight,
  targetRect,
  spotlightRect,
  tooltipEl,
  setTooltipEl,
  maskId,
  navigationButtons,
  onClose,
}: OnboardingShellProps) {
  const { t } = useTranslation();
  const currentStep = steps[activeStep];
  const { Icon } = currentStep;

  const stepContent = (
    <ContentWrapper key={activeStep}>
      <IconCircle>
        <Icon />
      </IconCircle>
      <StepTitle>{t(currentStep.titleKey)}</StepTitle>
      <StepText>{t(currentStep.textKey)}</StepText>
    </ContentWrapper>
  );

  const dots = (
    <DotsContainer>
      {steps.map((_, index) => (
        <Dot key={index} active={index === activeStep} completed={index < activeStep} />
      ))}
    </DotsContainer>
  );

  // ─── Spotlight mode ───────────────────────────────

  if (isSpotlight && targetRect && spotlightRect) {
    const tooltipWidth = tooltipEl?.offsetWidth || 380;
    const tooltipHeight = tooltipEl?.offsetHeight || 300;
    const pos = getTooltipPosition(
      targetRect,
      currentStep.tooltipPlacement || 'bottom',
      tooltipWidth,
      tooltipHeight,
    );

    return (
      <>
        <SpotlightOverlay>
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotlightRect.x}
                  y={spotlightRect.y}
                  width={spotlightRect.width}
                  height={spotlightRect.height}
                  rx={8}
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill={OVERLAY_COLOR} mask={`url(#${maskId})`} />
          </svg>
        </SpotlightOverlay>

        <SpotlightTooltip ref={setTooltipEl} elevation={0} style={{ top: pos.top, left: pos.left }}>
          <TooltipContent>
            {stepContent}
            {dots}
          </TooltipContent>
          <TooltipActions>{navigationButtons}</TooltipActions>
        </SpotlightTooltip>
      </>
    );
  }

  // ─── Dialog mode ──────────────────────────────────

  return (
    <StyledDialog open onClose={onClose}>
      <TopStripe />
      <DialogStepContent>
        {stepContent}
        {dots}
      </DialogStepContent>
      <DialogStepActions>{navigationButtons}</DialogStepActions>
    </StyledDialog>
  );
}

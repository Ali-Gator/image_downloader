import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Box, Button } from '@mui/material';

import { storageGet, storageSet, StorageKeys, useTranslation } from '@utils';

import { steps, TooltipPlacement } from './steps';
import {
  ContentWrapper,
  DialogStepActions,
  DialogStepContent,
  Dot,
  DotsContainer,
  IconCircle,
  SkipButton,
  SpotlightOverlay,
  SpotlightTooltip,
  StepText,
  StepTitle,
  StyledDialog,
  TooltipActions,
  TooltipContent,
  TopStripe,
} from './styles';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_GAP = 12;
const OVERLAY_COLOR = 'rgba(26, 26, 24, 0.4)';

function getTooltipPosition(
  targetRect: TargetRect,
  placement: TooltipPlacement,
  tooltipWidth: number,
  tooltipHeight: number,
) {
  const viewport = { w: window.innerWidth, h: window.innerHeight };
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom':
      top = targetRect.top + targetRect.height + SPOTLIGHT_PADDING + TOOLTIP_GAP;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'top':
      top = targetRect.top - SPOTLIGHT_PADDING - TOOLTIP_GAP - tooltipHeight;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left + targetRect.width + SPOTLIGHT_PADDING + TOOLTIP_GAP;
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - SPOTLIGHT_PADDING - TOOLTIP_GAP - tooltipWidth;
      break;
  }

  // Clamp within viewport
  left = Math.max(8, Math.min(left, viewport.w - tooltipWidth - 8));
  top = Math.max(8, Math.min(top, viewport.h - tooltipHeight - 8));

  return { top, left };
}

export function Onboarding() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipEl, setTooltipEl] = useState<HTMLDivElement | null>(null);
  const rafRef = useRef(0);

  const isLastStep = activeStep === steps.length - 1;
  const currentStep = steps[activeStep];
  const isSpotlight = Boolean(currentStep.targetSelector);

  // Check if onboarding was completed
  useEffect(() => {
    storageGet(StorageKeys.ONBOARDING_COMPLETED, (value) => {
      if (!value) setIsOpen(true);
    });
  }, []);

  // Measure target element when step changes
  useLayoutEffect(() => {
    if (!isOpen || !currentStep.targetSelector) {
      setTargetRect(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(currentStep.targetSelector!);
      if (!el) {
        setTargetRect(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setTargetRect((prev) => {
        if (
          prev &&
          prev.top === rect.top &&
          prev.left === rect.left &&
          prev.width === rect.width &&
          prev.height === rect.height
        ) {
          return prev;
        }
        return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
      });
    };

    measure();

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, activeStep, currentStep.targetSelector]);

  const markCompleted = useCallback(() => {
    storageSet(StorageKeys.ONBOARDING_COMPLETED, true);
  }, []);

  const handleClose = useCallback(() => {
    markCompleted();
    setIsOpen(false);
  }, [markCompleted]);

  const handleNext = useCallback(() => {
    if (!isLastStep) setActiveStep((prev) => prev + 1);
  }, [isLastStep]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
  }, []);

  const handleOptionsYes = useCallback(() => {
    markCompleted();
    setIsOpen(false);
    const optionsUrl = chrome.runtime.getURL('options.html?onboarding=true');
    chrome.tabs.create({ url: optionsUrl });
  }, [markCompleted]);

  if (!isOpen) return null;

  const { Icon } = currentStep;

  // ─── Shared step content ──────────────────────────

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

  const navigationButtons = isLastStep ? (
    <>
      <Button variant="outlined" onClick={handleClose}>
        {t('onboarding_options_no')}
      </Button>
      <Button variant="contained" onClick={handleOptionsYes}>
        {t('onboarding_options_yes')}
      </Button>
    </>
  ) : (
    <>
      <SkipButton onClick={handleClose}>{t('onboarding_skip')}</SkipButton>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {activeStep > 0 && (
          <Button variant="outlined" onClick={handleBack}>
            {t('onboarding_back')}
          </Button>
        )}
        <Button variant="contained" onClick={handleNext}>
          {t('onboarding_next')}
        </Button>
      </Box>
    </>
  );

  // ─── Spotlight mode ───────────────────────────────

  if (isSpotlight && targetRect) {
    const tooltipWidth = tooltipEl?.offsetWidth || 380;
    const tooltipHeight = tooltipEl?.offsetHeight || 300;
    const pos = getTooltipPosition(
      targetRect,
      currentStep.tooltipPlacement || 'bottom',
      tooltipWidth,
      tooltipHeight,
    );

    // SVG overlay with a rounded-rect cutout around the target
    const padTop = targetRect.top - SPOTLIGHT_PADDING;
    const padLeft = targetRect.left - SPOTLIGHT_PADDING;
    const padW = targetRect.width + SPOTLIGHT_PADDING * 2;
    const padH = targetRect.height + SPOTLIGHT_PADDING * 2;

    return (
      <>
        <SpotlightOverlay onClick={handleClose}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <mask id="onboarding-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={padLeft}
                  y={padTop}
                  width={padW}
                  height={padH}
                  rx={8}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill={OVERLAY_COLOR}
              mask="url(#onboarding-spotlight-mask)"
            />
          </svg>
        </SpotlightOverlay>

        <SpotlightTooltip
          ref={setTooltipEl}
          elevation={0}
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <TooltipContent>
            {stepContent}
            {dots}
          </TooltipContent>
          <TooltipActions>{navigationButtons}</TooltipActions>
        </SpotlightTooltip>
      </>
    );
  }

  // ─── Dialog mode (fallback or no target) ──────────

  return (
    <StyledDialog open={isOpen} onClose={handleClose}>
      <TopStripe />
      <DialogStepContent>
        {stepContent}
        {dots}
      </DialogStepContent>
      <DialogStepActions>{navigationButtons}</DialogStepActions>
    </StyledDialog>
  );
}

export default Onboarding;

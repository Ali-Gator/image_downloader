import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { storageSet } from '@utils';

import { SPOTLIGHT_PADDING } from './spotlightUtils';
import { OnboardingStep, TargetRect } from './types';

interface UseOnboardingStateOptions {
  steps: OnboardingStep[];
  storageKey: string;
  shouldOpen: (done: (open: boolean) => void) => void;
}

export function useOnboardingState({ steps, storageKey, shouldOpen }: UseOnboardingStateOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipEl, setTooltipEl] = useState<HTMLDivElement | null>(null);
  const rafRef = useRef(0);

  const isLastStep = activeStep === steps.length - 1;
  const currentStep = steps[activeStep];
  const isSpotlight = Boolean(currentStep.targetSelector);

  // Check if onboarding should show
  useEffect(() => {
    let mounted = true;
    shouldOpen((open) => {
      if (mounted && open) setIsOpen(true);
    });
    return () => {
      mounted = false;
    };
  }, [shouldOpen]);

  // Measure target element when step changes
  useLayoutEffect(() => {
    if (!isOpen || !currentStep.targetSelector) {
      setTargetRect(null);
      return;
    }

    // Scroll target into view when step changes
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    storageSet(storageKey, true);
  }, [storageKey]);

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

  // Compute spotlight padding dimensions
  const spotlightRect = targetRect
    ? {
        x: targetRect.left - SPOTLIGHT_PADDING,
        y: targetRect.top - SPOTLIGHT_PADDING,
        width: targetRect.width + SPOTLIGHT_PADDING * 2,
        height: targetRect.height + SPOTLIGHT_PADDING * 2,
      }
    : null;

  return {
    isOpen,
    activeStep,
    isLastStep,
    currentStep,
    isSpotlight,
    targetRect,
    tooltipEl,
    setTooltipEl,
    spotlightRect,
    markCompleted,
    handleClose,
    handleNext,
    handleBack,
  };
}

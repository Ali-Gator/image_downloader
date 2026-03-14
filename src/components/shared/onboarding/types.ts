import { FC } from 'react';

import { SvgIconProps } from '@mui/material';

import { MessageKey } from '@utils';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface OnboardingStep {
  titleKey: MessageKey;
  textKey: MessageKey;
  Icon: FC<SvgIconProps>;
  /** CSS selector for the spotlight target. If absent, step renders as a centered dialog. */
  targetSelector?: string;
  /** Preferred tooltip placement relative to the target */
  tooltipPlacement?: TooltipPlacement;
}

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

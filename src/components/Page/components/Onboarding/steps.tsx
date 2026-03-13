import { FC } from 'react';

import {
  CheckBoxOutlined,
  CloudDownloadOutlined,
  CollectionsOutlined,
  RefreshOutlined,
  SettingsOutlined,
  TuneOutlined,
} from '@mui/icons-material';
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

export const steps: OnboardingStep[] = [
  {
    titleKey: 'onboarding_welcome_title',
    textKey: 'onboarding_welcome_text',
    Icon: CollectionsOutlined,
  },
  {
    titleKey: 'onboarding_select_title',
    textKey: 'onboarding_select_text',
    Icon: CheckBoxOutlined,
    targetSelector: '[data-onboarding="select-all"]',
    tooltipPlacement: 'bottom',
  },
  {
    titleKey: 'onboarding_filter_title',
    textKey: 'onboarding_filter_text',
    Icon: TuneOutlined,
    targetSelector: '[data-onboarding="filter-section"]',
    tooltipPlacement: 'bottom',
  },
  {
    titleKey: 'onboarding_actions_title',
    textKey: 'onboarding_actions_text',
    Icon: RefreshOutlined,
    targetSelector: '[data-onboarding="rescan-button"]',
    tooltipPlacement: 'bottom',
  },
  {
    titleKey: 'onboarding_download_title',
    textKey: 'onboarding_download_text',
    Icon: CloudDownloadOutlined,
    targetSelector: '[data-onboarding="download-button"]',
    tooltipPlacement: 'bottom',
  },
  {
    titleKey: 'onboarding_options_title',
    textKey: 'onboarding_options_text',
    Icon: SettingsOutlined,
    targetSelector: '[data-onboarding="settings-button"]',
    tooltipPlacement: 'bottom',
  },
];

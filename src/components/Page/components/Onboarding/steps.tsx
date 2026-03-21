import {
  AutoFixHighOutlined,
  CheckBoxOutlined,
  CloudDownloadOutlined,
  CollectionsOutlined,
  RefreshOutlined,
  SettingsOutlined,
  SwapHorizOutlined,
  TuneOutlined,
} from '@mui/icons-material';

import { OnboardingStep } from '@shared/onboarding';

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
    titleKey: 'onboarding_enhance_title',
    textKey: 'onboarding_enhance_text',
    Icon: AutoFixHighOutlined,
    targetSelector: '[data-onboarding="enhance-button"]',
    tooltipPlacement: 'bottom',
  },
  {
    titleKey: 'onboarding_toggle_title',
    textKey: 'onboarding_toggle_text',
    Icon: SwapHorizOutlined,
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

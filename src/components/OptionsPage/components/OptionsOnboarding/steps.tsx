import {
  BugReportOutlined,
  CheckCircleOutlined,
  DriveFileRenameOutlineOutlined,
  FolderOutlined,
  FolderZipOutlined,
  TransformOutlined,
} from '@mui/icons-material';

import { OnboardingStep } from '@shared/onboarding';

export const steps: OnboardingStep[] = [
  {
    titleKey: 'options_onboarding_folder_title',
    textKey: 'options_onboarding_folder_text',
    Icon: FolderOutlined,
    targetSelector: '[data-onboarding="folder-name"]',
    tooltipPlacement: 'bottom',
  },
  {
    titleKey: 'options_onboarding_rename_title',
    textKey: 'options_onboarding_rename_text',
    Icon: DriveFileRenameOutlineOutlined,
    targetSelector: '[data-onboarding="rename-pattern"]',
    tooltipPlacement: 'bottom',
  },
  {
    titleKey: 'options_onboarding_convert_title',
    textKey: 'options_onboarding_convert_text',
    Icon: TransformOutlined,
    targetSelector: '[data-onboarding="convert"]',
    tooltipPlacement: 'bottom',
  },
  {
    titleKey: 'options_onboarding_zip_title',
    textKey: 'options_onboarding_zip_text',
    Icon: FolderZipOutlined,
    targetSelector: '[data-onboarding="zip-archive"]',
    tooltipPlacement: 'bottom',
  },
  {
    titleKey: 'options_onboarding_debug_title',
    textKey: 'options_onboarding_debug_text',
    Icon: BugReportOutlined,
    targetSelector: '[data-onboarding="debug-export"]',
    tooltipPlacement: 'top',
  },
  {
    titleKey: 'options_onboarding_done_title',
    textKey: 'options_onboarding_done_text',
    Icon: CheckCircleOutlined,
  },
];

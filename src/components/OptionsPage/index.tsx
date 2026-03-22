import { FC } from 'react';

import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import DisplaySettingsOutlinedIcon from '@mui/icons-material/DisplaySettingsOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TransformOutlinedIcon from '@mui/icons-material/TransformOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { IconButton, Tooltip } from '@mui/material';

import { useSettingsStore } from '@store';
import { useTranslation } from '@utils';

import {
  AdvancedOptions,
  ConvertOptions,
  DebugLogExport,
  FolderField,
  OptionsOnboarding,
  OrganizeByDomainOption,
  RenamePatternField,
  ReportBugLink,
  ShowOnboardingCheckbox,
  SidePanelOption,
  ZipArchiveOption,
} from './components';
import {
  ContentWrapper,
  FooterNote,
  HeaderLeft,
  HeaderTitle,
  OptionsPageContainer,
  PageHeader,
  SectionCard,
  SectionHeader,
  SectionTitle,
} from './styles';

export const OptionsPage: FC = () => {
  const { t } = useTranslation();
  const { resetDownloadOptions } = useSettingsStore();

  return (
    <OptionsPageContainer>
      <ContentWrapper>
        <PageHeader>
          <HeaderLeft>
            <SettingsOutlinedIcon />
            <HeaderTitle>{t('options_title')}</HeaderTitle>
          </HeaderLeft>
          <Tooltip title={t('reset_btn')}>
            <IconButton onClick={resetDownloadOptions} size="small">
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </PageHeader>

        {/* Behavior */}
        <SectionCard>
          <SectionHeader>
            <DisplaySettingsOutlinedIcon />
            <SectionTitle>{t('section_behavior')}</SectionTitle>
          </SectionHeader>
          <SidePanelOption />
        </SectionCard>

        {/* File Organization */}
        <SectionCard>
          <SectionHeader>
            <FolderOutlinedIcon />
            <SectionTitle>{t('section_file_organization')}</SectionTitle>
          </SectionHeader>
          <FolderField />
          <OrganizeByDomainOption />
          <RenamePatternField />
        </SectionCard>

        {/* Format & Archive */}
        <SectionCard>
          <SectionHeader>
            <TransformOutlinedIcon />
            <SectionTitle>{t('section_format_archive')}</SectionTitle>
          </SectionHeader>
          <ConvertOptions />
          <ZipArchiveOption />
        </SectionCard>

        {/* Advanced */}
        <SectionCard>
          <SectionHeader>
            <TuneOutlinedIcon />
            <SectionTitle>{t('section_advanced')}</SectionTitle>
          </SectionHeader>
          <AdvancedOptions />
        </SectionCard>

        {/* Debug & Other */}
        <SectionCard>
          <SectionHeader>
            <BugReportOutlinedIcon />
            <SectionTitle>{t('section_debug')}</SectionTitle>
          </SectionHeader>
          <DebugLogExport />
          <ReportBugLink />
          <ShowOnboardingCheckbox />
        </SectionCard>

        <FooterNote>{t('options_auto_save_note')}</FooterNote>
      </ContentWrapper>

      <OptionsOnboarding />
    </OptionsPageContainer>
  );
};

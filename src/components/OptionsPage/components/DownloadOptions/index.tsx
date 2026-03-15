import { FC } from 'react';

import {
  ConvertOptions,
  DebugLogExport,
  FolderField,
  InfoMessage,
  OptionsHeader,
  OrganizeByDomainOption,
  RenamePatternField,
  ResetButton,
  ShowOnboardingCheckbox,
  ZipArchiveOption,
} from '..';
import { StyledContainer } from './styles';

export const DownloadOptions: FC = () => {
  return (
    <StyledContainer elevation={2}>
      <OptionsHeader />
      <FolderField />
      <OrganizeByDomainOption />
      <RenamePatternField />
      <ConvertOptions />
      <ZipArchiveOption />
      <ResetButton />
      <ShowOnboardingCheckbox />
      <InfoMessage />
      <DebugLogExport />
    </StyledContainer>
  );
};

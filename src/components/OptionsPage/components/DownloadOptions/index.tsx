import { FC } from 'react';

import {
  ConvertOptions,
  DebugLogExport,
  FolderField,
  InfoMessage,
  OptionsHeader,
  RenamePatternField,
  ResetButton,
  ZipArchiveOption,
} from '..';
import { StyledContainer } from './styles';

export const DownloadOptions: FC = () => {
  return (
    <StyledContainer elevation={2}>
      <OptionsHeader />
      <FolderField />
      <RenamePatternField />
      <ConvertOptions />
      <ZipArchiveOption />
      <ResetButton />
      <InfoMessage />
      <DebugLogExport />
    </StyledContainer>
  );
};

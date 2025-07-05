import { FC } from 'react';

import {
  ConvertOptions,
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
    </StyledContainer>
  );
};
